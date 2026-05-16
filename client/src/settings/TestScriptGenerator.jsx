// client/src/settings/TestScriptGenerator.jsx
// Settings section: AI-powered UAT test script generator.
import { useState, useEffect, useCallback } from 'react';

const api = {
  get:    (url)        => fetch(url, { headers: { 'X-User-Id': localStorage.getItem('vc_user_id') || '' } }).then(r => r.json()),
  delete: (url)        => fetch(url, { method: 'DELETE', headers: { 'X-User-Id': localStorage.getItem('vc_user_id') || '' } }).then(r => r.json()),
  postRaw:(url, body)  => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-User-Id': localStorage.getItem('vc_user_id') || '' }, body: JSON.stringify(body) }),
};

const C = {
  accent: '#4361EE', accentLight: '#EEF2FF', text1: '#0F1729', text2: '#374151',
  text3: '#6B7280', border: '#E5E7EB', surface: '#F9FAFB', green: '#0CA678',
  greenLight: '#F0FDF4', red: '#EF4444', redLight: '#FEF2F2',
};
const F = "'DM Sans', -apple-system, sans-serif";

const SCOPE_OPTIONS = [
  { value: 'full',      label: 'Full Platform',            desc: 'Auth, records, workflows, portals, AI' },
  { value: 'core',      label: 'Core Records',             desc: 'CRUD, search, filters, field validation' },
  { value: 'workflows', label: 'Workflows Only',           desc: 'Stage progression and automation' },
  { value: 'portals',   label: 'Portals & Candidate Journey', desc: 'Career site, application submission' },
  { value: 'auth',      label: 'Auth & Roles',             desc: 'Login, role-based access, permissions' },
];

const DEPTH_OPTIONS = [
  { value: 'quick',         label: 'Quick',         desc: '3–5 cases per section (~15 total)' },
  { value: 'standard',      label: 'Standard',      desc: '6–10 cases per section (~40 total)' },
  { value: 'comprehensive', label: 'Comprehensive', desc: '12–15 cases per section (~80 total)' },
];

function OptionPill({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {options.map(opt => (
        <div key={opt.value} onClick={() => onChange(opt.value)} style={{
          padding: '10px 14px', borderRadius: 10, cursor: 'pointer', transition: 'all .12s',
          border: `2px solid ${value === opt.value ? C.accent : C.border}`,
          background: value === opt.value ? C.accentLight : 'white',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: value === opt.value ? C.accent : C.text1 }}>{opt.label}</span>
            {value === opt.value && (
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            )}
          </div>
          <div style={{ fontSize: 12, color: C.text3, marginTop: 2 }}>{opt.desc}</div>
        </div>
      ))}
    </div>
  );
}

function ScriptRow({ script, onDownload, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const date = new Date(script.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, border: `1.5px solid ${C.border}`, background: 'white' }}>
      <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" style={{ flexShrink: 0 }}>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text1, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{script.title}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: C.text3 }}>{date}</span>
          <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 99, background: C.accentLight, color: C.accent, fontWeight: 700 }}>{script.case_count} cases</span>
          <span style={{ fontSize: 11, color: C.text3, textTransform: 'capitalize' }}>{script.scope} · {script.depth}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={() => onDownload(script.id)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: C.accent, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: F, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          Download
        </button>
        <button onClick={async () => { if (!confirm('Delete this script?')) return; setDeleting(true); await onDelete(script.id); }} disabled={deleting} style={{ padding: '7px 10px', borderRadius: 8, border: `1.5px solid ${C.border}`, background: 'white', color: C.red, fontSize: 12, cursor: 'pointer', fontFamily: F, display: 'flex', alignItems: 'center' }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
        </button>
      </div>
    </div>
  );
}

export default function TestScriptGenerator({ environment }) {
  const [scope,   setScope]   = useState('full');
  const [depth,   setDepth]   = useState('standard');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress,setProgress]= useState('');
  const [error,   setError]   = useState('');
  const [scripts, setScripts] = useState([]);
  const [loadingScripts, setLoadingScripts] = useState(true);

  const envId = environment?.id;

  const loadScripts = useCallback(async () => {
    if (!envId) return;
    setLoadingScripts(true);
    try { setScripts(await api.get(`/api/test-scripts?environment_id=${envId}`) || []); } catch { setScripts([]); }
    setLoadingScripts(false);
  }, [envId]);

  useEffect(() => { loadScripts(); }, [loadScripts]);

  const handleGenerate = async () => {
    if (!envId) return;
    setLoading(true); setError('');
    const steps = [
      'Reading your platform configuration…',
      'Analysing objects, fields, workflows and portals…',
      'Generating test cases with AI — this takes 30–60 seconds…',
      'Building Word document…',
    ];
    let si = 0;
    setProgress(steps[si]);
    const ticker = setInterval(() => { si = Math.min(si + 1, steps.length - 1); setProgress(steps[si]); }, 8000);
    try {
      const response = await api.postRaw('/api/test-scripts/generate', { environment_id: envId, scope, depth, company: company || environment?.name || '' });
      clearInterval(ticker);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${response.status}`);
      }
      setProgress('Downloading…');
      const blob  = await response.blob();
      const url   = URL.createObjectURL(blob);
      const fname = response.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] || `uat-script-${Date.now()}.docx`;
      const a = document.createElement('a');
      a.href = url; a.download = fname;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      setProgress('');
      await loadScripts();
    } catch (e) {
      clearInterval(ticker);
      setError(e.message || 'Something went wrong. Please try again.');
      setProgress('');
    }
    setLoading(false);
  };

  const handleDownload = (id) => { const a = document.createElement('a'); a.href = `/api/test-scripts/${id}/download`; a.click(); };
  const handleDelete   = async (id) => { await api.delete(`/api/test-scripts/${id}`); await loadScripts(); };

  const card  = { background: 'white', borderRadius: 14, border: `1.5px solid ${C.border}`, padding: '20px 22px', marginBottom: 16 };
  const label = { fontSize: 12, fontWeight: 700, color: C.text2, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'block' };

  return (
    <div style={{ maxWidth: 760, fontFamily: F }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: C.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2"><path d="M9.937 15.5A2 2 0 008.5 14.063l-6.135-1.582a.5.5 0 010-.962L8.5 9.936A2 2 0 009.937 8.5l1.582-6.135a.5.5 0 01.963 0L14.063 8.5A2 2 0 0015.5 9.937l6.135 1.581a.5.5 0 010 .964L15.5 14.063a2 2 0 00-1.437 1.437l-1.582 6.135a.5.5 0 01-.963 0L9.937 15.5z"/></svg>
          </div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text1 }}>Test Script Generator</h2>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: C.text3, lineHeight: 1.6 }}>
          Generate a professional UAT test script tailored to your exact configuration — objects, fields, workflows, portals and roles. Downloads as a formatted Word document ready for your testing team.
        </p>
      </div>

      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text1, marginBottom: 16 }}>Configure Your Script</div>
        <div style={{ marginBottom: 18 }}>
          <label style={label}>Company / Client Name (optional)</label>
          <input value={company} onChange={e => setCompany(e.target.value)} placeholder={environment?.name || 'e.g. Acme Corporation'}
            style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.text1, fontFamily: F, outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border}/>
          <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>Appears on the cover page and document footer</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div><label style={label}>Test Scope</label><OptionPill options={SCOPE_OPTIONS} value={scope} onChange={setScope}/></div>
          <div><label style={label}>Test Depth</label><OptionPill options={DEPTH_OPTIONS} value={depth} onChange={setDepth}/></div>
        </div>
        <div style={{ marginTop: 18, padding: '12px 14px', borderRadius: 10, background: C.accentLight, border: `1px solid ${C.accent}28` }}>
          <div style={{ fontSize: 12, color: C.accent, fontWeight: 700, marginBottom: 4 }}>What gets included</div>
          <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.6 }}>
            The AI reads your live <strong>{environment?.name}</strong> configuration and writes test cases that reference your actual field names, stage names, role names and portal URLs. Each test case includes role to test as, step-by-step instructions, expected result and pass/fail tick boxes. A sign-off page is included at the end.
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        {error && <div style={{ padding: '10px 14px', borderRadius: 9, background: C.redLight, border: `1px solid ${C.red}30`, color: C.red, fontSize: 13, marginBottom: 12 }}>{error}</div>}
        {loading ? (
          <div style={{ padding: '20px 22px', borderRadius: 14, background: C.accentLight, border: `1.5px solid ${C.accent}30`, textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2.5px solid ${C.accent}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }}/>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>Generating…</span>
            </div>
            <div style={{ fontSize: 12, color: C.text3 }}>{progress}</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 6 }}>AI generation takes 30–60 seconds</div>
          </div>
        ) : (
          <button onClick={handleGenerate} style={{ width: '100%', padding: '12px 20px', borderRadius: 10, border: 'none', background: C.accent, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: F, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.937 15.5A2 2 0 008.5 14.063l-6.135-1.582a.5.5 0 010-.962L8.5 9.936A2 2 0 009.937 8.5l1.582-6.135a.5.5 0 01.963 0L14.063 8.5A2 2 0 0015.5 9.937l6.135 1.581a.5.5 0 010 .964L15.5 14.063a2 2 0 00-1.437 1.437l-1.582 6.135a.5.5 0 01-.963 0L9.937 15.5z"/></svg>
            Generate Test Script
            <span style={{ fontSize: 12, opacity: 0.75, fontWeight: 400 }}>— {SCOPE_OPTIONS.find(o => o.value === scope)?.label} · {DEPTH_OPTIONS.find(o => o.value === depth)?.label}</span>
          </button>
        )}
      </div>

      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text1 }}>Previously Generated</div>
          {scripts.length > 0 && <span style={{ fontSize: 12, color: C.text3 }}>{scripts.length} script{scripts.length !== 1 ? 's' : ''}</span>}
        </div>
        {loadingScripts ? (
          <div style={{ textAlign: 'center', padding: '20px', color: C.text3, fontSize: 13 }}>Loading…</div>
        ) : scripts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: C.text3 }}>
            <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={C.border} strokeWidth="1.5" style={{ margin: '0 auto 10px', display: 'block' }}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <div style={{ fontSize: 13 }}>No scripts generated yet for this environment</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Generated scripts are saved here so you can re-download them</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {scripts.map(s => <ScriptRow key={s.id} script={s} onDownload={handleDownload} onDelete={handleDelete}/>)}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
