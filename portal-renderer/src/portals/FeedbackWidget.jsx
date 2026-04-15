// portal-renderer/src/portals/FeedbackWidget.jsx
// Per-page visitor feedback widget — shows after the user views a page.
// Renders as a fixed bottom-right pill. On click → star rating + optional reason.
import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || '';

const REASONS_BY_RATING = {
  low:  ['Hard to navigate','Information missing','Too slow','Not relevant','Other'],
  mid:  ['Could be clearer','Missing some info','Looks outdated','Other'],
  high: ['Easy to use','Found what I needed','Great design','Very helpful','Other'],
};

const StarIcon = ({ filled, size=22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled?'#f59e0b':'none'}
    stroke={filled?'#f59e0b':'#d1d5db'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

export default function FeedbackWidget({ portalId, pageSlug, theme = {} }) {
  const [open,      setOpen]      = useState(false);
  const [rating,    setRating]    = useState(0);
  const [hovered,   setHovered]   = useState(0);
  const [reason,    setReason]    = useState('');
  const [comment,   setComment]   = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting,setSubmitting]= useState(false);

  const accent = theme.primary || '#4361EE';
  const F = theme.font || 'DM Sans, sans-serif';

  // Auto-open after 30s if not already submitted this session
  useEffect(() => {
    const key = `fb_${portalId}_${pageSlug}`;
    if (sessionStorage.getItem(key)) return;
    const t = setTimeout(() => setOpen(true), 30000);
    return () => clearTimeout(t);
  }, [portalId, pageSlug]);

  const reasonGroup = rating >= 4 ? 'high' : rating >= 3 ? 'mid' : 'low';
  const reasons = REASONS_BY_RATING[reasonGroup] || [];

  const submit = async () => {
    if (!rating) return;
    setSubmitting(true);
    try {
      await fetch(`${API}/api/portal-feedback/${portalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_slug: pageSlug, rating, reason, comment }),
      });
      sessionStorage.setItem(`fb_${portalId}_${pageSlug}`, '1');
      setSubmitted(true);
      setTimeout(() => setOpen(false), 2000);
    } catch (_) {}
    setSubmitting(false);
  };

  const pill = (
    <button onClick={() => setOpen(o => !o)}
      style={{
        position:'fixed', bottom:20, right:20, zIndex:9000,
        background: accent, color:'white',
        border:'none', borderRadius:99, padding:'9px 18px',
        fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:F,
        boxShadow:'0 4px 16px rgba(0,0,0,.18)',
        display:'flex', alignItems:'center', gap:6,
        transition:'transform .15s, box-shadow .15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,.22)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.18)'; }}>
      <StarIcon filled size={14}/> Share feedback
    </button>
  );

  if (!open) return pill;

  return (
    <>
      {pill}
      <div style={{
        position:'fixed', bottom:70, right:20, zIndex:9001,
        background:'#fff', borderRadius:18, padding:22, width:300,
        boxShadow:'0 12px 48px rgba(0,0,0,.18)', fontFamily:F,
        border:'1px solid #e5e7eb', animation:'slideUp .2s ease',
      }}>
        {submitted ? (
          <div style={{ textAlign:'center', padding:'16px 0' }}>
            <div style={{ fontSize:30, marginBottom:8 }}>🎉</div>
            <div style={{ fontWeight:700, fontSize:15, color:'#111827' }}>Thanks for your feedback!</div>
            <div style={{ fontSize:12, color:'#6b7280', marginTop:4 }}>Your response helps us improve.</div>
          </div>
        ) : (
          <>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ fontWeight:700, fontSize:14, color:'#111827' }}>How was your experience?</div>
              <button onClick={() => setOpen(false)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:18, lineHeight:1, padding:0 }}>×</button>
            </div>

            {/* Stars */}
            <div style={{ display:'flex', gap:6, justifyContent:'center', marginBottom:14 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => { setRating(n); setReason(''); }}
                  onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)}
                  style={{ background:'none', border:'none', cursor:'pointer', padding:2 }}>
                  <StarIcon filled={n <= (hovered || rating)} size={28}/>
                </button>
              ))}
            </div>

            {/* Reason chips */}
            {rating > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
                {reasons.map(r => (
                  <button key={r} onClick={() => setReason(r === reason ? '' : r)}
                    style={{
                      padding:'4px 10px', borderRadius:99, fontSize:11, fontWeight:600, cursor:'pointer',
                      border:`1.5px solid ${reason===r ? accent : '#e5e7eb'}`,
                      background: reason===r ? `${accent}14` : '#f9fafb',
                      color: reason===r ? accent : '#374151',
                    }}>{r}</button>
                ))}
              </div>
            )}

            {/* Optional comment */}
            {rating > 0 && (
              <textarea value={comment} onChange={e=>setComment(e.target.value)}
                placeholder="Any additional thoughts? (optional)"
                rows={2}
                style={{ width:'100%', boxSizing:'border-box', padding:'7px 10px', borderRadius:9,
                  border:'1.5px solid #e5e7eb', fontSize:12, fontFamily:F, resize:'none', outline:'none',
                  color:'#374151', marginBottom:10 }}/>
            )}

            <button onClick={submit} disabled={!rating || submitting}
              style={{
                width:'100%', padding:'9px', borderRadius:10, border:'none',
                background: rating ? accent : '#e5e7eb',
                color: rating ? 'white' : '#9ca3af',
                fontSize:13, fontWeight:700, cursor: rating ? 'pointer' : 'default', fontFamily:F,
              }}>
              {submitting ? 'Submitting…' : 'Submit feedback'}
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </>
  );
}
