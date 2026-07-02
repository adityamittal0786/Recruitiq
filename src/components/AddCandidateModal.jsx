import { useState, useRef } from 'react';
import { Spinner } from './ui.jsx';

const AVATAR_COLORS = [
  '#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b',
  '#f43f5e','#0ea5e9','#a855f7','#14b8a6','#f97316',
];

function initials(name) {
  return (name || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function AddCandidateModal({ existingCount, onSave, onClose, editData }) {
  const isEdit = !!editData;
  const [form, setForm] = useState({
    name:       editData?.name        || '',
    title:      editData?.title       || '',
    email:      editData?.email       || '',
    phone:      editData?.phone       || '',
    linkedin:   editData?.linkedin    || '',
    portfolio:  editData?.portfolio   || '',
    resume:     editData?.resume      || '',
    notes:      editData?.notes       || '',
  });
  const [errors, setErrors]   = useState({});
  const [dragging, setDragging] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const [parsing,  setParsing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const fileRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())   e.name   = 'Full name is required';
    if (!form.title.trim())  e.title  = 'Current title is required';
    if (!form.resume.trim()) e.resume = 'Resume text is required for AI analysis';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFile = async (file) => {
    if (!file) return;
    setFileInfo({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB', parsed: false });
    setParsing(true);
    try {
      // For text files, try client-side parsing first (faster, no server needed)
      if (file.type === 'text/plain' || file.name.match(/\.(txt|md)$/i)) {
        const text = await file.text();
        set('resume', text);
        setFileInfo(f => ({ ...f, parsed: true }));
        return;
      }

      // For PDF/DOCX, try server-side extraction
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('http://localhost:3001/api/extract-resume', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Server error' }));
        throw new Error(error.error || 'Failed to extract text');
      }
      
      const data = await res.json();
      set('resume', data.text);
      setFileInfo(f => ({ ...f, parsed: true }));
    } catch (err) {
      console.error('File parsing error:', err);
      setFileInfo(f => ({ 
        ...f, 
        parsed: false, 
        note: 'Server unavailable. For PDF/DOCX, please paste text manually. TXT files work directly.' 
      }));
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    const color = AVATAR_COLORS[(existingCount || 0) % AVATAR_COLORS.length];
    const candidate = {
      id:     editData?.id || Date.now(),
      name:   form.name.trim(),
      title:  form.title.trim(),
      email:  form.email.trim(),
      phone:  form.phone.trim(),
      linkedin:  form.linkedin.trim(),
      portfolio: form.portfolio.trim(),
      resume: form.resume.trim(),
      notes:  form.notes.trim(),
      avatar: initials(form.name),
      color:  editData?.color || color,
    };
    await onSave(candidate);
    setSaving(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--glass-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            {isEdit ? 'Edit' : 'Add'}
          </div>
          <div>
            <div className="modal-title">{isEdit ? 'Edit Candidate' : 'Add New Candidate'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>
              {isEdit ? `Editing ${editData.name}` : 'Fill in the candidate details below'}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>x</button>
        </div>

        <div className="modal-body">
          {/* Basic Info */}
          <div style={{ marginBottom: 6, fontSize: 11, fontWeight: 700, color: 'var(--indigo)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Basic Info</div>
          <div className="field-row" style={{ marginBottom: 14 }}>
            <div className="field-group">
              <label className="field-label">Full Name *</label>
              <input className="field" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Arjun Sharma" />
              {errors.name && <div className="field-error">{errors.name}</div>}
            </div>
            <div className="field-group">
              <label className="field-label">Current Title *</label>
              <input className="field" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Senior ML Engineer" />
              {errors.title && <div className="field-error">{errors.title}</div>}
            </div>
          </div>
          <div className="field-row" style={{ marginBottom: 14 }}>
            <div className="field-group">
              <label className="field-label">Email</label>
              <input className="field" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="arjun@email.com" />
              {errors.email && <div className="field-error">{errors.email}</div>}
            </div>
            <div className="field-group">
              <label className="field-label">Phone</label>
              <input className="field" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
            </div>
          </div>
          <div className="field-row" style={{ marginBottom: 20 }}>
            <div className="field-group">
              <label className="field-label">LinkedIn URL</label>
              <input className="field" value={form.linkedin} onChange={e => set('linkedin', e.target.value)} placeholder="https://linkedin.com/in/..." />
            </div>
            <div className="field-group">
              <label className="field-label">Portfolio / GitHub</label>
              <input className="field" value={form.portfolio} onChange={e => set('portfolio', e.target.value)} placeholder="https://github.com/..." />
            </div>
          </div>

          {/* Resume Upload */}
          <div style={{ marginBottom: 6, fontSize: 11, fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Resume</div>
          <div
            className={`dropzone${dragging ? ' dragging' : ''}${fileInfo?.parsed ? ' has-file' : ''}`}
            style={{ marginBottom: 12 }}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".txt,.md,.pdf,.docx" hidden onChange={e => handleFile(e.target.files[0])} />
            {parsing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <Spinner size={16} color="var(--cyan)" /> <span style={{ color: 'var(--text-3)', fontSize: 13 }}>Reading file…</span>
              </div>
            ) : fileInfo ? (
              <div>
                <div style={{ color: fileInfo.parsed ? 'var(--emerald)' : 'var(--amber)', fontWeight: 600, fontSize: 13 }}>
                  {fileInfo.parsed ? 'OK' : 'FILE'} {fileInfo.name} ({fileInfo.size})
                </div>
                {fileInfo.note && <div style={{ color: 'var(--amber)', fontSize: 12, marginTop: 4 }}>{fileInfo.note}</div>}
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 28, marginBottom: 8 }}>FILE</div>
                <div style={{ color: 'var(--text-2)', fontSize: 13, fontWeight: 500 }}>Drop resume here or click to upload</div>
                <div style={{ color: 'var(--text-3)', fontSize: 11, marginTop: 4 }}>Supports PDF, DOCX, TXT · AI extracts text automatically</div>
              </div>
            )}
          </div>

          <div className="field-group" style={{ marginBottom: 20 }}>
            <label className="field-label">Resume Text * <span style={{ color: 'var(--text-3)', fontWeight: 400, textTransform: 'none' }}>(used for AI analysis)</span></label>
            <textarea className="field" rows={8} value={form.resume} onChange={e => set('resume', e.target.value)} placeholder="Paste the full resume text here. This is what the AI reads to score the candidate." />
            {errors.resume && <div className="field-error">{errors.resume}</div>}
          </div>

          <div className="field-group">
            <label className="field-label">Recruiter Notes</label>
            <textarea className="field" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Internal notes, referral source, initial impressions…" />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><Spinner size={15} color="#fff" /> Saving…</> : (isEdit ? 'Save Changes' : 'Add Candidate')}
          </button>
        </div>
      </div>
    </div>
  );
}
