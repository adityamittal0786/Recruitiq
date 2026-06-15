export default function LoadingOverlay({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const steps = ['Parsing job description','Building hiring profile','Scoring skill dimensions','Detecting transferable skills','Generating rankings'];
  const si = Math.min(Math.floor((current / Math.max(total,1)) * steps.length), steps.length - 1);
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.85)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,animation:'fadeIn .2s ease' }}>
      <div style={{ background:'#0b0b18',border:'1px solid rgba(255,255,255,.1)',borderRadius:20,padding:'44px 48px',textAlign:'center',minWidth:360,boxShadow:'var(--shadow-lg)' }}>
        <div style={{ width:60,height:60,borderRadius:16,background:'rgba(99,102,241,.12)',border:'1px solid rgba(99,102,241,.28)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,margin:'0 auto 20px',animation:'pulse-glow 2s ease infinite' }}>⚡</div>
        <div style={{ fontSize:18,fontWeight:700,color:'var(--text-1)',marginBottom:6 }}>Running AI Analysis</div>
        <div style={{ fontSize:13,color:'var(--text-3)',marginBottom:24 }}>
          {current > 0 ? `Candidate ${current} of ${total - 1}…` : 'Analyzing job description…'}
        </div>
        <div style={{ background:'rgba(255,255,255,.05)',borderRadius:8,height:6,marginBottom:10,overflow:'hidden' }}>
          <div style={{ height:6,borderRadius:8,width:`${pct}%`,background:'var(--grad-primary)',transition:'width .4s cubic-bezier(.4,0,.2,1)' }} />
        </div>
        <div style={{ fontSize:12,color:'#a5b4fc',marginBottom:20 }}>{steps[si]}…</div>
        <div style={{ display:'flex',gap:6,justifyContent:'center',flexWrap:'wrap' }}>
          {['Resume Parsing','Skill Scoring','Transferable Skills','Ranking'].map((l,i) => (
            <span key={i} style={{ fontSize:10,fontWeight:500,padding:'3px 8px',borderRadius:5,background:i<si?'var(--green-dim,rgba(16,185,129,.1))':'rgba(255,255,255,.04)',color:i<si?'var(--emerald)':'var(--text-4)',border:`1px solid ${i<si?'rgba(16,185,129,.2)':'var(--border)'}`,transition:'all .3s' }}>
              {i<si?'✓ ':''}{l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
