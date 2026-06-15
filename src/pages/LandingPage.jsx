import { AnimatedCounter } from '../components/ui.jsx';

const FEATURES = [
  { icon:'🧠', title:'Career Intelligence',    desc:'Understands trajectory, seniority, and promotion history — not just keywords.' },
  { icon:'🔄', title:'Transferable Skills',    desc:'Finds candidates who can do the job even when exact keywords are missing.' },
  { icon:'🎯', title:'Explainable Rankings',   desc:'Every rank has a reason — strengths, weaknesses, risks, and interview angles.' },
  { icon:'🤖', title:'Recruiter Copilot',      desc:'Ask anything about your candidates and get instant, context-aware answers.' },
  { icon:'📊', title:'Hiring Analytics',       desc:'Score distributions, skill heatmaps, and trajectory analysis in one view.' },
  { icon:'⚡', title:'Multi-Stage Pipeline',   desc:'Resume parsing → semantic scoring → LLM reasoning → weighted ranking.' },
];

export default function LandingPage({ onStart }) {
  return (
    <div className="landing">
      <div className="landing-glow-1" />
      <div className="landing-glow-2" />

      <div style={{ position:'relative',zIndex:1,display:'flex',flexDirection:'column',alignItems:'center',width:'100%' }}>
        <div className="hero-label">AI Recruitment Intelligence</div>

        <h1 className="hero-headline">
          Hire the way great<br />recruiters actually think
        </h1>

        <p className="hero-sub">
          Rank candidates by understanding who genuinely fits the role —
          not by counting keywords that match a job description.
        </p>

        <div className="hero-metrics">
          {[
            { value:94,  suffix:'%',  label:'Recruiter Satisfaction' },
            { value:3,   suffix:'x',  label:'Faster than Manual'     },
            { value:6,   suffix:'',   label:'Scoring Dimensions'     },
            { value:100, suffix:'%',  label:'Explainable Results'    },
          ].map(({ value, suffix, label }) => (
            <div className="metric-item" key={label}>
              <div className="metric-value"><AnimatedCounter target={value} suffix={suffix} /></div>
              <div className="metric-label">{label}</div>
            </div>
          ))}
        </div>

        <button
          className="btn btn-primary"
          onClick={onStart}
          style={{ fontSize:16,padding:'14px 36px',marginBottom:20,animation:'pulse-glow 3s ease infinite' }}
        >
          Start Recruiting →
        </button>
        <div style={{ color:'var(--text-3)',fontSize:12,marginBottom:52 }}>
          Paste a job description · Add candidate resumes · Get ranked results instantly
        </div>

        <div className="hero-features">
          {FEATURES.map((f,i) => (
            <div className="feature-card" key={i} style={{ animationDelay:`${i*80}ms` }}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
