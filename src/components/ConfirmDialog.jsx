import { useEffect } from 'react';

export default function ConfirmDialog({ title, message, onConfirm, onCancel, danger = true }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onCancel]);

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-body" style={{ textAlign: 'center', padding: '32px 28px' }}>
          <div className="confirm-icon">{danger ? 'DEL' : '!'}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>
            {title}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>{message}</div>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center', gap: 12 }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            className="btn"
            onClick={onConfirm}
            style={{
              background: danger ? 'linear-gradient(135deg,#e11d48,#f43f5e)' : 'var(--grad-primary)',
              color: '#fff', padding: '10px 22px',
              boxShadow: danger ? '0 2px 16px rgba(244,63,94,.3)' : undefined
            }}
          >
            {danger ? 'Delete' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
