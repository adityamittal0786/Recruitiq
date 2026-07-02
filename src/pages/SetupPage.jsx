import { SAMPLE_JD, MOCK_CANDIDATES } from '../utils/mockData.js';
import { Spinner } from '../components/ui.jsx';

export default function SetupPage({ onAnalyze, analyzing, jobDescription, setJobDescription, candidates }) {
  const jd   = jobDescription ?? SAMPLE_JD;
  const setJd = setJobDescription ?? (() => {});
  const pool = candidates?.length > 0 ? candidates : MOCK_CANDIDATES;

  return (
    <div className="page" style={{ maxWidth:1020,margin:'0 auto' }}>
      <div style={{ marginBottom:28 }}>
        <div className="page-title">AI Recruitment Setup</div>
        <div className="page-sub">
          Paste your job description and click Run. Candidates are analyzed in batches of 8 —
          results appear live, and you can load more at any time.
        </div>
      </div>

      <div className="setup-grid" style={{ display:'grid',gridTemplateColumns:'1.1fr 0.9fr',gap:24,marginBottom:28 }}>
        {/* JD editor */}
        <div className="setup-jd-section">
          <SectionDot color="var(--indigo)" label="Job Description" />
          <textarea className="field" value={jd} onChange={e => setJd(e.target.value)}
            rows={22} placeholder="Paste your job description here…" style={{ resize:'vertical',minHeight:'300px' }} />
        </div>

        {/* Candidate pool */}
        <div>
          <SectionDot color="var(--cyan)" label={`Candidates (${pool.length})`} />
          <div style={{ display:'flex',flexDirection:'column',gap:8,maxHeight:420,overflowY:'auto',marginBottom:12 }}>
            {pool.slice(0,12).map(c => (
              <div key={c.id ?? c.candidate_id} className="card" style={{ padding:11,display:'flex',alignItems:'center',gap:10 }}>
                <div style={{ width:34,height:34,borderRadius:8,background:`${c.color}1e`,border:`1px solid ${c.color}40`,display:'flex',alignItems:'center',justifyContent:'center',color:c.color,fontSize:11,fontWeight:800,flexShrink:0 }}>
                  {c.avatar}
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ color:'var(--text-1)',fontWeight:600,fontSize:12 }}>{c.name}</div>
                  <div style={{ color:'var(--text-3)',fontSize:11,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{c.title}</div>
                </div>
                <span style={{ color:c.analysis?'var(--emerald)':'var(--text-4)',fontSize:11,fontWeight:600 }}>
                  {c.analysis ? `${c.analysis.overall_match}` : '–'}
                </span>
              </div>
            ))}
            {pool.length > 12 && (
              <div style={{ color:'var(--text-3)',fontSize:12,textAlign:'center',padding:8 }}>+{pool.length - 12} more</div>
            )}
          </div>

          <div style={{ background:'rgba(99,102,241,.06)',border:'1px solid rgba(99,102,241,.14)',borderRadius:10,padding:14 }}>
            <div style={{ color:'#a5b4fc',fontWeight:600,fontSize:11,marginBottom:8,textTransform:'uppercase',letterSpacing:'.08em' }}>How it works</div>
            {[
              '- Analyzes first 8 candidates immediately',
              '- Click "Analyze Next 8" to load more',
              '- Cards appear live as each one finishes',
              '- Copilot + Compare unlock after first batch',
            ].map((s,i) => (
              <div key={i} style={{ color:'var(--text-3)',fontSize:12,marginBottom:5 }}>{s}</div>
            ))}
          </div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={() => onAnalyze(jd, pool)}
        disabled={analyzing || !jd.trim()} style={{ fontSize:15,padding:'13px 30px' }}>
        {analyzing ? <><Spinner size={16} color="#fff" /> Analyzing…</> : 'Run AI Analysis'}
      </button>
    </div>
  );
}

function SectionDot({ color, label }) {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:7,marginBottom:10 }}>
      <div style={{ width:7,height:7,borderRadius:'50%',background:color }}/>
      <span style={{ color:'var(--text-1)',fontWeight:600,fontSize:13 }}>{label}</span>
    </div>
  );
}
