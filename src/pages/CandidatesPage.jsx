import { useState } from 'react';
import CandidateCard     from '../components/CandidateCard.jsx';
import CandidateModal    from '../components/CandidateModal.jsx';
import AddCandidateModal from '../components/AddCandidateModal.jsx';
import ConfirmDialog     from '../components/ConfirmDialog.jsx';
import { EmptyState, Spinner, Tag, Skeleton } from '../components/ui.jsx';

export default function CandidatesPage({
  candidates, hiringProfile, onAskCopilot,
  onAddCandidate, onEditCandidate, onDeleteCandidate, onRecalculate,
  onAnalyzeMore, analyzing, analysisProgress, pointer,
}) {
  const [view,         setView]         = useState(null);
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [recalcId,     setRecalcId]     = useState(null);
  const [showAdd,      setShowAdd]      = useState(false);
  const [search,       setSearch]       = useState('');
  const [sortBy,       setSortBy]       = useState('score');

  const analyzed  = candidates.filter(c => c.analysis && !c.analysis._failed);
  const pending   = candidates.filter(c => !c.analysis || c.analysis._failed);
  const remaining = candidates.length - pointer;          // truly unanalyzed
  const inBatch   = analyzing && analysisProgress.phase === 'analyzing';

  // Sort analyzed candidates
  const sorted = [...analyzed]
    .filter(c =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'score') return (b.analysis?.overall_match??0) - (a.analysis?.overall_match??0);
      if (sortBy === 'name')  return a.name.localeCompare(b.name);
      return 0;
    });

  if (candidates.length === 0) {
    return (
      <EmptyState icon="👥" title="No candidates yet"
        subtitle="Go to Setup and run an AI analysis, or add candidates manually."
        action={<button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Candidate</button>}
      />
    );
  }

  const handleDelete = () => { onDeleteCandidate(deleteTarget.id); setDeleteTarget(null); };
  const handleRecalc = async (c) => {
    setRecalcId(c.id); await onRecalculate(c); setRecalcId(null);
  };

  const strongHires = analyzed.filter(c => c.analysis?.hiring_recommendation === 'strong_hire').length;
  const hidden      = analyzed.filter(c => c.analysis?.transferable_skills?.detected).length;

  return (
    <div className="page">

      {/* ── Header ── */}
      <div style={{ display:'flex',alignItems:'flex-start',gap:12,flexWrap:'wrap',marginBottom:8 }}>
        <div>
          <div className="page-title">Candidate Rankings</div>
          <div style={{ color:'var(--text-3)',fontSize:13,marginTop:3 }}>
            {analyzed.length} analyzed · {pending.length} pending
            {hiringProfile?.role && <> · <span style={{color:'var(--indigo)'}}>{hiringProfile.role}</span></>}
          </div>
        </div>
        <button className="btn btn-primary" style={{ marginLeft:'auto',padding:'9px 18px',fontSize:13 }}
          onClick={() => setShowAdd(true)}>+ Add Candidate</button>
      </div>

      {/* ── Stats ── */}
      <div style={{ display:'flex',gap:12,marginBottom:20,flexWrap:'wrap' }}>
        <Chip icon="⭐" label="Strong Hires"   value={strongHires}          color="var(--emerald)" />
        <Chip icon="🔄" label="Hidden Talents" value={hidden}               color="var(--amber)"  />
        <Chip icon="⏳" label="Pending"        value={pending.length}       color="var(--text-3)" />
        {hiringProfile?.seniority && <Chip icon="🎯" label="Seniority" value={hiringProfile.seniority} color="var(--cyan)" />}
      </div>

      {/* ── Hiring profile banner ── */}
      {hiringProfile && (
        <div style={{ background:'rgba(99,102,241,.05)',border:'1px solid rgba(99,102,241,.13)',borderRadius:12,padding:'12px 18px',marginBottom:20,display:'flex',gap:24,flexWrap:'wrap',alignItems:'flex-start' }}>
          <Item label="Leadership"    value={hiringProfile.leadershipLevel} />
          <Item label="Industry"      value={hiringProfile.industryContext}  />
          <div>
            <div style={{ color:'var(--indigo)',fontSize:11,fontWeight:600,marginBottom:4,textTransform:'uppercase',letterSpacing:'.06em' }}>Required Skills</div>
            <div>{hiringProfile.requiredSkills?.slice(0,6).map((s,i) => <Tag key={i} color="var(--indigo)">{s}</Tag>)}</div>
          </div>
        </div>
      )}

      {/* ── Search + sort ── */}
      <div style={{ display:'flex',gap:10,marginBottom:20,flexWrap:'wrap',alignItems:'center' }}>
        <input className="field" style={{ maxWidth:260 }} value={search}
          onChange={e => setSearch(e.target.value)} placeholder="Search candidates…" />
        {[['score','Score'],['name','Name']].map(([val,label]) => (
          <button key={val} onClick={() => setSortBy(val)}
            className={sortBy===val ? 'btn btn-ghost-purple' : 'btn btn-secondary'}
            style={{ padding:'7px 13px',fontSize:12 }}>{label}</button>
        ))}
      </div>

      {/* ── Analyzed grid ── */}
      {sorted.length === 0 && analyzed.length === 0 && (
        <div style={{ color:'var(--text-3)',fontSize:13,marginBottom:20 }}>
          Analysis in progress — cards will appear as each candidate is scored…
        </div>
      )}

      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(360px,1fr))',gap:16,marginBottom:32 }}>
        {sorted.map((c, i) => (
          <div key={c.id} style={{ position:'relative' }}>
            {recalcId === c.id && (
              <div style={{ position:'absolute',inset:0,borderRadius:'var(--r-xl)',background:'rgba(8,8,16,.75)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2,gap:8 }}>
                <Spinner size={18}/><span style={{ color:'var(--text-2)',fontSize:13 }}>Recalculating…</span>
              </div>
            )}
            <CandidateCard
              candidate={c}
              rank={sorted.indexOf(c) + 1}
              onSelect={(cand, tab) => setView({ candidate:cand, tab:tab||'profile' })}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
              onRecalc={handleRecalc}
              onAskCopilot={onAskCopilot}
            />
          </div>
        ))}
      </div>

      {/* ── "Analyze Next 8" section ── */}
      {remaining > 0 && (
        <div style={{ borderTop:'1px solid var(--border)',paddingTop:28 }}>

          {/* In-progress bar for current batch */}
          {inBatch && (
            <div style={{ marginBottom:20,background:'rgba(99,102,241,.07)',border:'1px solid rgba(99,102,241,.18)',borderRadius:12,padding:'16px 20px' }}>
              <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:10 }}>
                <Spinner size={16}/>
                <span style={{ color:'#a5b4fc',fontWeight:600,fontSize:14 }}>
                  Analyzing batch — {analysisProgress.current} / {analysisProgress.total} done
                </span>
              </div>
              <div style={{ background:'rgba(255,255,255,.06)',borderRadius:6,height:5,overflow:'hidden' }}>
                <div style={{
                  height:5,background:'var(--grad-primary)',borderRadius:6,
                  width:`${analysisProgress.total ? (analysisProgress.current/analysisProgress.total)*100 : 0}%`,
                  transition:'width .4s ease'
                }}/>
              </div>
              <div style={{ color:'var(--text-3)',fontSize:12,marginTop:8 }}>
                Next card appears in ~{Math.ceil(1.8)}s · Do not close this tab
              </div>
            </div>
          )}

          {/* Skeleton cards for currently-being-analyzed candidates */}
          {inBatch && (
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(360px,1fr))',gap:16,marginBottom:24 }}>
              {Array.from({ length: Math.min(analysisProgress.total - analysisProgress.current, 4) }).map((_, i) => (
                <SkeletonCard key={i} delay={i * 200} />
              ))}
            </div>
          )}

          {/* Pending cards (not yet in current batch) */}
          {!inBatch && pending.length > 0 && (
            <>
              <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:16 }}>
                <div style={{ fontSize:14,fontWeight:600,color:'var(--text-2)' }}>
                  {pending.length} candidates not yet analyzed
                </div>
                <button
                  className="btn btn-primary"
                  onClick={onAnalyzeMore}
                  disabled={analyzing}
                  style={{ fontSize:13,padding:'9px 20px' }}
                >
                  ⚡ Analyze Next {Math.min(8, remaining)}
                </button>
                <span style={{ color:'var(--text-3)',fontSize:12 }}>~{Math.min(8, remaining) * 2}s</span>
              </div>

              {/* Dimmed previews of pending candidates */}
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(360px,1fr))',gap:16,opacity:.45,pointerEvents:'none' }}>
                {pending.slice(0, 8).map(c => (
                  <PendingCard key={c.id} candidate={c} />
                ))}
              </div>

              {pending.length > 8 && (
                <div style={{ color:'var(--text-3)',fontSize:12,textAlign:'center',marginTop:14 }}>
                  +{pending.length - 8} more waiting
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── All done banner ── */}
      {remaining === 0 && candidates.length > 0 && !analyzing && (
        <div style={{ borderTop:'1px solid var(--border)',paddingTop:20,display:'flex',alignItems:'center',gap:10 }}>
          <span style={{ fontSize:18 }}>✅</span>
          <span style={{ color:'var(--emerald)',fontWeight:600,fontSize:13 }}>
            All {candidates.length} candidates analyzed
          </span>
        </div>
      )}

      {/* ── Modals ── */}
      {view && (
        <CandidateModal candidate={view.candidate} hiringProfile={hiringProfile}
          initialTab={view.tab} onClose={() => setView(null)}
          onEdit={c => { setView(null); setEditTarget(c); }} />
      )}
      {showAdd && (
        <AddCandidateModal existingCount={candidates.length}
          onSave={async c => { await onAddCandidate(c); setShowAdd(false); }}
          onClose={() => setShowAdd(false)} />
      )}
      {editTarget && (
        <AddCandidateModal editData={editTarget} existingCount={candidates.length}
          onSave={async c => { await onEditCandidate(c); setEditTarget(null); }}
          onClose={() => setEditTarget(null)} />
      )}
      {deleteTarget && (
        <ConfirmDialog title="Delete Candidate"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`}
          onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Chip({ icon, label, value, color }) {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:6,background:`${color}0d`,border:`1px solid ${color}22`,borderRadius:8,padding:'6px 12px' }}>
      <span>{icon}</span>
      <span style={{ fontSize:12,color:'var(--text-3)' }}>{label}</span>
      <span style={{ fontSize:13,fontWeight:700,color }}>{value}</span>
    </div>
  );
}

function Item({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <div style={{ color:'var(--indigo)',fontSize:11,fontWeight:600,marginBottom:3,textTransform:'uppercase',letterSpacing:'.06em' }}>{label}</div>
      <div style={{ color:'var(--text-1)',fontSize:13 }}>{value}</div>
    </div>
  );
}

function SkeletonCard({ delay }) {
  return (
    <div className="card" style={{ padding:22, animationDelay:`${delay}ms` }}>
      <div style={{ display:'flex',gap:12,marginBottom:16 }}>
        <Skeleton h={26} w={26} style={{ borderRadius:8,flexShrink:0 }}/>
        <Skeleton h={44} w={44} style={{ borderRadius:10,flexShrink:0 }}/>
        <div style={{ flex:1 }}>
          <Skeleton h={16} w="60%" style={{ marginBottom:6 }}/>
          <Skeleton h={12} w="40%" style={{ marginBottom:6 }}/>
        </div>
        <Skeleton h={56} w={56} style={{ borderRadius:'50%',flexShrink:0 }}/>
      </div>
      {[1,2,3,4].map(i => <Skeleton key={i} h={5} style={{ marginBottom:10,width:`${70+i*5}%` }}/>)}
      <div style={{ display:'flex',gap:8,marginTop:14 }}>
        <Skeleton h={28} w={100} style={{ borderRadius:6 }}/>
        <Skeleton h={28} w={80}  style={{ borderRadius:6 }}/>
      </div>
    </div>
  );
}

function PendingCard({ candidate }) {
  return (
    <div className="card" style={{ padding:20 }}>
      <div style={{ display:'flex',gap:12,alignItems:'center',marginBottom:12 }}>
        <div style={{ width:44,height:44,borderRadius:10,background:`${candidate.color}1e`,border:`2px solid ${candidate.color}44`,display:'flex',alignItems:'center',justifyContent:'center',color:candidate.color,fontSize:15,fontWeight:800 }}>
          {candidate.avatar}
        </div>
        <div>
          <div style={{ color:'var(--text-1)',fontWeight:700,fontSize:14 }}>{candidate.name}</div>
          <div style={{ color:'var(--text-3)',fontSize:12 }}>{candidate.title}</div>
        </div>
        <div style={{ marginLeft:'auto',fontSize:12,color:'var(--text-3)',background:'var(--glass)',border:'1px solid var(--border)',borderRadius:6,padding:'3px 9px' }}>
          Pending
        </div>
      </div>
      <Skeleton h={5} style={{ marginBottom:8 }}/>
      <Skeleton h={5} w="80%" style={{ marginBottom:8 }}/>
      <Skeleton h={5} w="65%" style={{ marginBottom:8 }}/>
    </div>
  );
}
