# RecruitIQ — AI Recruitment Platform

Rank candidates the way a great recruiter thinks — by understanding career trajectory,
skill depth, and behavioral signals, not just keywords.

## Setup

**1. Install dependencies**
```
npm install
```

**2. Get a free API key**

Go to https://console.groq.com — sign up free, create an API key.

**3. Add your key**
```
cp .env.example .env
```
Open `.env` and set:
```
GROQ_API_KEY=gsk_your_key_here
```

**4. Run**
```
npm run dev
```

Open http://localhost:5173

---

## How to use

1. **Landing** → click "Start Recruiting"
2. **Setup** → paste your job description, review the candidate list
3. Click **Run AI Analysis** — takes ~30 seconds for 5 candidates
4. **Candidates** → browse ranked results, click any card for full profile
5. **Analytics** → charts, KPIs, hidden talent report
6. **Copilot** → ask anything about your candidates
7. **Compare** → head-to-head AI verdict between two candidates

## Add your own candidates

On the Candidates page click **+ Add Candidate**, fill in the form,
paste the resume text, and hit Add. The AI scores them automatically.

## Features

- Multi-dimensional scoring: technical depth, leadership, growth potential, communication
- Hidden transferable skill detection
- Explainable AI — strengths, weaknesses, risks per candidate
- Drag & drop resume upload
- Edit / delete / recalculate scores
- AI Recruiter Copilot chat
- Radar charts, skill comparison, interview question generator
