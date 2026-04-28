// portal-renderer/src/portals/TaskWidget.jsx
// Self-contained task widget for any portal type.
// Fetches tasks via the portal-auth session token.
import { useState, useEffect, useRef, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || ''

function safeJson(v, fallback) {
  try { const p = typeof v === 'string' ? JSON.parse(v) : v; return p ?? fallback; }
  catch { return fallback; }
}

// ── Tiny icon set (inline SVG) ────────────────────────────────────────────────
const PATHS = {
  checkbox:  'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
  upload:    'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
  form:      'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  read:      'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  signature: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
  video:     'M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z',
  link:      'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71',
  approval:  'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  check:     'M20 6L9 17l-5-5',
  clock:     'M12 2a10 10 0 100 20A10 10 0 0012 2zm0 5v5l3 3',
  chevron:   'M6 9l6 6 6-6',
  x:         'M18 6L6 18M6 6l12 12',
}
const Ic = ({ n, s = 16, c = 'currentColor' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={PATHS[n] || ''} />
  </svg>
)

const CT_META = {
  checkbox:      { label: 'Complete',      icon: 'checkbox',  color: '#6b7280' },
  file_upload:   { label: 'Upload file',   icon: 'upload',    color: '#3b82f6' },
  form:          { label: 'Fill in form',  icon: 'form',      color: '#7c3aed' },
  document_read: { label: 'Read & accept', icon: 'read',      color: '#0d9488' },
  e_signature:   { label: 'Sign',          icon: 'signature', color: '#4361EE' },
  video_watch:   { label: 'Watch',         icon: 'video',     color: '#ec4899' },
  external_link: { label: 'Visit link',    icon: 'link',      color: '#f59f00' },
  approval:      { label: 'Awaiting',      icon: 'approval',  color: '#10b981' },
}

// ── Signature pad ─────────────────────────────────────────────────────────────
function SigPad({ onSave, onClose, primary }) {
  const ref = useRef(); const drawing = useRef(false)
  const draw = e => {
    if (!drawing.current) return
    const r = ref.current.getBoundingClientRect()
    const x = (e.touches?.[0]?.clientX ?? e.clientX) - r.left
    const y = (e.touches?.[0]?.clientY ?? e.clientY) - r.top
    const ctx = ref.current.getContext('2d')
    ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#0D0D0F'
    ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y)
  }
  const start = () => { drawing.current = true; ref.current.getContext('2d').beginPath() }
  const stop  = () => { drawing.current = false; ref.current.getContext('2d').beginPath() }
  const clear = () => { const ctx = ref.current.getContext('2d'); ctx.clearRect(0, 0, ref.current.width, ref.current.height) }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, boxShadow: '0 16px 48px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, fontFamily: 'inherit' }}>Sign here</div>
        <canvas ref={ref} width={432} height={180} style={{ border: '1.5px solid #e5e7eb', borderRadius: 10, cursor: 'crosshair', width: '100%', touchAction: 'none' }}
          onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop}
          onTouchStart={start} onTouchMove={draw} onTouchEnd={stop} />
        <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', margin: '6px 0 16px' }}>Draw your signature above</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={clear} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Clear</button>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={() => onSave(ref.current.toDataURL('image/png'))} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: primary, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Save Signature</button>
        </div>
      </div>
    </div>
  )
}

// ── Acknowledge modal ─────────────────────────────────────────────────────────
function AckModal({ config, onConfirm, onClose, primary }) {
  const [accepted, setAccepted] = useState(false)
  const stmt = config.ack_statement || 'I confirm I have read and understood this document'
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 520, boxShadow: '0 16px 48px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{config.document_title || 'Document'}</div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>Read & Acknowledge</div>
        {config.document_url && (
          <a href={config.document_url} target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1.5px solid #e2e8f0', marginBottom: 16, textDecoration: 'none', color: '#1e293b', fontSize: 13, fontWeight: 600 }}>
            <Ic n="read" s={16} c={primary} /> Open document ↗
          </a>
        )}
        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', padding: 12, borderRadius: 10, border: `1.5px solid ${accepted ? '#0d9488' : '#e5e7eb'}`, background: accepted ? '#f0fdf4' : '#f8f9ff' }}>
          <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} style={{ marginTop: 2, width: 15, height: 15 }} />
          <span style={{ fontSize: 13, fontStyle: 'italic', color: '#374151', lineHeight: 1.5 }}>{stmt}</span>
        </label>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 9, borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={() => accepted && onConfirm()} disabled={!accepted}
            style={{ flex: 2, padding: 9, borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700, cursor: accepted ? 'pointer' : 'default', fontFamily: 'inherit', background: accepted ? '#0d9488' : '#e5e7eb', color: accepted ? 'white' : '#9ca3af' }}>
            Confirm & Complete
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Inline form modal ─────────────────────────────────────────────────────────
function FormModal({ config, token, onComplete, onClose, primary }) {
  const [form, setForm] = useState(null)
  const [data, setData] = useState({})
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!config.form_id) return
    fetch(`${API_BASE}/api/forms/${config.form_id}`, { headers: { 'x-portal-token': token } })
      .then(r => r.json()).then(d => d.id && setForm(d)).catch(() => setErr('Could not load form.'))
  }, [config.form_id, token])

  const required = (form?.fields || []).filter(f => f.required)
  const allFilled = required.every(f => data[f.api_key] !== undefined && data[f.api_key] !== '' && data[f.api_key] !== null)

  const handleSubmit = async () => {
    if (!allFilled) { setErr('Please fill in all required fields.'); return }
    setSaving(true)
    try {
      await fetch(`${API_BASE}/api/forms/${config.form_id}/responses`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-portal-token': token },
        body: JSON.stringify({ data, submitted_by: 'portal' }),
      })
      onComplete({ form_submitted: true, form_id: config.form_id, submitted_at: new Date().toISOString() })
    } catch { setErr('Submission failed.'); setSaving(false) }
  }

  const FieldInput = ({ field }) => {
    const base = { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }
    const lbl = <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.05em' }}>{field.label || field.name}{field.required && <span style={{ color: '#ef4444' }}> *</span>}</div>
    const v = data[field.api_key] ?? ''
    const set = val => setData(d => ({ ...d, [field.api_key]: val }))
    if (field.field_type === 'select') return <div>{lbl}<select value={v} onChange={e => set(e.target.value)} style={base}><option value="">Select…</option>{(field.options || []).map(o => <option key={o}>{o}</option>)}</select></div>
    if (field.field_type === 'boolean') return <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><input type="checkbox" checked={!!v} onChange={e => set(e.target.checked)} style={{ width: 16, height: 16 }} /><span style={{ fontSize: 13 }}>{field.label || field.name}{field.required && <span style={{ color: '#ef4444' }}> *</span>}</span></label>
    if (field.field_type === 'textarea') return <div>{lbl}<textarea value={v} onChange={e => set(e.target.value)} rows={3} style={{ ...base, resize: 'vertical' }} /></div>
    return <div>{lbl}<input type={field.field_type === 'date' ? 'date' : field.field_type === 'email' ? 'email' : 'text'} value={v} onChange={e => set(e.target.value)} style={base} /></div>
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic n="form" s={16} c="#7c3aed" /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{config.form_name || form?.name || 'Complete Form'}</div>
            {config.instructions && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{config.instructions}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 20, padding: 0 }}>×</button>
        </div>
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!form && !err && <div style={{ textAlign: 'center', color: '#9ca3af', padding: 32 }}>Loading…</div>}
          {err && <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: 13 }}>{err}</div>}
          {form && (form.fields || []).map((f, i) => <FieldInput key={f.id || i} field={f} />)}
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 9, border: '1px solid #e5e7eb', background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving || !form}
            style={{ padding: '8px 22px', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 700, cursor: form ? 'pointer' : 'default', fontFamily: 'inherit', background: allFilled && form ? primary : '#e5e7eb', color: allFilled && form ? 'white' : '#9ca3af' }}>
            {saving ? 'Submitting…' : 'Submit & Complete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Individual task row ───────────────────────────────────────────────────────
function TaskRow({ task, token, onRefresh, primary }) {
  const ct     = task.completion_type || 'checkbox'
  const config = safeJson(task.completion_config, {})
  const meta   = CT_META[ct] || CT_META.checkbox
  const isDone = task.status === 'done'
  const fileRef = useRef()
  const [acting,  setActing]  = useState(false)
  const [showSig, setShowSig] = useState(false)
  const [showAck, setShowAck] = useState(false)
  const [showFrm, setShowFrm] = useState(false)

  const complete = async (completionData = {}) => {
    setActing(true)
    await fetch(`${API_BASE}/api/portal-auth/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-portal-token': token },
      body: JSON.stringify({ status: 'done', completion_data: completionData }),
    })
    setActing(false); onRefresh()
  }

  const uncomplete = async () => {
    await fetch(`${API_BASE}/api/portal-auth/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-portal-token': token },
      body: JSON.stringify({ status: 'todo' }),
    })
    onRefresh()
  }

  const handleFileUpload = async e => {
    const file = e.target.files?.[0]; if (!file) return
    setActing(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('record_id',      task.record_id || '')
    fd.append('file_type_id',   config.file_type_id || '')
    fd.append('file_type_name', config.file_type_name || 'Upload')
    fd.append('uploaded_by', 'portal')
    const r = await fetch(`${API_BASE}/api/attachments/upload`, {
      method: 'POST', headers: { 'x-portal-token': token }, body: fd,
    })
    const att = await r.json()
    await complete({ file_name: file.name, attachment_id: att?.id, uploaded_at: new Date().toISOString() })
  }

  const overdue = task.due_date && task.due_date < new Date().toISOString().slice(0, 10) && !isDone

  // Completion action element
  const action = (() => {
    if (isDone) return (
      <button onClick={uncomplete} title="Mark as to do"
        style={{ width: 24, height: 24, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
        <Ic n="check" s={12} c="#10b981" />
      </button>
    )
    if (ct === 'checkbox') return (
      <input type="checkbox" onChange={() => complete({})}
        style={{ width: 17, height: 17, cursor: 'pointer', accentColor: primary, flexShrink: 0 }} />
    )
    if (ct === 'approval') return (
      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: '#fef9c3', color: '#a16207', border: '1px solid #fde047', flexShrink: 0, whiteSpace: 'nowrap' }}>
        Awaiting
      </span>
    )
    return (
      <button onClick={() => {
        if (ct === 'file_upload')    fileRef.current?.click()
        else if (ct === 'e_signature')   setShowSig(true)
        else if (ct === 'document_read') setShowAck(true)
        else if (ct === 'form')          setShowFrm(true)
        else if (ct === 'external_link' && config.url) { window.open(config.url, '_blank'); complete({ visited_at: new Date().toISOString() }) }
        else if (ct === 'video_watch' && config.video_url) { window.open(config.video_url, '_blank'); complete({ watched_at: new Date().toISOString() }) }
        else complete({})
      }} disabled={acting}
        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: `1.5px solid ${meta.color}40`, background: `${meta.color}0c`, color: meta.color, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, whiteSpace: 'nowrap' }}>
        <Ic n={meta.icon} s={12} c={meta.color} />
        {acting ? '…' : meta.label}
      </button>
    )
  })()

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ paddingTop: 2 }}>{action}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: isDone ? '#9ca3af' : '#111827', textDecoration: isDone ? 'line-through' : 'none', lineHeight: 1.4 }}>
            {task.title}
          </div>
          {task.description && !isDone && (
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3, lineHeight: 1.5 }}>{task.description}</div>
          )}
          <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            {task.due_date && (
              <span style={{ fontSize: 11, color: overdue ? '#ef4444' : '#9ca3af' }}>
                {overdue ? '⚠ Due ' : ''}{task.due_date}
              </span>
            )}
            {ct !== 'checkbox' && (
              <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 99, background: `${meta.color}12`, color: meta.color }}>
                {meta.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFileUpload} />

      {showSig && <SigPad primary={primary}
        onSave={sig => { setShowSig(false); complete({ signature_data_url: sig, signed_at: new Date().toISOString() }) }}
        onClose={() => setShowSig(false)} />}

      {showAck && <AckModal config={config} primary={primary}
        onConfirm={() => { setShowAck(false); complete({ acknowledged_at: new Date().toISOString() }) }}
        onClose={() => setShowAck(false)} />}

      {showFrm && <FormModal config={config} token={token} primary={primary}
        onComplete={d => { setShowFrm(false); complete(d) }}
        onClose={() => setShowFrm(false)} />}
    </>
  )
}

// ── Task group card ───────────────────────────────────────────────────────────
function TaskGroupCard({ group, token, onRefresh, primary }) {
  const [open, setOpen] = useState(!group.complete)
  const pct = group.task_count > 0 ? Math.round((group.tasks_done / group.task_count) * 100) : 0
  const color = group.template_color || primary

  return (
    <div style={{ background: 'white', borderRadius: 14, border: `1.5px solid ${group.complete ? '#86efac' : '#e5e7eb'}`, overflow: 'hidden', marginBottom: 12 }}>
      {/* Header */}
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer', background: group.complete ? '#f0fdf4' : 'white' }}>
        <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: color, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: group.complete ? '#15803d' : '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
            {group.template_name}
            {group.complete && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#dcfce7', color: '#15803d', fontWeight: 700 }}>✓ Complete</span>}
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>
            {group.tasks_done} of {group.task_count} task{group.task_count !== 1 ? 's' : ''} done
          </div>
        </div>
        {/* Progress ring */}
        <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
          <svg width={36} height={36} viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={18} cy={18} r={14} fill="none" stroke="#f3f4f6" strokeWidth={3} />
            <circle cx={18} cy={18} r={14} fill="none" stroke={color} strokeWidth={3}
              strokeDasharray={`${pct * 0.879} 87.9`} strokeLinecap="round" />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color }}>
            {pct}%
          </div>
        </div>
        <Ic n="chevron" s={16} c="#9ca3af" />
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: '#f3f4f6' }}>
        <div style={{ height: 3, background: color, width: `${pct}%`, transition: 'width .4s ease' }} />
      </div>

      {/* Tasks */}
      {open && (
        <div style={{ padding: '8px 18px 14px' }}>
          {group.tasks.length === 0 && (
            <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '16px 0' }}>No tasks in this group yet</div>
          )}
          {group.tasks.map(t => (
            <TaskRow key={t.id} task={t} token={token} onRefresh={onRefresh} primary={primary} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main TaskWidget export ────────────────────────────────────────────────────
export default function TaskWidget({ token, primary = '#4361EE', compact = false }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [tab,     setTab]     = useState('groups') // 'groups' | 'standalone'

  const load = useCallback(async () => {
    if (!token) { setError('No session found.'); setLoading(false); return }
    try {
      const r = await fetch(`${API_BASE}/api/portal-auth/tasks`, {
        headers: { 'x-portal-token': token },
      })
      if (!r.ok) throw new Error('Failed to load tasks')
      const d = await r.json()
      setData(d); setLoading(false)
    } catch {
      setError('Could not load your tasks.'); setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}>Loading your tasks…</div>
  )

  if (error) return (
    <div style={{ padding: 20, borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: 13 }}>{error}</div>
  )

  const { tasks = [], groups = [] } = data || {}
  const totalDone  = groups.reduce((s, g) => s + g.tasks_done, 0) + tasks.filter(t => t.status === 'done').length
  const totalCount = groups.reduce((s, g) => s + g.task_count, 0) + tasks.length
  const overallPct = totalCount > 0 ? Math.round((totalDone / totalCount) * 100) : 0
  const allDone    = totalCount > 0 && totalDone === totalCount

  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      {/* Overall progress header */}
      {!compact && (
        <div style={{ marginBottom: 20, padding: '16px 20px', borderRadius: 14, background: allDone ? '#f0fdf4' : `${primary}08`, border: `1.5px solid ${allDone ? '#86efac' : `${primary}20`}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: allDone ? '#15803d' : '#111827' }}>
                {allDone ? '🎉 All tasks complete!' : 'Your tasks'}
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                {totalDone} of {totalCount} complete
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: allDone ? '#15803d' : primary }}>{overallPct}%</div>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: '#f3f4f6' }}>
            <div style={{ height: 6, borderRadius: 99, background: allDone ? '#10b981' : primary, width: `${overallPct}%`, transition: 'width .4s ease' }} />
          </div>
        </div>
      )}

      {/* Tab bar (only if there are both groups and standalone tasks) */}
      {groups.length > 0 && tasks.length > 0 && (
        <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
          {[['groups', `Groups (${groups.length})`], ['standalone', `Tasks (${tasks.length})`]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ padding: '6px 14px', fontSize: 12, fontWeight: tab === id ? 700 : 500, color: tab === id ? primary : '#9ca3af', background: 'none', border: 'none', borderBottom: `2px solid ${tab === id ? primary : 'transparent'}`, cursor: 'pointer', fontFamily: 'inherit' }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Group assignments */}
      {(tab === 'groups' || tasks.length === 0) && groups.length > 0 && (
        <div>
          {groups.map(g => (
            <TaskGroupCard key={g.id} group={g} token={token} onRefresh={load} primary={primary} />
          ))}
        </div>
      )}

      {/* Standalone tasks */}
      {(tab === 'standalone' || groups.length === 0) && tasks.length > 0 && (
        <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid #e5e7eb', padding: '8px 18px 14px' }}>
          {tasks.map(t => (
            <TaskRow key={t.id} task={t} token={token} onRefresh={load} primary={primary} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {groups.length === 0 && tasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 6 }}>No tasks assigned yet</div>
          <div style={{ fontSize: 13 }}>Your tasks will appear here once they're assigned to you</div>
        </div>
      )}
    </div>
  )
}
