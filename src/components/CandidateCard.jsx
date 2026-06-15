import { useState } from 'react';
import { ScoreRing, ProgressBar, RecBadge } from './ui.jsx';

export default function CandidateCard({ candidate, rank, onSelect, onEdit, onDelete, onRecalc, onAskCopilot }) {
  const { analysis, name, title, avatar, color } = candidate;
  const [menuOpen, setMenuOpen] = useState(false);
  const scores  = analysis?.scores ?? {};
  const topBars = Object.entries(scores).slice(0, 4);
  const delay   = `${(rank - 1) * 40}ms`;

  return (
    <div
      className={`cand-card card-lift card-glow${rank === 1 ? ' rank-1' : ''}`}
      style={{ animationDelay: delay }}
      onClick={() => onSelect(candidate)}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>

        {/* Rank pill */}
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: rank <= 3 ? 'rgba(99,102,241,.2)' : 'rgba(255,255,255,.05)',
          color: rank <= 3 ? '#a5b4fc' : 'var(--text-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800,
        }}>
          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
        </div>

        {/* Avatar */}
        <div className="cand-avatar" style={{
          width: 44, height: 44, background: `${color}1e`,
          border: `2px solid ${color}44`, color, fontSize: 15, fontWeight: 800,
        }}>
          {avatar}
        </div>

        {/* Name + title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 2 }}>
            <span style={{ color: 'var(--text-1)', fontWeight: 700, fontSize: 15 }}>{name}</span>
            <RecBadge rec={analysis?.hiring_recommendation} />
          </div>
          <div style={{ color: 'var(--text-3)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        </div>

        {/* Score ring */}
        {analysis && <ScoreRing score={analysis.overall_match} size={56} />}

        {/* Menu button */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn-icon"
            onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
            style={{ fontSize: 16, lineHeight: 1 }}
          >⋯</button>
          {menuOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={e => { e.stopPropagation(); setMenuOpen(false); }} />
              <div style={{
                position: 'absolute', right: 0, top: 34, zIndex: 10,
                background: '#0f0f1e', border: '1px solid var(--border)',
                borderRadius: 10, padding: 6, minWidth: 160,
                boxShadow: 'var(--shadow-lg)', animation: 'slideUp .12s ease'
              }}>
                {[
                  { label: '👁️ View Profile',      action: () => onSelect(candidate) },
                  { label: '✏️ Edit Candidate',    action: () => onEdit(candidate) },
                  { label: '🤖 Ask Copilot',        action: () => onAskCopilot(`Tell me about ${name}, ranked #${rank}`) },
                  { label: '🔄 Recalculate Score',  action: () => onRecalc(candidate) },
                  { label: '🗑️ Delete',             action: () => onDelete(candidate), danger: true },
                ].map(({ label, action, danger }) => (
                  <button
                    key={label}
                    onClick={e => { e.stopPropagation(); setMenuOpen(false); action(); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      background: 'none', border: 'none',
                      color: danger ? '#f87171' : 'var(--text-2)',
                      padding: '8px 12px', fontSize: 12, cursor: 'pointer',
                      borderRadius: 6,
                    }}
                    onMouseEnter={e => e.target.style.background = danger ? 'rgba(244,63,94,.1)' : 'var(--glass-hover)'}
                    onMouseLeave={e => e.target.style.background = 'none'}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Score bars ── */}
      {topBars.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 18px', marginBottom: 12 }}>
          {topBars.map(([key, val]) => (
            <ProgressBar key={key} label={key} value={val} />
          ))}
        </div>
      )}

      {/* ── Hidden talent ── */}
      {analysis?.transferable_skills?.detected && (
        <div className="hidden-talent-strip">
          <span style={{ fontSize: 13 }}>🔄</span>
          <span style={{ color: 'var(--amber)', fontSize: 11, fontWeight: 600 }}>
            Transferable Skill Match Detected
          </span>
        </div>
      )}

      {/* ── Strength preview ── */}
      {analysis?.strengths?.slice(0, 2).map((s, i) => (
        <div key={i} style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>
          <span style={{ color: 'var(--emerald)' }}>+</span> {s}
        </div>
      ))}

      {/* ── Action row ── */}
      <div className="action-row">
        <button className="btn-ghost-purple" onClick={e => { e.stopPropagation(); onSelect(candidate, 'questions'); }}>
          📝 Interview Qs
        </button>
        <button className="btn-ghost-cyan" onClick={e => {
          e.stopPropagation();
          onAskCopilot(`Why is ${name} ranked #${rank}? What are the key reasons?`);
        }}>
          🤖 Copilot
        </button>
        <button className="btn-ghost-amber" onClick={e => { e.stopPropagation(); onEdit(candidate); }} style={{ marginLeft: 'auto' }}>
          ✏️ Edit
        </button>
      </div>
    </div>
  );
}
