import { useEffect, useState } from 'react';

// ─── Score Ring ───────────────────────────────────────────────────────────────
export function ScoreRing({ score, size = 64 }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 60); return () => clearTimeout(t); }, []);
  const stroke = 3.5;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const fill = animated ? (score / 100) * circ : 0;
  const color = score >= 85 ? '#10b981' : score >= 70 ? '#22d3ee' : score >= 50 ? '#f59e0b' : '#f43f5e';
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size * 0.27, fontWeight: 800, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{score}</span>
      </div>
    </div>
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
export function AnimatedCounter({ target, suffix = '', duration = 1400 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0; const step = target / (duration / 16);
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
  }, [target, duration]);
  return <span>{val}{suffix}</span>;
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ label, value, color }) {
  const c = color ?? (value >= 80 ? '#10b981' : value >= 60 ? '#22d3ee' : value >= 40 ? '#f59e0b' : '#f43f5e');
  return (
    <div className="progress-row">
      {label && (
        <div className="progress-header">
          <span className="progress-label">{label.replace(/_/g, ' ')}</span>
          <span className="progress-value">{value}</span>
        </div>
      )}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: c }} />
      </div>
    </div>
  );
}

// ─── Tag ──────────────────────────────────────────────────────────────────────
export function Tag({ children, color = '#6366f1' }) {
  return (
    <span className="tag" style={{ background: `${color}1e`, color, border: `1px solid ${color}38` }}>
      {children}
    </span>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 18, color = '#6366f1' }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      border: `2px solid ${color}28`, borderTop: `2px solid ${color}`,
      borderRadius: '50%', animation: 'spin .75s linear infinite', flexShrink: 0
    }} />
  );
}

// ─── Recommendation Badge ─────────────────────────────────────────────────────
const REC = { strong_hire: '⭐ Strong Hire', hire: '✓ Hire', maybe: '◎ Maybe', pass: '✕ Pass' };
export function RecBadge({ rec, style: s }) {
  if (!rec) return null;
  return <span className={`badge rec-${rec}`} style={s}>{REC[rec] ?? rec}</span>;
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {subtitle && <div className="empty-sub">{subtitle}</div>}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
export function Skeleton({ h = 16, w = '100%', style: s }) {
  return <div className="skeleton" style={{ height: h, width: w, ...s }} />;
}

// ─── Divider ──────────────────────────────────────────────────────────────────
export function Divider({ label }) {
  if (!label) return <div className="divider" />;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}
