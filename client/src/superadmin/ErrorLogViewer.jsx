// client/src/superadmin/ErrorLogViewer.jsx
import { useState, useEffect, useCallback } from 'react';

const F = "'DM Sans', -apple-system, sans-serif";
const C = {
  bg:'#0F1729', card:'#1A2540', border:'#2D3F6B',
  text1:'#F1F5F9', text2:'#94A3B8', accent:'#818CF8',
  success:'#10B981', danger:'#EF4444', warning:'#F59E0B',
};

const SEV_META = {
  error:   { bg:'#FEF2F2', text:'#DC2626', border:'#FECACA' },
  warning: { bg:'#FFFBEB', text:'#D97706', border:'#FDE68A' },
  info:    { bg:'#EFF6FF', text:'#2563EB', border:'#BFDBFE' },
};

function SevBadge({ s }) {
  const m = SEV_META[s] || SEV_META.info;
  return <span style={{ padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:700, background:m.bg, color:m.text, border:`1px solid ${m.border}`, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s}</span>;
}

function timeAgo(ts) {
  const d = Date.now() - new Date(ts);
  const m = Math.floor(d/60000);
  if (m<1) return 'just now';
  if (m<60) return `${m}m ago`;
  const h = Math.floor(m/60);
  if (h<24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

export default function ErrorLogViewer() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [note, setNote] = useState('');
  const [sevFilter, setSevFilter] = useState('all');
  const [resolvedFilter, setResolvedFilter] = useState('unresolved');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page, limit:50 });
    if (sevFilter !== 'all') p.set('severity', sevFilter);
    if (resolvedFilter !== 'all') p.set('resolved', resolvedFilter === 'resolved' ? 'true' : 'false');
    if (search) p.set('search', search);
    const [data, s] = await Promise.all([
      fetch(`/api/error-logs?${p}`).then(r=>r.json()),
      fetch('/api/error-logs/meta/stats').then(r=>r.json()),
    ]);
    setLogs(data.logs || []);
    setTotal(data.total || 0);
    setStats(s);
    setLoading(false);
  }, [page, sevFilter, resolvedFilter, search]);

  useEffect(() => { load(); }, [load]);

  const handleResolve = async (log, resolved = true) => {
    setResolving(true);
    await fetch(`/api/error-logs/${log.id}/resolve`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ resolved, resolution_note: note }),
    });
    setNote(''); setSelected(null); setResolving(false); load();
  };

  const handleDelete = async (log) => {
    if (!confirm('Delete this error log permanently?')) return;
    await fetch(`/api/error-logs/${log.id}`, { method:'DELETE' });
    setSelected(null); load();
  };

  return (
    <div style={{ fontFamily:F, color:C.text1, minHeight:'100vh', background:C.bg }}>
      {/* Header */}
      <div style={{ padding:'20px 28px 16px', borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div>
            <h2 style={{ margin:0, fontSize:20, fontWeight:800 }}>Error Logs</h2>
            <p style={{ margin:'4px 0 0', fontSize:13, color:C.text2 }}>All application errors reported across environments</p>
          </div>
          <button onClick={load} style={{ padding:'8px 14px', borderRadius:8, border:`1px solid ${C.border}`, background:'transparent', color:C.text2, fontSize:12, cursor:'pointer', fontFamily:F }}>↻ Refresh</button>
        </div>
        {/* Stat cards */}
        {stats && (
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {[['Total', stats.total, C.accent], ['Unresolved', stats.unresolved, C.danger], ['Last 24h', stats.last_24h, C.warning], ['Last 7d', stats.last_7d, C.accent]].map(([l,v,col]) => (
              <div key={l} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'12px 18px', minWidth:110 }}>
                <div style={{ fontSize:24, fontWeight:800, color:col, lineHeight:1 }}>{v}</div>
                <div style={{ fontSize:12, color:C.text1, fontWeight:600, marginTop:4 }}>{l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display:'flex', height:'calc(100vh - 240px)' }}>
        {/* List */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', borderRight:`1px solid ${C.border}` }}>
          {/* Filters */}
          <div style={{ padding:'12px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', gap:8, flexWrap:'wrap' }}>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search…"
              style={{ flex:1, minWidth:140, padding:'7px 10px', borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.text1, fontSize:13, fontFamily:F }} />
            {[['resolvedFilter',resolvedFilter,setResolvedFilter,[['unresolved','Unresolved'],['resolved','Resolved'],['all','All']]],
              ['sevFilter',sevFilter,setSevFilter,[['all','All severities'],['error','Errors'],['warning','Warnings'],['info','Info']]]
            ].map(([key,val,setter,opts])=>(
              <select key={key} value={val} onChange={e=>{setter(e.target.value);setPage(1);}}
                style={{ padding:'7px 10px', borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.text1, fontSize:12, fontFamily:F }}>
                {opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            ))}
          </div>
          {/* Rows */}
          <div style={{ flex:1, overflowY:'auto' }}>
            {loading ? <div style={{ padding:40, textAlign:'center', color:C.text2 }}>Loading…</div>
            : logs.length===0 ? (
              <div style={{ padding:60, textAlign:'center', color:C.text2 }}>
                <div style={{ fontSize:36, marginBottom:12, opacity:.4 }}>✓</div>
                <div style={{ fontSize:14 }}>{resolvedFilter==='unresolved'?'All clear — no unresolved errors':'No errors match the current filters'}</div>
              </div>
            ) : logs.map(log => (
              <div key={log.id} onClick={()=>setSelected(s=>s?.id===log.id?null:log)}
                style={{ padding:'13px 18px', borderBottom:`1px solid ${C.border}`, cursor:'pointer',
                  background:selected?.id===log.id?'#1E2E50':'transparent', display:'flex', alignItems:'flex-start', gap:10 }}
                onMouseEnter={e=>{if(selected?.id!==log.id) e.currentTarget.style.background='#172038';}}
                onMouseLeave={e=>{if(selected?.id!==log.id) e.currentTarget.style.background='transparent';}}>
                <div style={{ width:7, height:7, borderRadius:'50%', marginTop:5, flexShrink:0,
                  background:log.severity==='error'?C.danger:log.severity==='warning'?C.warning:C.accent }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                    <code style={{ fontSize:11, padding:'1px 5px', borderRadius:4, background:'#0F1729', color:C.text2, fontFamily:'monospace' }}>{log.code}</code>
                    <SevBadge s={log.severity}/>
                    {log.resolved && <span style={{ fontSize:10, color:C.success, fontWeight:700 }}>✓ RESOLVED</span>}
                    <span style={{ marginLeft:'auto', fontSize:11, color:C.text2 }}>{timeAgo(log.created_at)}</span>
                  </div>
                  <div style={{ fontSize:13, color:C.text1, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{log.message}</div>
                  <div style={{ display:'flex', gap:10, fontSize:11, color:C.text2, marginTop:2 }}>
                    {log.component && <span>📌 {log.component}</span>}
                    {log.user_email && <span>👤 {log.user_email}</span>}
                    {log.environment_name && <span>🌐 {log.environment_name}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {total>50 && (
            <div style={{ padding:'10px 18px', borderTop:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:12, color:C.text2 }}>{total} total</span>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{ padding:'4px 10px', borderRadius:6, border:`1px solid ${C.border}`, background:'transparent', color:C.text2, fontSize:12, cursor:'pointer', fontFamily:F }}>← Prev</button>
                <span style={{ fontSize:12, color:C.text2, padding:'4px 0' }}>Page {page}</span>
                <button onClick={()=>setPage(p=>p+1)} disabled={logs.length<50} style={{ padding:'4px 10px', borderRadius:6, border:`1px solid ${C.border}`, background:'transparent', color:C.text2, fontSize:12, cursor:'pointer', fontFamily:F }}>Next →</button>
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ width:400, overflowY:'auto', padding:'18px 22px' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
              <div>
                <code style={{ fontSize:11, padding:'3px 7px', borderRadius:6, background:'#0F1729', color:C.text2, fontFamily:'monospace', display:'block', marginBottom:8 }}>{selected.code}</code>
                <SevBadge s={selected.severity}/>
              </div>
              <button onClick={()=>setSelected(null)} style={{ background:'none', border:'none', color:C.text2, cursor:'pointer', fontSize:18, padding:4 }}>×</button>
            </div>
            <div style={{ background:'#0F1729', borderRadius:10, padding:'12px 14px', marginBottom:14, fontSize:13, color:C.text1, fontWeight:600, lineHeight:1.5 }}>{selected.message}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:18 }}>
              {[['Time',new Date(selected.created_at).toLocaleString()],['User',selected.user_email||'—'],
                ['Environment',selected.environment_name||'—'],['URL',selected.url||'—'],['Component',selected.component||'—']
              ].map(([k,v])=>(
                <div key={k} style={{ display:'flex', gap:8, fontSize:12 }}>
                  <span style={{ color:C.text2, minWidth:80, flexShrink:0 }}>{k}</span>
                  <span style={{ color:C.text1, wordBreak:'break-all' }}>{v}</span>
                </div>
              ))}
            </div>
            {selected.stack && (
              <details style={{ marginBottom:16 }}>
                <summary style={{ color:C.text2, fontSize:12, cursor:'pointer', marginBottom:6 }}>Stack trace</summary>
                <pre style={{ background:'#0F1729', borderRadius:8, padding:10, fontSize:11, color:'#CBD5E1', overflowX:'auto', lineHeight:1.6, whiteSpace:'pre-wrap', wordBreak:'break-all', border:`1px solid ${C.border}`, maxHeight:200 }}>{selected.stack}</pre>
              </details>
            )}
            {selected.resolved ? (
              <div style={{ background:'#0B2D20', border:'1px solid #065F46', borderRadius:10, padding:'12px 14px', marginBottom:14 }}>
                <div style={{ color:C.success, fontSize:12, fontWeight:700, marginBottom:4 }}>✓ Resolved {selected.resolved_at?`— ${timeAgo(selected.resolved_at)}`:''}</div>
                {selected.resolved_by && <div style={{ color:'#6EE7B7', fontSize:12 }}>by {selected.resolved_by}</div>}
                {selected.resolution_note && <div style={{ color:'#A7F3D0', fontSize:12, marginTop:6, lineHeight:1.5 }}>"{selected.resolution_note}"</div>}
                <button onClick={()=>handleResolve(selected,false)} style={{ marginTop:10, padding:'6px 12px', borderRadius:6, border:'1px solid #065F46', background:'transparent', color:'#6EE7B7', fontSize:11, cursor:'pointer', fontFamily:F }}>Mark as unresolved</button>
              </div>
            ) : (
              <div style={{ marginBottom:14 }}>
                <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Resolution note (optional)…" rows={3}
                  style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.text1, fontSize:12, fontFamily:F, resize:'vertical', boxSizing:'border-box', marginBottom:8 }}/>
                <button onClick={()=>handleResolve(selected,true)} disabled={resolving}
                  style={{ width:'100%', padding:10, borderRadius:8, border:'none', background:C.success, color:'white', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:F, opacity:resolving?.7:1 }}>
                  {resolving?'Saving…':'✓ Mark as resolved'}
                </button>
              </div>
            )}
            <button onClick={()=>handleDelete(selected)} style={{ width:'100%', padding:8, borderRadius:8, border:'1px solid #3F1F1F', background:'transparent', color:'#EF4444', fontSize:12, cursor:'pointer', fontFamily:F }}>Delete log</button>
          </div>
        )}
      </div>
    </div>
  );
}
