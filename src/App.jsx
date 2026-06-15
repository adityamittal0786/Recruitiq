import { useState, useCallback, useRef } from 'react';
import Sidebar        from './components/Sidebar.jsx';
import LoadingOverlay from './components/LoadingOverlay.jsx';
import LandingPage    from './pages/LandingPage.jsx';
import SetupPage      from './pages/SetupPage.jsx';
import CandidatesPage from './pages/CandidatesPage.jsx';
import AnalyticsPage  from './pages/AnalyticsPage.jsx';
import CopilotPage    from './pages/CopilotPage.jsx';
import ComparePage    from './pages/ComparePage.jsx';
import { analyzeJobDescription, analyzeCandidate } from './utils/api.js';
import { SAMPLE_JD, MOCK_CANDIDATES } from './utils/mockData.js';

const BATCH = 8;
const DELAY = 1800; // ms between candidates — keeps free-tier TPM safe

const COLORS = [
  '#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b',
  '#f43f5e','#0ea5e9','#a855f7','#14b8a6','#f97316',
  '#6366f1','#22d3ee','#34d399','#fbbf24','#fb7185',
  '#818cf8','#c084fc','#38bdf8','#4ade80','#facc15',
];

function initials(n) { return (n||'??').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(); }
function makeId()    { return Date.now(); }

function fallbackAnalysis(msg) {
  return {
    scores:{ technical_depth:0,leadership:0,growth_potential:0,communication:0,domain_expertise:0,culture_fit:0 },
    overall_match:0, strengths:[], weaknesses:['Analysis failed — will retry'], risks:[msg],
    hidden_talents:[], transferable_skills:{ detected:false,examples:[] },
    career_trajectory:'plateau', hiring_recommendation:'maybe',
    recommendation_summary:'Could not be analyzed.', interview_angles:[],
    _failed: true,
  };
}

export default function App() {
  const [page,          setPage]          = useState('landing');
  const [candidates,    setCandidates]    = useState([]);   // all candidates, some may lack .analysis
  const [hiringProfile, setHiringProfile] = useState(null);
  const [jobDescription,setJobDescription]= useState(SAMPLE_JD);
  const [pointer,       setPointer]       = useState(0);    // index: how many have been analyzed
  const [analyzing,     setAnalyzing]     = useState(false);
  const [progress,      setProgress]      = useState({ current:0, total:0, phase:'' });
  const [copilotKey,    setCopilotKey]    = useState(0);
  const [copilotQuery,  setCopilotQuery]  = useState('');

  // Keep a ref to latest candidates so runBatch closures always see fresh state
  const candsRef = useRef([]);
  const updateCands = (arr) => { candsRef.current = arr; setCandidates(arr); };

  // ── Run a batch starting at startIdx ─────────────────────────────────────
  const runBatch = useCallback(async (all, profile, startIdx) => {
    const end = Math.min(startIdx + BATCH, all.length);
    setProgress({ current:0, total: end - startIdx, phase:'analyzing' });

    const working = [...all];
    for (let i = startIdx; i < end; i++) {
      let analysis;
      try {
        analysis = await analyzeCandidate(working[i], profile);
      } catch(e) {
        analysis = fallbackAnalysis(e.message);
      }
      working[i] = { ...working[i], analysis };
      updateCands([...working]);
      setProgress({ current: i - startIdx + 1, total: end - startIdx, phase:'analyzing' });
      if (i < end - 1) await new Promise(r => setTimeout(r, DELAY));
    }
    setPointer(end);
    return working;
  }, []);

  // ── Initial "Run Analysis" from Setup ─────────────────────────────────────
  const handleAnalyze = useCallback(async (jd, rawCandidates) => {
    setAnalyzing(true);
    setProgress({ current:0, total:1, phase:'jd' });

    // Load all candidates immediately (unanalyzed)
    const all = rawCandidates.map((c,i) => ({
      ...c,
      id:     c.id ?? makeId() + i,
      avatar: c.avatar ?? initials(c.name),
      color:  c.color  ?? COLORS[i % COLORS.length],
      analysis: null,
    }));
    updateCands(all);
    setPointer(0);

    try {
      const profile = await analyzeJobDescription(jd);
      setHiringProfile(profile);
      setProgress({ current:1, total:1, phase:'jd' });
      await runBatch(all, profile, 0);
      setPage('candidates');
    } catch(e) {
      alert('Failed to start analysis:\n\n' + e.message);
    } finally {
      setAnalyzing(false);
    }
  }, [runBatch]);

  // ── "Analyze Next 8" from Candidates page ────────────────────────────────
  const handleAnalyzeMore = useCallback(async () => {
    if (analyzing || !hiringProfile) return;
    setAnalyzing(true);
    try {
      await runBatch(candsRef.current, hiringProfile, pointer);
    } catch(e) {
      alert('Batch failed:\n' + e.message);
    } finally {
      setAnalyzing(false);
    }
  }, [analyzing, hiringProfile, pointer, runBatch]);

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const addCandidate = useCallback(async (data) => {
    const c = {
      ...data,
      id:     makeId(),
      avatar: initials(data.name),
      color:  COLORS[candsRef.current.length % COLORS.length],
      analysis: null,
      addedAt: new Date().toISOString(),
    };
    const next = [...candsRef.current, c];
    updateCands(next);

    if (hiringProfile && data.resume) {
      setAnalyzing(true);
      try {
        const analysis = await analyzeCandidate(c, hiringProfile);
        const updated  = candsRef.current.map(x => x.id === c.id ? { ...x, analysis } : x);
        updateCands(updated);
      } catch {}
      finally { setAnalyzing(false); }
    }
  }, [hiringProfile]);

  const editCandidate = useCallback((updated) => {
    updateCands(candsRef.current.map(c => c.id === updated.id ? { ...c, ...updated } : c));
  }, []);

  const deleteCandidate = useCallback((id) => {
    updateCands(candsRef.current.filter(c => c.id !== id));
  }, []);

  const recalculate = useCallback(async (candidate) => {
    if (!hiringProfile) return;
    try {
      const analysis = await analyzeCandidate(candidate, hiringProfile);
      updateCands(candsRef.current.map(c => c.id === candidate.id ? { ...c, analysis } : c));
    } catch(e) { alert('Recalc failed: ' + e.message); }
  }, [hiringProfile]);

  const askCopilot = useCallback((query) => {
    setCopilotQuery(query); setCopilotKey(k => k+1); setPage('copilot');
  }, []);

  const analyzed = candidates.some(c => c.analysis);

  return (
    <div className="app-shell">
      {page !== 'landing' && (
        <Sidebar activePage={page} setActivePage={setPage}
          candidateCount={candidates.length} analyzed={analyzed} />
      )}

      <main className="app-main">
        {page==='landing'    && <LandingPage onStart={() => setPage('setup')} />}
        {page==='setup'      && (
          <SetupPage
            onAnalyze={handleAnalyze} analyzing={analyzing}
            jobDescription={jobDescription} setJobDescription={setJobDescription}
            candidates={candidates}
          />
        )}
        {page==='candidates' && (
          <CandidatesPage
            candidates={candidates}
            hiringProfile={hiringProfile}
            onAskCopilot={askCopilot}
            onAddCandidate={addCandidate}
            onEditCandidate={editCandidate}
            onDeleteCandidate={deleteCandidate}
            onRecalculate={recalculate}
            onAnalyzeMore={handleAnalyzeMore}
            analyzing={analyzing}
            analysisProgress={progress}
            pointer={pointer}
          />
        )}
        {page==='analytics'  && <AnalyticsPage candidates={candidates.filter(c=>c.analysis)} />}
        {page==='copilot'    && (
          <CopilotPage key={copilotKey}
            candidates={candidates.filter(c=>c.analysis)}
            hiringProfile={hiringProfile} initialQuery={copilotQuery} />
        )}
        {page==='compare'    && (
          <ComparePage candidates={candidates.filter(c=>c.analysis)} hiringProfile={hiringProfile} />
        )}
      </main>

      {/* Only show full overlay for initial JD analysis phase */}
      {analyzing && progress.phase === 'jd' && (
        <LoadingOverlay current={0} total={1} />
      )}
    </div>
  );
}
