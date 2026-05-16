// client/src/ReleaseNotes.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import api from "./apiClient.js";

// Global styles for rich content display
if (!document.getElementById('rn-rich-styles')) {
  const s = document.createElement('style');
  s.id = 'rn-rich-styles';
  s.textContent = `
    .rn-rich-body img { max-width: 100%; border-radius: 8px; margin: 8px 0; display: block; }
    .rn-rich-body b, .rn-rich-body strong { font-weight: 700; }
    .rn-rich-body i, .rn-rich-body em { font-style: italic; }
    .rn-rich-body a { color: var(--t-accent, #4361EE); text-decoration: underline; }
    .rn-rich-body iframe { max-width: 100%; border-radius: 8px; margin: 8px 0; }
    .rn-rich-body p { margin: 0 0 8px; }
  `;
  document.head.appendChild(s);
}

const F = "var(--t-font, 'Geist', sans-serif)";

export const CATEGORY_META = {
  feature:     { label: 'New Feature',  color: 'var(--t-accent, #4361EE)',  bg: 'var(--t-accent-light, #EEF2FF)' },
  improvement: { label: 'Improvement',  color: '#0CAF77', bg: '#F0FDF4' },
  fix:         { label: 'Bug Fix',      color: '#F59F00', bg: '#FFFBEB' },
  security:    { label: 'Security',     color: '#EF4444', bg: '#FEF2F2' },
};

const PATHS = {
  bell:     "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  x:        "M18 6L6 18M6 6l12 12",
  check:    "M20 6L9 17l-5-5",
  plus:     "M12 5v14M5 12h14",
  edit:     "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  trash:    "M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6",
  sparkle:  "M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2",
  back:     "M19 12H5M12 19l-7-7 7-7",
  calendar: "M8 7V3M16 7V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  login:    "M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3",
  image:    "M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21",
  video:    "M22.54 6.42a2.78 2.78 0 00-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96C1 8.14 1 12 1 12s0 3.86.46 5.58a2.78 2.78 0 001.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.97C23 15.86 23 12 23 12s0-3.86-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z",
  link:     "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
  bold:     "M6 4h8a4 4 0 010 8H6zM6 12h9a4 4 0 010 8H6z",
  italic:   "M19 4h-9M14 20H5M15 4L9 20",
};
const Ic = ({ n, s = 16, c = "currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
    stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={PATHS[n]} />
  </svg>
);

// ── Rich text editor ──────────────────────────────────────────────────────────
function RichEditor({ value, onChange }) {
  const editorRef  = useRef(null);
  const imageRef   = useRef(null);
  const savedRange = useRef(null);
  const [showLink,  setShowLink]  = useState(false);
  const [linkUrl,   setLinkUrl]   = useState('');
  const [showVideo, setShowVideo] = useState(false);
  const [videoUrl,  setVideoUrl]  = useState('');

  useEffect(() => {
    if (editorRef.current && value && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, []); // eslint-disable-line

  const exec  = cmd => { document.execCommand(cmd, false, null); editorRef.current?.focus(); };
  const notify = ()  => { if (editorRef.current) onChange(editorRef.current.innerHTML); };

  const saveRange = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount) savedRange.current = sel.getRangeAt(0).cloneRange();
  };
  const restoreRange = () => {
    const sel = window.getSelection();
    if (savedRange.current && sel) { sel.removeAllRanges(); sel.addRange(savedRange.current); }
  };

  const handleImage = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      document.execCommand('insertHTML', false,
        `<img src="${ev.target.result}" style="max-width:100%;border-radius:8px;margin:8px 0;" />`);
      notify();
    };
    reader.readAsDataURL(file);
  };

  const insertLink = () => {
    restoreRange();
    if (linkUrl) document.execCommand('createLink', false, linkUrl);
    setShowLink(false); setLinkUrl(''); notify();
  };

  const insertVideo = () => {
    let src = videoUrl.trim();
    const yt = src.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&?/]+)/);
    const vi = src.match(/vimeo\.com\/(\d+)/);
    if (yt) src = `https://www.youtube.com/embed/${yt[1]}`;
    else if (vi) src = `https://player.vimeo.com/video/${vi[1]}`;
    restoreRange();
    document.execCommand('insertHTML', false,
      `<div style="position:relative;padding-bottom:56.25%;height:0;margin:12px 0;border-radius:10px;overflow:hidden;">` +
      `<iframe src="${src}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" allowfullscreen></iframe></div>`);
    setShowVideo(false); setVideoUrl(''); notify();
  };

  const TB = ({ icon, title, onClick }) => (
    <button type="button" title={title} onClick={onClick}
      style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 6px', borderRadius:4, display:'flex', alignItems:'center', color:'#6B7280' }}
      onMouseEnter={e=>e.currentTarget.style.background='#F3F4F6'}
      onMouseLeave={e=>e.currentTarget.style.background='none'}>
      <Ic n={icon} s={14} c="currentColor"/>
    </button>
  );

  const Dialog = ({ show, onClose, title, hint, value, onChange, onConfirm, placeholder }) =>
    show ? ReactDOM.createPortal(
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:12, padding:20, width:360, boxShadow:'0 20px 60px rgba(0,0,0,0.25)' }}>
          <div style={{ fontSize:14, fontWeight:700, marginBottom: hint ? 4 : 12, fontFamily:F }}>{title}</div>
          {hint && <div style={{ fontSize:12, color:'#6B7280', marginBottom:10, fontFamily:F }}>{hint}</div>}
          <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} autoFocus
            onKeyDown={e=>{ if(e.key==='Enter') onConfirm(); if(e.key==='Escape') onClose(); }}
            style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', fontFamily:F, boxSizing:'border-box' }} />
          <div style={{ display:'flex', gap:8, marginTop:12 }}>
            <button onClick={onClose} style={{ flex:1, padding:'8px', borderRadius:8, border:'1px solid #E5E7EB', background:'transparent', cursor:'pointer', fontSize:13, fontFamily:F }}>Cancel</button>
            <button onClick={onConfirm} style={{ flex:1, padding:'8px', borderRadius:8, border:'none', background:'#7C3AED', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:F }}>Insert</button>
          </div>
        </div>
      </div>,
      document.body
    ) : null;

  return (
    <div style={{ border:'1.5px solid var(--t-border,#E5E7EB)', borderRadius:10, overflow:'hidden', background:'#fff' }}>
      <div style={{ display:'flex', alignItems:'center', gap:2, padding:'6px 8px', borderBottom:'1px solid #E5E7EB', background:'#F9FAFB', flexWrap:'wrap' }}>
        <TB icon="bold"   title="Bold"         onClick={()=>exec('bold')} />
        <TB icon="italic" title="Italic"       onClick={()=>exec('italic')} />
        <div style={{ width:1, height:16, background:'#E5E7EB', margin:'0 4px' }} />
        <TB icon="link"   title="Insert link"  onClick={()=>{ saveRange(); setShowLink(true); }} />
        <TB icon="image"  title="Insert image" onClick={()=>imageRef.current?.click()} />
        <TB icon="video"  title="Embed video"  onClick={()=>{ saveRange(); setShowVideo(true); }} />
        <input ref={imageRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleImage} />
        <div style={{ width:1, height:16, background:'#E5E7EB', margin:'0 4px' }} />
        <TB icon="x" title="Clear formatting"  onClick={()=>exec('removeFormat')} />
      </div>
      <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={notify}
        style={{ minHeight:120, maxHeight:300, overflowY:'auto', padding:'12px 14px', fontSize:14, color:'#111827', lineHeight:1.7, outline:'none' }} />
      <Dialog show={showLink}  onClose={()=>setShowLink(false)}  title="Insert Link"  placeholder="https://…"  value={linkUrl}  onChange={setLinkUrl}  onConfirm={insertLink} />
      <Dialog show={showVideo} onClose={()=>setShowVideo(false)} title="Embed Video"  hint="YouTube or Vimeo URL" placeholder="https://www.youtube.com/watch?v=…" value={videoUrl} onChange={setVideoUrl} onConfirm={insertVideo} />
    </div>
  );
}

// ── WhatsNew bell button (existing — for top bar) ────────────────────────────
export function WhatsNewButton() {
  const [open,     setOpen]     = useState(false);
  const [notes,    setNotes]    = useState([]);
  const [lastSeen, setLastSeen] = useState(() => localStorage.getItem('vrc_news_seen') || '2000-01-01');
  const [selected, setSelected] = useState(null);
  const panelRef = useRef(null);

  useEffect(() => {
    api.get('/release-notes').then(d => setNotes(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    const handler = e => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const unread = notes.filter(n => new Date(n.published_at) > new Date(lastSeen)).length;

  const handleOpen = () => {
    if (!open) { const now = new Date().toISOString(); localStorage.setItem('vrc_news_seen', now); setLastSeen(now); }
    setOpen(o => !o);
  };

  return (
    <div style={{ position: 'relative', flexShrink: 0 }} ref={panelRef}>
      <button onClick={handleOpen} title="What's new" style={{
        width: 34, height: 34, borderRadius: 8, border: '1px solid var(--t-border, #E5E7EB)',
        background: open ? 'var(--t-accent-light, #EEF2FF)' : 'var(--t-surface, #fff)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', transition: 'all .15s',
      }}>
        <Ic n="bell" s={16} c={open ? 'var(--t-accent, #4361EE)' : 'var(--t-text3, #6B7280)'} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 99,
            background: 'var(--t-accent, #4361EE)', color: '#fff', fontSize: 9, fontWeight: 800,
            fontFamily: F, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--t-bg, #f7f8fc)',
          }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 42, right: 0, width: 380, zIndex: 800,
          background: 'var(--t-surface, #fff)', borderRadius: 16,
          border: '1px solid var(--t-border, #E5E7EB)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)', overflow: 'hidden', fontFamily: F,
        }}>
          {selected ? (
            <NoteDetail note={selected} onBack={() => setSelected(null)} />
          ) : (
            <>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--t-border, #E5E7EB)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-text1, #111827)' }}>What's New</div>
                  <div style={{ fontSize: 11, color: 'var(--t-text3, #6B7280)' }}>{notes.length} releases</div>
                </div>
                <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t-text3)', padding: 4 }}>
                  <Ic n="x" s={14} />
                </button>
              </div>
              <div style={{ maxHeight: 440, overflowY: 'auto' }}>
                {notes.length === 0
                  ? <div style={{ padding: 32, textAlign: 'center', color: 'var(--t-text3)', fontSize: 13 }}>No release notes yet.</div>
                  : notes.map(note => {
                    const isNew = new Date(note.published_at) > new Date(lastSeen);
                    const meta  = CATEGORY_META[note.category] || CATEGORY_META.feature;
                    return (
                      <div key={note.id} onClick={() => setSelected(note)} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--t-border, #E5E7EB)', background: isNew ? '#FAFBFF' : 'transparent', transition: 'background .1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--t-accent-light, #EEF2FF)'}
                        onMouseLeave={e => e.currentTarget.style.background = isNew ? '#FAFBFF' : 'transparent'}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Ic n="sparkle" s={14} c={meta.color} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-text1, #111827)', flex: 1 }}>{note.title}</span>
                              {isNew && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 5px', background: 'var(--t-accent, #4361EE)', color: '#fff', borderRadius: 99 }}>NEW</span>}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--t-text3, #6B7280)', marginBottom: 3 }}>v{note.version} · {new Date(note.published_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</div>
                            <div style={{ fontSize: 12, color: 'var(--t-text2, #374151)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.summary}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Note detail (read-only, used in bell panel and inline) ───────────────────
function NoteDetail({ note, onBack }) {
  const meta = CATEGORY_META[note.category] || CATEGORY_META.feature;
  return (
    <div>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--t-border, #E5E7EB)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}>
          <Ic n="back" s={14} c="var(--t-text3, #6B7280)" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-text1, #111827)' }}>{note.title}</div>
          <div style={{ fontSize: 11, color: 'var(--t-text3, #6B7280)' }}>v{note.version}</div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: meta.bg, color: meta.color }}>{meta.label}</span>
      </div>
      <div style={{ padding: '14px 16px', maxHeight: 400, overflowY: 'auto' }}>
        <div style={{ fontSize: 11, color: 'var(--t-text3)', marginBottom: 10 }}>
          {new Date(note.published_at).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
        </div>
        {note.summary_rich ? (
          <div className="rn-rich-body" style={{ fontSize: 13, color: 'var(--t-text2, #374151)', lineHeight: 1.7, marginBottom: 14 }}
            dangerouslySetInnerHTML={{ __html: note.summary_rich }} />
        ) : note.summary ? (
          <div style={{ fontSize: 13, color: 'var(--t-text2, #374151)', lineHeight: 1.6, marginBottom: 14, padding: '10px 12px', background: 'var(--t-bg, #f7f8fc)', borderRadius: 8 }}>
            {note.summary}
          </div>
        ) : null}
        {note.features?.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>What's included</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {note.features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--t-text2)', lineHeight: 1.5 }}>
                  <span style={{ color: meta.color, flexShrink: 0, marginTop: 2 }}><Ic n="check" s={13} c={meta.color} /></span>
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Login modal ───────────────────────────────────────────────────────────────
export function ReleaseNotesLoginModal({ userId, onDone }) {
  const [notes,   setNotes]   = useState([]);
  const [idx,     setIdx]     = useState(0);
  const [dismissed, setDismissed] = useState(new Set()); // per-note dismiss tracking
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { onDone?.(); return; }
    api.get(`/release-notes/login-modal?user_id=${userId}`)
      .then(d => {
        const arr = Array.isArray(d) ? d : [];
        setNotes(arr);
        setLoading(false);
        if (arr.length === 0) onDone?.();
      })
      .catch(() => {
        setLoading(false);
        onDone?.();
      });
  }, [userId]); // eslint-disable-line

  if (loading) return null;
  if (notes.length === 0) return null;

  const note   = notes[idx];
  const meta   = CATEGORY_META[note.category] || CATEGORY_META.feature;
  const isLast = idx === notes.length - 1;
  const isChecked = dismissed.has(note.id);

  const toggleDismiss = async (checked) => {
    const next = new Set(dismissed);
    if (checked) {
      next.add(note.id);
      // Fire dismiss API immediately so it persists even if user closes modal
      api.post(`/release-notes/${note.id}/dismiss`, { user_id: userId }).catch(() => {});
    } else {
      next.delete(note.id);
    }
    setDismissed(next);
  };

  const handleNext = () => {
    if (isLast) {
      onDone?.();
    } else {
      setIdx(i => i + 1);
    }
  };

  const handleClose = () => { onDone?.(); };

  return ReactDOM.createPortal(
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:520, boxShadow:'0 32px 80px rgba(0,0,0,0.3)', overflow:'hidden', fontFamily:F }}>
        {/* Coloured header */}
        <div style={{ background:`linear-gradient(135deg, ${meta.color}18, ${meta.color}06)`, borderBottom:`3px solid ${meta.color}`, padding:'20px 24px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:meta.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Ic n="sparkle" s={18} c="#fff"/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:meta.color, marginBottom:3 }}>{meta.label}</div>
              <div style={{ fontSize:18, fontWeight:800, color:'#111827', lineHeight:1.2 }}>{note.title}</div>
            </div>
            <div style={{ fontSize:12, fontWeight:600, color:'#9CA3AF' }}>v{note.version}</div>
            <button onClick={handleClose} style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:'#9CA3AF', display:'flex', marginLeft:4 }}>
              <Ic n="x" s={16} c="#9CA3AF"/>
            </button>
          </div>
        </div>
        {/* Body */}
        <div style={{ padding:'20px 24px', maxHeight:340, overflowY:'auto' }}>
          {note.summary_rich ? (
            <div className="rn-rich-body" style={{ fontSize:14, color:'#374151', lineHeight:1.7, marginBottom:14 }}
              dangerouslySetInnerHTML={{ __html: note.summary_rich }} />
          ) : note.summary ? (
            <div style={{ fontSize:14, color:'#374151', lineHeight:1.6, marginBottom:14 }}>{note.summary}</div>
          ) : null}
          {note.features?.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {note.features.map((f, i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:13, color:'#374151', lineHeight:1.5 }}>
                  <div style={{ width:18, height:18, borderRadius:99, background:`${meta.color}22`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                    <Ic n="check" s={10} c={meta.color}/>
                  </div>
                  {f}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Footer */}
        <div style={{ padding:'14px 24px', borderTop:'1px solid #F3F4F6', display:'flex', alignItems:'center', gap:12, background:'#FAFAFA' }}>
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', flex:1 }}>
            <input type="checkbox" checked={isChecked} onChange={e => toggleDismiss(e.target.checked)}
              style={{ width:15, height:15, accentColor:meta.color, cursor:'pointer' }} />
            <span style={{ fontSize:12, color:'#6B7280', fontFamily:F }}>Don't show this again</span>
          </label>
          {notes.length > 1 && (
            <div style={{ display:'flex', gap:5 }}>
              {notes.map((_, i) => (
                <div key={i} onClick={()=>setIdx(i)} style={{ width: i===idx ? 16 : 6, height:6, borderRadius:99, background: i===idx ? meta.color : '#D1D5DB', transition:'all .2s', cursor:'pointer' }} />
              ))}
            </div>
          )}
          <button onClick={handleNext}
            style={{ padding:'9px 20px', borderRadius:9, border:'none', background:meta.color, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:F, flexShrink:0 }}>
            {isLast ? 'Got it' : 'Next →'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Shared editor primitives (module-level — never inside a render fn) ────────
const S_INPUT = {
  width:'100%', padding:'8px 12px', borderRadius:8,
  border:'1px solid var(--t-border,#334155)',
  background:'var(--t-surface2,#1e293b)', color:'var(--t-text1,#e2e8f0)',
  fontSize:13, fontFamily:F, boxSizing:'border-box', outline:'none',
};

function EditorLabel({ children }) {
  return <label style={{ fontSize:12, fontWeight:700, color:'var(--t-text3,#94a3b8)', display:'block', marginBottom:5 }}>{children}</label>;
}
function EditorField({ label, children }) {
  return <div style={{ marginBottom:14 }}><EditorLabel>{label}</EditorLabel>{children}</div>;
}
function EditorToggle({ checked, onChange, label, sublabel }) {
  return (
    <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', marginBottom:12 }}>
      <div onClick={() => onChange(!checked)}
        style={{ width:36, height:20, borderRadius:99, background: checked ? '#7C3AED' : '#334155', position:'relative', cursor:'pointer', transition:'background .2s', flexShrink:0 }}>
        <div style={{ width:16, height:16, borderRadius:99, background:'#fff', position:'absolute', top:2, left: checked ? 18 : 2, transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }}/>
      </div>
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:'var(--t-text1,#e2e8f0)', fontFamily:F }}>{label}</div>
        {sublabel && <div style={{ fontSize:11, color:'var(--t-text3,#64748b)', fontFamily:F }}>{sublabel}</div>}
      </div>
    </label>
  );
}

// ── NoteEditor (used in ReleaseNotesAdmin) ───────────────────────────────────
function NoteEditor({ note = {}, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    version:         note.version || '',
    title:           note.title   || '',
    summary:         note.summary || '',
    summary_rich:    note.summary_rich || '',
    category:        note.category || 'feature',
    features:        (note.features || []).join('\n'),
    published:       !!note.published,
    display_at_login:!!note.display_at_login,
    scheduled_at:    note.scheduled_at ? note.scheduled_at.slice(0, 16) : '',
    id:              note.id,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    onSave({
      ...form,
      features:     form.features.split('\n').map(s => s.trim()).filter(Boolean),
      summary_rich: form.summary_rich || null,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
    });
  };

  return (
    <div style={{ padding:'24px 28px', fontFamily:F, color:'var(--t-text1,#e2e8f0)', maxHeight:'90vh', overflowY:'auto' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={onCancel} style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
          <Ic n="back" s={18} c="#7C3AED"/>
        </button>
        <div style={{ fontSize:18, fontWeight:800 }}>{form.id ? 'Edit Release Note' : 'New Release Note'}</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <EditorField label="Version *">
          <input value={form.version} onChange={e=>set('version',e.target.value)} placeholder="1.8.0" style={S_INPUT}/>
        </EditorField>
        <EditorField label="Category">
          <select value={form.category} onChange={e=>set('category',e.target.value)} style={{ ...S_INPUT, background:'var(--t-surface2,#1e293b)' }}>
            {Object.entries(CATEGORY_META).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
        </EditorField>
      </div>

      <EditorField label="Title *">
        <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Feature name or summary" style={S_INPUT}/>
      </EditorField>

      <EditorField label="Plain summary (shown in cards and dropdowns)">
        <textarea value={form.summary} onChange={e=>set('summary',e.target.value)} rows={2} placeholder="One or two sentence summary…" style={{ ...S_INPUT, resize:'vertical' }}/>
      </EditorField>

      <EditorField label="Rich description (supports text, images, video)">
        <div style={{ background:'#fff', borderRadius:10 }}>
          <RichEditor value={form.summary_rich} onChange={v => set('summary_rich', v)} />
        </div>
      </EditorField>

      <EditorField label="Feature list (one per line)">
        <textarea value={form.features} onChange={e=>set('features',e.target.value)} rows={5} placeholder="Each feature on its own line…" style={{ ...S_INPUT, resize:'vertical' }}/>
      </EditorField>

      {/* Publishing options */}
      <div style={{ background:'#0f172a', borderRadius:10, border:'1px solid #334155', padding:16, marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#64748b', marginBottom:14, textTransform:'uppercase', letterSpacing:'0.06em' }}>Publishing</div>
        <EditorToggle checked={form.published} onChange={v=>set('published',v)} label="Published" sublabel="Visible to all users in the What's New panel" />
        {!form.published && (
          <div style={{ marginBottom:12 }}>
            <EditorLabel><span style={{ display:'flex', alignItems:'center', gap:5 }}><Ic n="calendar" s={12} c="#7C3AED"/> Schedule publish date</span></EditorLabel>
            <input type="datetime-local" value={form.scheduled_at} onChange={e=>set('scheduled_at',e.target.value)}
              min={new Date().toISOString().slice(0,16)}
              style={S_INPUT}/>
            {form.scheduled_at && (
              <div style={{ fontSize:11, color:'#7C3AED', marginTop:5, fontFamily:F }}>
                Will publish on {new Date(form.scheduled_at).toLocaleString()}
              </div>
            )}
          </div>
        )}
        <EditorToggle checked={form.display_at_login} onChange={v=>set('display_at_login',v)}
          label={<span style={{ display:'flex', alignItems:'center', gap:5 }}><Ic n="login" s={12} c="#e2e8f0"/> Show at login</span>}
          sublabel="Pop up as a modal when users log in (until they dismiss it)" />
      </div>

      <div style={{ display:'flex', gap:10 }}>
        <button onClick={onCancel} style={{ padding:'9px 20px', borderRadius:8, border:'1px solid #334155', background:'transparent', color:'#cbd5e1', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F }}>Cancel</button>
        <button onClick={handleSubmit} disabled={saving || !form.version || !form.title}
          style={{ padding:'9px 20px', borderRadius:8, border:'none', background:'#7C3AED', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:F, opacity: saving || !form.version || !form.title ? 0.5 : 1 }}>
          {saving ? 'Saving…' : form.id ? 'Save Changes' : 'Create Note'}
        </button>
      </div>
    </div>
  );
}

// ── Admin panel (for /superadmin) ─────────────────────────────────────────────
export function ReleaseNotesAdmin() {
  const [notes,   setNotes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await api.get('/release-notes?published_only=false');
    setNotes(Array.isArray(d) ? d : []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleSave = async form => {
    setSaving(true);
    try {
      if (form.id) await api.patch(`/release-notes/${form.id}`, form);
      else         await api.post('/release-notes', form);
      await load(); setEditing(null);
    } finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!(await window.__confirm?.({ title:'Delete this release note?', danger:true }) ?? confirm('Delete?'))) return;
    await api.del(`/release-notes/${id}`); await load();
  };

  const handleTogglePublish = async note => {
    await api.patch(`/release-notes/${note.id}`, { published: !note.published });
    await load();
  };

  if (editing !== null) return <NoteEditor note={editing} onSave={handleSave} onCancel={() => setEditing(null)} saving={saving} />;

  return (
    <div style={{ padding: '24px 28px', fontFamily: F, color: 'var(--t-text1, #e2e8f0)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Release Notes</div>
          <div style={{ fontSize: 13, color: 'var(--t-text3, #94a3b8)', marginTop: 2 }}>Manage what's new notifications shown to all platform users.</div>
        </div>
        <button onClick={() => setEditing({})} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'#7C3AED', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F }}>
          <Ic n="plus" s={14} c="#fff" /> New Release Note
        </button>
      </div>
      {loading ? <div style={{ padding:40, textAlign:'center', color:'#64748b' }}>Loading…</div>
      : notes.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, color:'#64748b' }}>
          <div>No release notes yet.</div>
          <button onClick={() => setEditing({})} style={{ marginTop:12, padding:'8px 16px', background:'#7C3AED', color:'#fff', border:'none', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:F }}>Create First Note</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {notes.map(note => {
            const meta = CATEGORY_META[note.category] || CATEGORY_META.feature;
            const isScheduled = !note.published && note.scheduled_at && new Date(note.scheduled_at) > new Date();
            return (
              <div key={note.id} style={{ background:'#1e293b', borderRadius:12, border:'1px solid #334155', padding:'14px 16px', display:'flex', alignItems:'flex-start', gap:12 }}>
                <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, background: meta.color + '22', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Ic n="sparkle" s={16} c={meta.color} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4, flexWrap:'wrap' }}>
                    <span style={{ fontSize:14, fontWeight:700, color:'#e2e8f0' }}>{note.title}</span>
                    <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:99, background: meta.color + '22', color: meta.color }}>{meta.label}</span>
                    {!note.published && !isScheduled && <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:99, background:'#334155', color:'#94a3b8' }}>DRAFT</span>}
                    {isScheduled && <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:99, background:'#1D4ED822', color:'#60A5FA', display:'inline-flex', alignItems:'center', gap:4 }}><Ic n="calendar" s={10} c="#60A5FA"/> SCHEDULED</span>}
                    {note.display_at_login && <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:99, background:'#7C3AED22', color:'#A78BFA', display:'inline-flex', alignItems:'center', gap:4 }}><Ic n="login" s={10} c="#A78BFA"/> LOGIN</span>}
                    {note.summary_rich && <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:99, background:'#0CAF7722', color:'#34D399' }}>RICH</span>}
                  </div>
                  <div style={{ fontSize:12, color:'#64748b', marginBottom:3 }}>
                    v{note.version} · {isScheduled ? `Publishes ${new Date(note.scheduled_at).toLocaleString()}` : note.published_at ? new Date(note.published_at).toLocaleDateString() : 'Unpublished'}
                    {' '}· {note.features?.length || 0} features
                    {note.dismissed_by?.length > 0 && ` · ${note.dismissed_by.length} dismissed`}
                  </div>
                  <div style={{ fontSize:12, color:'#94a3b8' }}>{note.summary}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                  <button onClick={() => handleTogglePublish(note)} style={{ padding:'5px 10px', borderRadius:6, border:'1px solid #334155', background: note.published ? '#0CAF77' : 'transparent', color: note.published ? '#fff' : '#94a3b8', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:F }}>
                    {note.published ? 'Published' : 'Publish'}
                  </button>
                  <button onClick={() => setEditing(note)} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:4, display:'flex' }}><Ic n="edit" s={14} /></button>
                  <button onClick={() => handleDelete(note.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#EF4444', padding:4, display:'flex' }}><Ic n="trash" s={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
