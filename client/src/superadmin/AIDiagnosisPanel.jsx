// client/src/superadmin/AIDiagnosisPanel.jsx
import { useState, useCallback } from 'react';

const F = "'DM Sans', -apple-system, sans-serif";
const C = { bg:'#0F1729', card:'#1A2540', border:'#2D3F6B', text1:'#F1F5F9', text2:'#94A3B8',
  text3:'#64748B', accent:'#818CF8', green:'#10B981', amber:'#F59E0B', red:'#EF4444', purple:'#A78BFA' };

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'12px 16px', minWidth:100 }}>
      <div style={{ fontSize:22, fontWeight:800, color:color||C.accent, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:11, fontWeight:700, color:C.text1, marginTop:4 }}>{label}</div>
      {sub&&<div style={{ fontSize:10, color:C.text3, marginTop:2 }}>{sub}</div>}
    </div>
  );
}

function IssueRow({ text, type }) {
  const color = type==='issue'?C.red:C.amber;
  return (
    <div style={{ display:'flex', gap:8, padding:'8px 12px', borderRadius:8,
      background:`${color}10`, border:`1px solid ${color}20`, marginBottom:6 }}>
      <span style={{ color, fontWeight:800, flexShrink:0, fontSize:13 }}>{type==='issue'?'✗':'⚠'}</span>
      <span style={{ fontSize:12, color:C.text1, lineHeight:1.5 }}>{text}</span>
    </div>
  );
}

function DiagnosisText({ text }) {
  if (!text) return null;
  return (
    <div style={{ fontFamily:F }}>
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height:8 }}/>;
        if (/^\d+\./.test(line.trim()))
          return <div key={i} style={{ fontSize:12, fontWeight:800, color:C.accent, marginTop:14, marginBottom:4 }}>{line.trim()}</div>;
        if (line.trim().startsWith('-') || line.trim().startsWith('•'))
          return (
            <div key={i} style={{ display:'flex', gap:8, fontSize:12, color:C.text2, lineHeight:1.6, paddingLeft:8, marginBottom:2 }}>
              <span style={{ color:C.accent, flexShrink:0 }}>›</span>
              <span>{line.replace(/^[-•]\s*/,'')}</span>
            </div>
          );
        if (/^[A-Z][A-Z\s&]+:/.test(line.trim()))
          return <div key={i} style={{ fontSize:12, fontWeight:700, color:C.text1, marginTop:8, lineHeight:1.5 }}>{line.trim()}</div>;
        return <div key={i} style={{ fontSize:12, color:C.text2, lineHeight:1.6, marginBottom:2 }}>{line}</div>;
      })}
    </div>
  );
}

export default function AIDiagnosisPanel({ environmentId, clientName, compact=false }) {
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState(null);
  const [tab,     setTab]     = useState('diagnosis');

  const run = useCallback(async () => {
    if (!environmentId) { setError('No environment ID provided.'); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res  = await fetch('/api/env-diagnosis', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ environment_id: environmentId, client_name: clientName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error||'Diagnosis failed');
      setResult(data);
    } catch(err) { setError(err.message); }
    setLoading(false);
  }, [environmentId, clientName]);

  const snap = result?.snapshot;

  return (
    <div style={{ fontFamily:F }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:result?16:8 }}>
        <div>
          <div style={{ fontSize:compact?13:15, fontWeight:800, color:C.text1 }}>AI Environment Diagnosis</div>
          {!compact&&<div style={{ fontSize:12, color:C.text2, marginTop:2 }}>Analyses usage, errors and activity to produce a plain-English health summary.</div>}
        </div>
        <button onClick={run} disabled={loading} style={{
          padding:'8px 16px', borderRadius:8, border:'none', cursor:loading?'not-allowed':'pointer',
          background:loading?C.border:'linear-gradient(135deg,#818CF8,#6366F1)',
          color:'white', fontSize:12, fontWeight:700, fontFamily:F,
          display:'flex', alignItems:'center', gap:6, flexShrink:0,
        }}>
          {loading
            ? <><div style={{ width:12,height:12,border:'2px solid white',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite' }}/> Diagnosing…</>
            : <>✦ {result?'Re-diagnose':'Run Diagnosis'}</>}
        </button>
      </div>

      {error&&<div style={{ padding:'10px 14px', borderRadius:8, background:`${C.red}15`, border:`1px solid ${C.red}30`, color:C.red, fontSize:12, marginBottom:12 }}>{error}</div>}

      {result&&<>
        <div style={{ display:'flex', gap:4, borderBottom:`1px solid ${C.border}`, marginBottom:16 }}>
          {[['diagnosis','✦ AI Diagnosis'],['snapshot','📊 Snapshot']].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{
              padding:'6px 14px', border:'none', background:'none', cursor:'pointer',
              fontFamily:F, fontSize:12, fontWeight:tab===id?700:500,
              color:tab===id?C.accent:C.text3,
              borderBottom:tab===id?`2px solid ${C.accent}`:'2px solid transparent', marginBottom:-1,
            }}>{label}</button>
          ))}
          <div style={{ marginLeft:'auto', fontSize:10, color:C.text3, alignSelf:'center', paddingRight:4 }}>
            {new Date(result.generated_at).toLocaleString()}
          </div>
        </div>

        {tab==='diagnosis'&&<div>
          {(snap.issues?.length>0||snap.warnings?.length>0)&&<div style={{ marginBottom:16 }}>
            {snap.issues.map((t,i)=><IssueRow key={i} text={t} type="issue"/>)}
            {snap.warnings.map((t,i)=><IssueRow key={i} text={t} type="warning"/>)}
          </div>}
          {!snap.issues?.length&&!snap.warnings?.length&&(
            <div style={{ padding:'10px 14px', borderRadius:8, background:`${C.green}15`, border:`1px solid ${C.green}30`, color:C.green, fontSize:12, fontWeight:600, marginBottom:16 }}>
              ✓ No critical issues or warnings detected automatically.
            </div>
          )}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
              <div style={{ width:22,height:22,borderRadius:6,background:'linear-gradient(135deg,#818CF8,#6366F1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'white' }}>✦</div>
              <span style={{ fontSize:12, fontWeight:700, color:C.accent }}>Vercentic AI Analysis</span>
            </div>
            <DiagnosisText text={result.diagnosis}/>
          </div>
        </div>}

        {tab==='snapshot'&&snap&&<div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:20 }}>
            <StatCard label="Records" value={snap.total_records} color={C.accent}/>
            <StatCard label="Users" value={snap.user_count} sub={`${snap.users_active_last_30d} active 30d`} color={C.purple}/>
            <StatCard label="Comms" value={snap.comms_total} sub={snap.comms_simulated?`${snap.comms_simulated} simulated`:'all real'} color={C.green}/>
            <StatCard label="Agents" value={snap.agent_count} sub={`${snap.agents_active} active`} color={C.amber}/>
            <StatCard label="Errors" value={snap.unresolved_errors} sub={`${snap.errors_last_7d} last 7d`} color={snap.unresolved_errors>0?C.red:C.green}/>
          </div>
          <div style={{ fontSize:10, fontWeight:700, color:C.text3, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>Objects & Record Counts</div>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden', marginBottom:20 }}>
            {snap.objects.map((o,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', padding:'10px 14px', borderBottom:i<snap.objects.length-1?`1px solid ${C.border}`:'none' }}>
                <span style={{ flex:1, fontSize:12, fontWeight:600, color:C.text1 }}>{o.name}</span>
                <span style={{ fontSize:11, padding:'2px 8px', borderRadius:99, background:`${o.record_count>0?C.accent:C.text3}20`, color:o.record_count>0?C.accent:C.text3, fontWeight:700 }}>{o.record_count} records</span>
                <span style={{ fontSize:11, color:C.text3, marginLeft:10 }}>{o.field_count} fields</span>
              </div>
            ))}
          </div>
          {snap.top_errors?.length>0&&<>
            <div style={{ fontSize:10, fontWeight:700, color:C.text3, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>Top Error Messages</div>
            {snap.top_errors.map((e,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, marginBottom:4, background:`${C.red}10`, border:`1px solid ${C.red}20` }}>
                <span style={{ fontSize:11, fontWeight:800, color:'white', background:C.red, borderRadius:5, padding:'1px 6px', flexShrink:0 }}>×{e.count}</span>
                <span style={{ fontSize:11, color:C.text2, fontFamily:'monospace' }}>{e.message}</span>
              </div>
            ))}
          </>}
        </div>}
      </>}

      {!result&&!loading&&!error&&(
        <div style={{ textAlign:'center', padding:compact?'20px 16px':'32px 16px', background:C.card, border:`1px dashed ${C.border}`, borderRadius:12 }}>
          <div style={{ fontSize:28, marginBottom:8 }}>✦</div>
          <div style={{ fontSize:13, fontWeight:700, color:C.text1, marginBottom:4 }}>AI Environment Health Check</div>
          <div style={{ fontSize:12, color:C.text3, maxWidth:340, margin:'0 auto' }}>Run a diagnosis to get a health summary, identified issues, and recommended actions.</div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
