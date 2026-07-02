import { BarChart,Bar,PieChart,Pie,Cell,XAxis,YAxis,Tooltip,Legend,ResponsiveContainer,LineChart,Line } from 'recharts';
import { EmptyState, AnimatedCounter } from '../components/ui.jsx';

const TT = { contentStyle:{background:'#0d0d1e',border:'1px solid rgba(255,255,255,.1)',borderRadius:8,color:'#f1f5f9',fontSize:12} };

export default function AnalyticsPage({ candidates }) {
  if (candidates.length === 0)
    return <EmptyState icon="*" title="No data yet" subtitle="Run an AI analysis on the Setup page first." />;

  const sorted = [...candidates].sort((a,b)=>(b.analysis?.overall_match??0)-(a.analysis?.overall_match??0));
  const avg    = Math.round(sorted.reduce((s,c)=>s+(c.analysis?.overall_match??0),0)/sorted.length);
  const strong = sorted.filter(c=>c.analysis?.hiring_recommendation==='strong_hire').length;
  const hidden = sorted.filter(c=>c.analysis?.transferable_skills?.detected).length;
  const asc    = sorted.filter(c=>c.analysis?.career_trajectory==='ascending').length;

  const matchData = sorted.map(c=>({ name:c.name.split(' ')[0], score:c.analysis?.overall_match??0, fill:c.color }));

  const recCounts = candidates.reduce((acc,c)=>{ const r=c.analysis?.hiring_recommendation??'unknown'; acc[r]=(acc[r]??0)+1; return acc; },{});
  const pieData   = Object.entries(recCounts).map(([k,v])=>({ name:k.replace(/_/g,' '), value:v, fill:{strong_hire:'#10b981',hire:'#22d3ee',maybe:'#f59e0b',pass:'#f43f5e'}[k]??'#64748b' }));

  const dimData = sorted.map(c=>({
    name: c.name.split(' ')[0],
    Technical:     c.analysis?.scores?.technical_depth??0,
    Leadership:    c.analysis?.scores?.leadership??0,
    Growth:        c.analysis?.scores?.growth_potential??0,
    Communication: c.analysis?.scores?.communication??0,
  }));

  const KPIS = [
    { icon:'*', label:'Total Candidates',   value:candidates.length, color:'var(--indigo)' },
    { icon:'*', label:'Strong Hires',        value:strong,            color:'var(--emerald)'},
    { icon:'*', label:'Avg Match Score',     value:`${avg}/100`,      color:'var(--cyan)'  },
    { icon:'*', label:'Hidden Talents',      value:hidden,            color:'var(--amber)' },
    { icon:'*', label:'Ascending Careers',   value:asc,               color:'var(--violet)'},
    { icon:'*', label:'Top Score',           value:sorted[0]?.analysis?.overall_match??0, color:'var(--rose)'},
  ];

  return (
    <div className="page">
      <div className="page-title">Analytics Dashboard</div>
      <div className="page-sub">Intelligence summary across {candidates.length} analyzed candidates</div>

      {/* KPI grid */}
      <div className="kpi-grid">
        {KPIS.map((k,i)=>(
          <div key={i} className="kpi-card" style={{ '--kpi-color':k.color }}>
            <div style={{ position:'absolute',top:0,left:0,right:0,height:2,background:k.color,borderRadius:'14px 14px 0 0' }} />
            <span className="kpi-icon">{k.icon}</span>
            <div className="kpi-value" style={{ color:k.color }}>
              {typeof k.value==='number' ? <AnimatedCounter target={k.value} /> : k.value}
            </div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Top candidate spotlight */}
      {sorted[0]?.analysis && (
        <div style={{ marginBottom:20,background:'rgba(99,102,241,.06)',border:'1px solid rgba(99,102,241,.2)',borderRadius:14,padding:20,display:'flex',alignItems:'center',gap:16 }}>
          <div style={{ width:52,height:52,borderRadius:13,background:`${sorted[0].color}1e`,border:`2px solid ${sorted[0].color}44`,display:'flex',alignItems:'center',justifyContent:'center',color:sorted[0].color,fontWeight:800,fontSize:18,flexShrink:0 }}>
            {sorted[0].avatar}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11,color:'var(--indigo)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:4 }}>Top Ranked Candidate</div>
            <div style={{ fontSize:16,fontWeight:700,color:'var(--text-1)' }}>{sorted[0].name}</div>
            <div style={{ fontSize:12,color:'var(--text-3)' }}>{sorted[0].title} · Match: {sorted[0].analysis.overall_match}/100</div>
          </div>
          <div style={{ fontSize:13,color:'var(--text-2)',maxWidth:380,lineHeight:1.6 }}>
            {sorted[0].analysis.recommendation_summary}
          </div>
        </div>
      )}

      {/* Charts */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20 }}>
        <ChartCard title="Overall Match Scores">
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={matchData} barSize={26}>
              <XAxis dataKey="name" tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis domain={[0,100]} tick={{fill:'#64748b',fontSize:10}} axisLine={false} tickLine={false}/>
              <Tooltip {...TT} cursor={{fill:'rgba(255,255,255,.03)'}}/>
              <Bar dataKey="score" radius={[5,5,0,0]}>
                {matchData.map((e,i)=><Cell key={i} fill={e.fill}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Hiring Recommendations">
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={78}
                label={({name,value})=>`${name}: ${value}`} labelLine={{stroke:'#475569',strokeWidth:1}}>
                {pieData.map((e,i)=><Cell key={i} fill={e.fill}/>)}
              </Pie>
              <Tooltip {...TT}/>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Skill Dimension Comparison" style={{ marginBottom:20 }}>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={dimData} barSize={12} barGap={2}>
            <XAxis dataKey="name" tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis domain={[0,100]} tick={{fill:'#64748b',fontSize:10}} axisLine={false} tickLine={false}/>
            <Tooltip {...TT} cursor={{fill:'rgba(255,255,255,.03)'}}/>
            <Legend wrapperStyle={{color:'#64748b',fontSize:12,paddingTop:8}}/>
            <Bar dataKey="Technical"     fill="#6366f1" radius={[3,3,0,0]}/>
            <Bar dataKey="Leadership"    fill="#22d3ee" radius={[3,3,0,0]}/>
            <Bar dataKey="Growth"        fill="#10b981" radius={[3,3,0,0]}/>
            <Bar dataKey="Communication" fill="#f59e0b" radius={[3,3,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Hidden talent report */}
      {hidden > 0 && (
        <div style={{ background:'rgba(245,158,11,.05)',border:'1px solid rgba(245,158,11,.16)',borderRadius:14,padding:20,marginBottom:20 }}>
          <div style={{ color:'var(--amber)',fontWeight:700,fontSize:15,display:'flex',alignItems:'center',gap:8,marginBottom:16 }}>
            Hidden Talent Report ({hidden} candidate{hidden>1?'s':''})
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            {candidates.filter(c=>c.analysis?.transferable_skills?.detected).map(c=>(
              <div key={c.id} style={{ background:'var(--glass)',border:'1px solid var(--border)',borderRadius:10,padding:14 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
                  <div style={{ width:30,height:30,borderRadius:7,background:`${c.color}1e`,border:`1px solid ${c.color}44`,display:'flex',alignItems:'center',justifyContent:'center',color:c.color,fontSize:11,fontWeight:800 }}>{c.avatar}</div>
                  <span style={{ color:'var(--text-1)',fontWeight:600,fontSize:13 }}>{c.name}</span>
                  <span style={{ color:'var(--text-3)',fontSize:12 }}>· Score {c.analysis.overall_match}/100</span>
                </div>
                {c.analysis.transferable_skills.examples?.map((ex,i)=>(
                  <div key={i} style={{ color:'var(--text-2)',fontSize:12,paddingLeft:12,marginBottom:3,lineHeight:1.5 }}>→ {ex}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Career trajectory */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12 }}>
        {[['ascending','*','var(--emerald)'],['plateau','-','var(--cyan)'],['pivot','=','var(--amber)'],['declining','v','var(--rose)']].map(([traj,icon,color])=>{
          const count = candidates.filter(c=>c.analysis?.career_trajectory===traj).length;
          return (
            <div key={traj} style={{ background:`${color}0d`,border:`1px solid ${color}20`,borderRadius:10,padding:14,textAlign:'center' }}>
              <div style={{ fontSize:20,marginBottom:6 }}>{icon}</div>
              <div style={{ fontSize:22,fontWeight:800,color }}>{count}</div>
              <div style={{ fontSize:12,color:'var(--text-3)',textTransform:'capitalize' }}>{traj}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChartCard({ title, children, style: s }) {
  return (
    <div className="card" style={{ padding:'18px 20px',...s }}>
      <div style={{ color:'var(--text-1)',fontWeight:600,marginBottom:16,fontSize:14 }}>{title}</div>
      {children}
    </div>
  );
}
