import { useState, useEffect, useRef } from 'react';
import { askCopilot } from '../utils/api.js';
import { Spinner, EmptyState } from '../components/ui.jsx';

const SUGGESTIONS = [
  'Who should I interview first and why?',
  'Compare the top two candidates head-to-head',
  'Who has the highest leadership potential?',
  'What are the biggest hiring risks?',
  'Which candidates show hidden transferable skills?',
  'Generate an offer strategy for the top candidate',
];

export default function CopilotPage({ candidates, hiringProfile, initialQuery }) {
  const [messages, setMessages] = useState([{
    role:'assistant',
    content:`👋 Hi! I'm your Recruiter Copilot.\n\nI have full context on ${candidates.length > 0 ? `all ${candidates.length} candidates` : 'your candidates'} and the job requirements. Ask me anything — comparisons, hiring risks, interview strategies, or why a candidate is ranked where they are.`,
  }]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const autoSentRef = useRef(false);

  const context = candidates.map(c => ({
    name:           c.name,
    title:          c.title,
    overallMatch:   c.analysis?.overall_match,
    recommendation: c.analysis?.hiring_recommendation,
    scores:         c.analysis?.scores,
    strengths:      c.analysis?.strengths,
    weaknesses:     c.analysis?.weaknesses,
    risks:          c.analysis?.risks,
    trajectory:     c.analysis?.career_trajectory,
    transferable:   c.analysis?.transferable_skills?.detected,
    transferExamples: c.analysis?.transferable_skills?.examples,
    summary:        c.analysis?.recommendation_summary,
  }));

  useEffect(() => {
    if (initialQuery && !autoSentRef.current && candidates.length > 0) {
      autoSentRef.current = true;
      handleSend(initialQuery);
    }
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, loading]);

  async function handleSend(override) {
    const text = (override ?? input).trim();
    if (!text || loading) return;
    const next = [...messages, { role:'user', content:text }];
    setMessages(next); setInput(''); setLoading(true); setError(null);
    try {
      const api  = next.filter(m => !(m.role==='assistant' && m.content.startsWith('👋')));
      const reply = await askCopilot(api, hiringProfile, context);
      setMessages([...next, { role:'assistant', content:reply }]);
    } catch(e) {
      setError(e.message);
      setMessages([...next,{ role:'assistant',content:'⚠️ Something went wrong. Check the server is running and your API key is set.' }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  if (candidates.length === 0)
    return <EmptyState icon="🤖" title="Copilot needs data" subtitle="Run an AI analysis first, then come back to chat." />;

  const showSuggestions = messages.length <= 1;

  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100vh',padding:'28px 36px 24px' }}>
      <div style={{ marginBottom:16 }}>
        <div className="page-title">Recruiter Copilot</div>
        <div className="page-sub" style={{ marginBottom:0 }}>
          AI assistant with full context on {candidates.length} candidates and the hiring profile
        </div>
      </div>

      <div className="chat-area" style={{ flex:1,overflowY:'auto',marginBottom:14 }}>
        {messages.map((m,i)=>(
          <div key={i} style={{ display:'flex',gap:10,flexDirection:m.role==='user'?'row-reverse':'row',alignItems:'flex-start' }}>
            <div className="chat-avatar" style={{ background:m.role==='user'?'rgba(34,211,238,.15)':'var(--glass-active)',border:`1px solid ${m.role==='user'?'rgba(34,211,238,.3)':'rgba(99,102,241,.35)'}` }}>
              {m.role==='user'?'👤':'🤖'}
            </div>
            <div className={`chat-bubble ${m.role}`}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div className="chat-avatar" style={{ background:'var(--glass-active)',border:'1px solid rgba(99,102,241,.35)' }}>🤖</div>
            <div className="chat-bubble assistant" style={{ display:'flex',alignItems:'center',gap:8 }}>
              <Spinner size={13}/><span style={{ color:'var(--text-3)',fontSize:13 }}>Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {showSuggestions && (
        <div style={{ display:'flex',gap:7,flexWrap:'wrap',marginBottom:10 }}>
          {SUGGESTIONS.map((s,i)=>(
            <button key={i} onClick={()=>handleSend(s)} className="btn btn-secondary" style={{ padding:'6px 12px',fontSize:12 }}>{s}</button>
          ))}
        </div>
      )}

      <div style={{ display:'flex',gap:10 }}>
        <input
          ref={inputRef}
          className="field"
          style={{ flex:1 }}
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey) handleSend(); }}
          placeholder="Ask about candidates, comparisons, risks, interview strategy…"
          disabled={loading}
        />
        <button className="btn btn-primary" onClick={()=>handleSend()} disabled={loading||!input.trim()} style={{padding:'11px 22px'}}>
          {loading ? <Spinner size={16} color="#fff"/> : 'Send'}
        </button>
      </div>
    </div>
  );
}
