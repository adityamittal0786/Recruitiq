import { useState, useEffect } from 'react';
import { RadarChart,PolarGrid,PolarAngleAxis,Radar,ResponsiveContainer } from 'recharts';
import { compareCandidate } from '../utils/api.js';
import { ProgressBar, ScoreRing, RecBadge, Spinner, EmptyState } from '../components/ui.jsx';

export default function ComparePage({ candidates, hiringProfile }) {
  const [idA,     setIdA]     = useState('');
  const [idB,     setIdB]     = useState('');
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const s = [...candidates].sort((a,b)=>(b.analysis?.overall_match??0)-(a.analysis?.overall_match??0));
    if (s.length >= 2) { setIdA(String(s[0].id)); setIdB(String(s[1].id)); }
  }, [candidates]);

  if (candidates.length < 2)
    return <EmptyState icon="=" title="Need at least 2 candidates" subtitle="Run an analysis or add candidates first." />;

  const candA = candidates.find(c=>String(c.id)===idA);
  const candB = candidates.find(c=>String(c.id)===idB);

  const handleCompare = async () => {
    if (!candA || !candB) return;
    setLoading(true); setVerdict(null); setError(null);
    try { setVerdict(await compareCandidate(candA, candB, hiringProfile)); }
    catch(e) { setError(e.message); }
    finally  { setLoading(false); }
  };

  return (
    <div className="page">
      <div className="page-title">Candidate Comparison</div>
      <div className="page-sub">Side-by-side AI analysis with a decisive head-to-head verdict</div>

      {/* Selectors */}
      <div style={{ display:'flex',alignItems:'center',gap:16,marginBottom:24,flexWrap:'wrap' }}>
        <CandSelect label="Candidate A" value={idA} onChange={v=>{setIdA(v);setVerdict(null);}} candidates={candidates} excludeId={idB}/>
        <div style={{ color:'var(--text-3)',fontWeight:800,fontSize:18 }}>VS</div>
        <CandSelect label="Candidate B" value={idB} onChange={v=>{setIdB(v);setVerdict(null);}} candidates={candidates} excludeId={idA}/>
        <button className="btn btn-primary" onClick={handleCompare} disabled={loading||!candA||!candB}>
          {loading ? <><Spinner size={15} color="#fff"/> Comparing…</> : 'AI Compare'}
        </button>
      </div>

      {/* Side-by-side */}
      {(candA || candB) && (
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24 }}>
          <CandPane candidate={candA} color={candA?.color}/>
          <CandPane candidate={candB} color={candB?.color}/>
        </div>
      )}

      {/* Radar overlay */}
      {candA?.analysis?.scores && candB?.analysis?.scores && (
        <div className="card" style={{ padding:'18px 20px',marginBottom:20 }}>
          <div style={{ color:'var(--text-1)',fontWeight:600,marginBottom:14,fontSize:14 }}>Skill Radar Overlay</div>
          <div style={{ height:260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={Object.keys(candA.analysis.scores).map(k=>({
                subject: k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),
                A: candA.analysis.scores[k],
                B: candB.analysis.scores[k],
              }))} margin={{top:10,right:36,bottom:10,left:36}}>
                <PolarGrid stroke="rgba(255,255,255,.07)"/>
                <PolarAngleAxis dataKey="subject" tick={{fill:'#64748b',fontSize:11}}/>
                <Radar name={candA.name.split(' ')[0]} dataKey="A" stroke={candA.color} fill={candA.color} fillOpacity={0.18} strokeWidth={2}/>
                <Radar name={candB.name.split(' ')[0]} dataKey="B" stroke={candB.color} fill={candB.color} fillOpacity={0.18} strokeWidth={2}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* AI Verdict */}
      {loading && (
        <div style={{ textAlign:'center',padding:'32px 0' }}>
          <Spinner size={22}/>
          <div style={{ color:'var(--text-3)',marginTop:12,fontSize:13 }}>Running head-to-head analysis…</div>
        </div>
      )}
      {verdict && (
        <div style={{ background:'rgba(99,102,241,.05)',border:'1px solid rgba(99,102,241,.2)',borderRadius:14,padding:24 }}>
          <div style={{ color:'#a5b4fc',fontWeight:700,fontSize:15,display:'flex',alignItems:'center',gap:8,marginBottom:16 }}>
            AI Verdict — {candA?.name} vs {candB?.name}
          </div>
          <div style={{ color:'var(--text-2)',fontSize:13,lineHeight:1.8,whiteSpace:'pre-wrap' }}>{verdict}</div>
        </div>
      )}
      {error && <div style={{ color:'var(--rose)',fontSize:13,marginTop:12 }}>! {error}</div>}
    </div>
  );
}

function CandSelect({ label, value, onChange, candidates, excludeId }) {
  return (
    <div>
      <div style={{ fontSize:11,fontWeight:600,color:'var(--text-3)',marginBottom:5,textTransform:'uppercase',letterSpacing:'.06em' }}>{label}</div>
      <select className="field" style={{ width:240 }} value={value} onChange={e=>onChange(e.target.value)}>
        <option value="">Select…</option>
        {[...candidates]
          .filter(c=>String(c.id)!==excludeId)
          .sort((a,b)=>(b.analysis?.overall_match??0)-(a.analysis?.overall_match??0))
          .map(c=><option key={c.id} value={String(c.id)}>{c.name} · {c.analysis?.overall_match??'?'}/100</option>)}
      </select>
    </div>
  );
}

function CandPane({ candidate }) {
  if (!candidate) return (
    <div style={{ background:'var(--glass)',border:'1px dashed var(--border)',borderRadius:14,height:200,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-3)',fontSize:13 }}>
      Select a candidate
    </div>
  );
  const { analysis, name, title, avatar, color } = candidate;
  return (
    <div style={{ background:'var(--glass)',border:`1px solid ${color}30`,borderRadius:14,padding:20 }}>
      <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:16 }}>
        <div style={{ width:44,height:44,borderRadius:10,background:`${color}1e`,border:`2px solid ${color}44`,display:'flex',alignItems:'center',justifyContent:'center',color,fontSize:16,fontWeight:800,flexShrink:0 }}>
          {avatar}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ color:'var(--text-1)',fontWeight:700,fontSize:15 }}>{name}</div>
          <div style={{ color:'var(--text-3)',fontSize:12 }}>{title}</div>
        </div>
        <div style={{ display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5 }}>
          {analysis && <ScoreRing score={analysis.overall_match} size={50}/>}
          <RecBadge rec={analysis?.hiring_recommendation}/>
        </div>
      </div>
      {analysis?.scores && Object.entries(analysis.scores).map(([k,v])=><ProgressBar key={k} label={k} value={v}/>)}
      {analysis?.career_trajectory && (
        <div style={{ marginTop:10,fontSize:11,color:'var(--text-3)' }}>
          Trajectory: <span style={{ color:analysis.career_trajectory==='ascending'?'var(--emerald)':'var(--amber)',fontWeight:600,textTransform:'capitalize' }}>{analysis.career_trajectory}</span>
        </div>
      )}
      {analysis?.strengths?.slice(0,2).map((s,i)=>(
        <div key={i} style={{ color:'var(--text-3)',fontSize:11,marginTop:4 }}><span style={{color:'var(--emerald)'}}>+ </span>{s}</div>
      ))}
      {analysis?.risks?.[0] && (
        <div style={{ color:'var(--text-3)',fontSize:11,marginTop:3 }}><span style={{color:'var(--amber)'}}>! </span>{analysis.risks[0]}</div>
      )}
    </div>
  );
}
