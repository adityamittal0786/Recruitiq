const ENDPOINT = 'http://localhost:3001/api/ai';

// ─── Core request ─────────────────────────────────────────────────────────────
async function callAI(messages, systemPrompt, jsonMode = false, bulk = false) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      max_tokens: 1200,
      system:     systemPrompt,
      messages,
      _bulk:      bulk,   // tells server to use fast model for bulk ops
    })
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(e.error || `API error ${res.status}`);
  }

  const data = await res.json();
  const text = data.content?.map(b => b.text ?? '').join('') ?? '';

  if (!jsonMode) return text;

  // Robust JSON extraction
  try {
    return JSON.parse(text.replace(/^```(?:json)?\n?|\n?```$/gm, '').trim());
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch {} }
    throw new Error('Failed to parse AI response as JSON');
  }
}

// ─── Job Description Analysis (smart model, called once) ──────────────────────
export async function analyzeJobDescription(jd) {
  return callAI(
    [{ role: 'user', content: `Analyze this job description:\n\n${jd}` }],
    `You are an elite technical recruiter. Extract a hiring profile from this JD.
Return ONLY valid JSON — no markdown, no extra text:
{
  "role": "string",
  "seniority": "string",
  "requiredSkills": ["string"],
  "preferredSkills": ["string"],
  "leadershipLevel": "none|lead|manager|director",
  "industryContext": "string",
  "cultureFit": ["string"],
  "keyPriorities": ["string"],
  "redFlags": ["string"]
}`,
    true,
    false  // use smart model
  );
}

// ─── Candidate Analysis (fast model, called per candidate) ────────────────────
export async function analyzeCandidate(candidate, hiringProfile) {
  const prompt = `
Role: ${hiringProfile.role} (${hiringProfile.seniority})
Required: ${hiringProfile.requiredSkills?.join(', ')}
Preferred: ${hiringProfile.preferredSkills?.join(', ')}
Leadership: ${hiringProfile.leadershipLevel}
Priorities: ${hiringProfile.keyPriorities?.join(', ')}

RESUME:
${candidate.resume?.slice(0, 2500)}`.trim();

  return callAI(
    [{ role: 'user', content: prompt }],
    `You are a senior technical recruiter. Analyze this candidate against the job.
Detect transferable skills (e.g. "AWS ECS" → container orchestration).
Return ONLY valid JSON:
{
  "scores": {
    "technical_depth": 0-100,
    "leadership": 0-100,
    "growth_potential": 0-100,
    "communication": 0-100,
    "domain_expertise": 0-100,
    "culture_fit": 0-100
  },
  "overall_match": 0-100,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "risks": ["string"],
  "hidden_talents": ["string"],
  "transferable_skills": { "detected": boolean, "examples": ["string"] },
  "career_trajectory": "ascending|plateau|declining|pivot",
  "hiring_recommendation": "strong_hire|hire|maybe|pass",
  "recommendation_summary": "string",
  "interview_angles": ["string"]
}`,
    true,
    true  // use fast bulk model
  );
}

// ─── Interview Questions (smart model) ────────────────────────────────────────
export async function generateInterviewQuestions(candidate, hiringProfile, analysis) {
  return callAI(
    [{ role: 'user', content:
      `Role: ${hiringProfile?.role ?? 'Senior Engineer'}\n` +
      `Candidate: ${candidate.name}\n` +
      `Strengths: ${analysis?.strengths?.join('; ')}\n` +
      `Weaknesses: ${analysis?.weaknesses?.join('; ')}\n` +
      `Risks: ${analysis?.risks?.join('; ')}`
    }],
    `You are an expert technical interviewer. Generate a personalized question set.
Return ONLY valid JSON:
{
  "technical":      [{"question":"string","rationale":"string"}],
  "behavioral":     [{"question":"string","rationale":"string"}],
  "leadership":     [{"question":"string","rationale":"string"}],
  "gap_validation": [{"question":"string","rationale":"string"}]
}
3 questions per category minimum. Make them specific to THIS candidate.`,
    true,
    false  // smart model for quality
  );
}

// ─── Recruiter Copilot (smart model) ─────────────────────────────────────────
export async function askCopilot(history, hiringProfile, summaries) {
  return callAI(
    history,
    `You are an elite AI Recruiter Copilot with full context on this hiring search.

HIRING PROFILE: ${JSON.stringify(hiringProfile ?? {})}

CANDIDATE SUMMARIES: ${JSON.stringify(summaries)}

Answer with specific candidate references, scores, and actionable insights.
Be direct and opinionated — recruiters need clear recommendations, not hedged answers.`,
    false,
    false  // smart model for copilot
  );
}

// ─── Candidate Comparison (smart model) ──────────────────────────────────────
export async function compareCandidate(cA, cB, hiringProfile) {
  return callAI(
    [{ role: 'user', content:
      `Compare these two candidates for ${hiringProfile?.role ?? 'the role'}.\n\n` +
      `A: ${cA.name} | Score: ${cA.analysis?.overall_match}/100 | ${cA.analysis?.hiring_recommendation}\n` +
      `Strengths: ${cA.analysis?.strengths?.join('; ')}\n` +
      `Risks: ${cA.analysis?.risks?.join('; ')}\n\n` +
      `B: ${cB.name} | Score: ${cB.analysis?.overall_match}/100 | ${cB.analysis?.hiring_recommendation}\n` +
      `Strengths: ${cB.analysis?.strengths?.join('; ')}\n` +
      `Risks: ${cB.analysis?.risks?.join('; ')}`
    }],
    `You are a VP of Engineering making a final hiring decision. Be direct.
Structure: 1) Head-to-head on top priorities 2) Winner per dimension 3) Final recommendation.
Pick a clear winner — don't hedge.`,
    false,
    false
  );
}
