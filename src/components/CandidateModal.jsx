import { useState, useEffect } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import { ScoreRing, ProgressBar, RecBadge, Tag, Spinner, Divider } from './ui.jsx';
import { generateInterviewQuestions } from '../utils/api.js';

export default function CandidateModal({ candidate, hiringProfile, initialTab = 'profile', onClose, onEdit }) {
  const [tab,     setTab]     = useState(initialTab);
  const [qs,      setQs]      = useState(null);
  const [qsLoad,  setQsLoad]  = useState(false);
  const [qsErr,   setQsErr]   = useState(null);

  const { analysis, name, title, avatar, color, resume, email, linkedin, portfolio, notes } = candidate;

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  useEffect(() => {
    if (initialTab === 'questions' && !qs) genQs();
  }, []);

  async function genQs() {
    setQsLoad(true); setQsErr(null);
    try { setQs(await generateInterviewQuestions(candidate, hiringProfile, analysis)); }
    catch (e) { setQsErr(e.message); }
    finally   { setQsLoad(false); }
  }

  const radarData = analysis?.scores
    ? Object.entries(analysis.scores).map(([k, v]) => ({
        subject: k.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase()), value: v,
      }))
    : [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div style={{ width:52,height:52,borderRadius:13,background:`${color}1e`,border:`2px solid ${color}50`,display:'flex',alignItems:'center',justifyContent:'center',color,fontSize:19,fontWeight:800,flexShrink:0 }}>
            {avatar}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:18,fontWeight:700,color:'var(--text-1)' }}>{name}</div>
            <div style={{ fontSize:12,color:'var(--text-3)',display:'flex',gap:10,marginTop:2,flexWrap:'wrap' }}>
              <span>{title}</span>
              {email    && <span>· {email}</span>}
              {linkedin && <a href={linkedin} target="_blank" rel="noreferrer" style={{color:'var(--indigo)'}}>LinkedIn ↗</a>}
              {portfolio&& <a href={portfolio}target="_blank" rel="noreferrer" style={{color:'var(--cyan)'}}>Portfolio ↗</a>}
            </div>
          </div>
          {analysis && <ScoreRing score={analysis.overall_match} size={56} />}
          <RecBadge rec={analysis?.hiring_recommendation} style={{ padding:'6px 14px',fontSize:12 }} />
          {onEdit && (
            <button className="btn btn-secondary" style={{padding:'7px 14px',fontSize:12}} onClick={() => { onClose(); onEdit(candidate); }}>Edit</button>
          )}
          <button className="close-btn" onClick={onClose}>x</button>
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          {[['profile','Profile'],['analysis','Analysis'],['questions','Interview Qs']].map(([id,label]) => (
            <button key={id} className={`tab${tab===id?' active':''}`} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex:1,overflowY:'auto',padding:24 }}>

          {/* ── PROFILE TAB ── */}
          {tab === 'profile' && (
            <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
              {radarData.length > 0 && (
                <div style={{ height:240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} margin={{top:10,right:34,bottom:10,left:34}}>
                      <PolarGrid stroke="rgba(255,255,255,.07)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill:'#64748b',fontSize:11 }} />
                      <Radar dataKey="value" stroke={color} fill={color} fillOpacity={0.18} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {analysis?.recommendation_summary && (
                <div style={{ background:'rgba(99,102,241,.07)',border:'1px solid rgba(99,102,241,.2)',borderRadius:10,padding:16 }}>
                  <div style={{ color:'#a5b4fc',fontWeight:600,marginBottom:6,fontSize:12,textTransform:'uppercase',letterSpacing:'.06em' }}>AI Assessment</div>
                  <div style={{ color:'var(--text-2)',fontSize:13,lineHeight:1.7 }}>{analysis.recommendation_summary}</div>
                </div>
              )}

              {analysis?.transferable_skills?.detected && (
                <div style={{ background:'rgba(245,158,11,.07)',border:'1px solid rgba(245,158,11,.2)',borderRadius:10,padding:16 }}>
                  <div style={{ color:'var(--amber)',fontWeight:600,marginBottom:8,display:'flex',alignItems:'center',gap:6,fontSize:12,textTransform:'uppercase',letterSpacing:'.06em' }}>Transferable Skill Match Detected</div>
                  {analysis.transferable_skills.examples?.map((ex,i) => (
                    <div key={i} style={{ color:'var(--text-2)',fontSize:12,marginBottom:4,lineHeight:1.5 }}>• {ex}</div>
                  ))}
                </div>
              )}

              {analysis?.scores && (
                <div>
                  <div className="section-title">Dimension Scores</div>
                  {Object.entries(analysis.scores).map(([k,v]) => <ProgressBar key={k} label={k} value={v} />)}
                </div>
              )}

              {analysis?.career_trajectory && (
                <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                  <Tag color={analysis.career_trajectory === 'ascending' ? '#10b981' : '#f59e0b'}>
                    Trajectory: {analysis.career_trajectory}
                  </Tag>
                  {analysis.hidden_talents?.map((ht,i) => <Tag key={i} color="var(--cyan)">{ht}</Tag>)}
                </div>
              )}

              {notes && (
                <div style={{ background:'var(--glass)',border:'1px solid var(--border)',borderRadius:10,padding:14 }}>
                  <div className="section-title">Recruiter Notes</div>
                  <div style={{ color:'var(--text-2)',fontSize:13,lineHeight:1.6 }}>{notes}</div>
                </div>
              )}

              <Divider label="Resume" />
              <pre style={{ color:'var(--text-3)',fontSize:11.5,lineHeight:1.75,whiteSpace:'pre-wrap',fontFamily:'inherit',background:'var(--glass)',border:'1px solid var(--border)',borderRadius:8,padding:14 }}>
                {resume}
              </pre>
            </div>
          )}

          {/* ── ANALYSIS TAB ── */}
          {tab === 'analysis' && analysis && (
            <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14 }}>
                <InsightPanel title="Strengths"    items={analysis.strengths}  color="var(--emerald)" bg="rgba(16,185,129,.07)"  />
                <InsightPanel title="Weaknesses"  items={analysis.weaknesses} color="var(--amber)"   bg="rgba(245,158,11,.07)" />
                <InsightPanel title="Hiring Risks" items={analysis.risks}     color="var(--rose)"    bg="rgba(244,63,94,.07)"  />
              </div>
              {analysis.interview_angles?.length > 0 && (
                <div style={{ background:'rgba(34,211,238,.07)',border:'1px solid rgba(34,211,238,.18)',borderRadius:10,padding:16 }}>
                  <div style={{ color:'var(--cyan)',fontWeight:600,marginBottom:10,fontSize:12,textTransform:'uppercase',letterSpacing:'.06em' }}>Interview Focus Areas</div>
                  <div style={{ display:'flex',flexWrap:'wrap' }}>
                    {analysis.interview_angles.map((a,i) => <Tag key={i} color="var(--cyan)">{a}</Tag>)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── QUESTIONS TAB ── */}
          {tab === 'questions' && (
            <div>
              {!qs && !qsLoad && (
                <div style={{ textAlign:'center',padding:'48px 0' }}>
                  <div style={{ fontSize:44,marginBottom:12 }}>Q</div>
                  <div style={{ color:'var(--text-2)',fontWeight:500,marginBottom:6 }}>Generate personalized interview questions</div>
                  <div style={{ color:'var(--text-3)',fontSize:12,marginBottom:22 }}>Tailored specifically to {name}'s profile and gaps</div>
                  <button className="btn btn-primary" onClick={genQs}>Generate Questions</button>
                  {qsErr && <div style={{ color:'var(--rose)',fontSize:12,marginTop:12 }}>Error: {qsErr}</div>}
                </div>
              )}
              {qsLoad && (
                <div style={{ textAlign:'center',padding:'48px 0' }}>
                  <Spinner size={24} /><div style={{ color:'var(--text-3)',marginTop:12,fontSize:13 }}>Crafting personalized questions…</div>
                </div>
              )}
              {qs && (
                <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
                  {Object.entries(qs).map(([cat,items]) => (
                    <QuestionSection key={cat} category={cat} questions={items} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InsightPanel({ title, items, color, bg }) {
  return (
    <div style={{ background:bg,border:`1px solid ${color}28`,borderRadius:10,padding:14 }}>
      <div style={{ color,fontWeight:600,marginBottom:10,fontSize:12,textTransform:'uppercase',letterSpacing:'.06em' }}>{title}</div>
      {items?.map((item,i) => (
        <div key={i} style={{ color:'var(--text-2)',fontSize:12,marginBottom:6,lineHeight:1.5 }}>• {item}</div>
      ))}
      {(!items||items.length===0) && <div style={{ color:'var(--text-4)',fontSize:12 }}>None identified</div>}
    </div>
  );
}

const CAT_LABELS = { technical:'Technical', behavioral:'Behavioral', leadership:'Leadership', gap_validation:'Gap Validation' };
function QuestionSection({ category, questions }) {
  return (
    <div style={{ background:'var(--glass)',border:'1px solid var(--border)',borderRadius:10,padding:16 }}>
      <div style={{ color:'#a5b4fc',fontWeight:600,marginBottom:14,fontSize:12,textTransform:'uppercase',letterSpacing:'.06em' }}>{CAT_LABELS[category]??category}</div>
      {questions?.map((q,i) => (
        <div key={i} style={{ marginBottom:14 }}>
          <div style={{ color:'var(--text-1)',fontSize:13,fontWeight:500,marginBottom:4,lineHeight:1.5 }}>{i+1}. {q.question}</div>
          <div style={{ color:'var(--text-3)',fontSize:11.5,paddingLeft:14,lineHeight:1.5 }}>↳ {q.rationale}</div>
        </div>
      ))}
    </div>
  );
}
