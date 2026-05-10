// CSVImportModal.jsx — extracted from Records.jsx
import React, { useState, useRef, useCallback } from 'react';
import api from './apiClient.js';
import { C, F, Ic, Btn } from './RecordShared.jsx';

const CSVImportModal = ({ object, environment, onClose, onDone }) => {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('create');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!file) return;
    setLoading(true);
    const r = await importCSV(object.id, environment.id, file, mode);
    setResult(r);
    setLoading(false);
    if (r.success) onDone();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:1100, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#fff", borderRadius:16, padding:"28px 32px", width:440, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ fontSize:17, fontWeight:800, color:"#111827", marginBottom:4 }}>Import CSV</div>
        <div style={{ fontSize:12, color:"#9ca3af", marginBottom:20 }}>Import {object.plural_name} from a CSV file</div>

        {!result ? <>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, fontWeight:600, color:"#4b5563", display:"block", marginBottom:6 }}>Import Mode</label>
            <div style={{ display:"flex", gap:8 }}>
              {[{v:"create",l:"Create new records"},{v:"upsert",l:"Update existing + create new"}].map(({v,l}) => (
                <button key={v} onClick={()=>setMode(v)}
                  style={{ flex:1, padding:"8px 10px", borderRadius:8, border:`1.5px solid ${mode===v?"#3b5bdb":"#e8eaed"}`, background:mode===v?"#eef1ff":"transparent", color:mode===v?"#3b5bdb":"#4b5563", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, fontWeight:600, color:"#4b5563", display:"block", marginBottom:6 }}>Select File</label>
            <input type="file" accept=".csv" onChange={e=>setFile(e.target.files[0])}
              style={{ width:"100%", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}/>
          </div>

          <div style={{ marginBottom:20 }}>
            <button onClick={()=>downloadTemplate(object.id, object.slug)}
              style={{ fontSize:12, color:"#3b5bdb", background:"none", border:"none", cursor:"pointer", textDecoration:"underline", fontFamily:"'DM Sans',sans-serif", padding:0 }}>
              Download template CSV
            </button>
          </div>

          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button onClick={onClose} style={{ padding:"8px 16px", borderRadius:8, border:"1px solid #e8eaed", background:"white", color:"#4b5563", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
            <button onClick={handle} disabled={!file||loading}
              style={{ padding:"8px 16px", borderRadius:8, border:"none", background:"#3b5bdb", color:"white", fontSize:13, fontWeight:600, cursor:!file||loading?"not-allowed":"pointer", opacity:!file||loading?0.6:1, fontFamily:"'DM Sans',sans-serif" }}>
              {loading?"Importing…":"Import"}
            </button>
          </div>
        </> : (
          <div>
            <div style={{ background:result.success?"#f0fdf4":"#fef2f2", borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:result.success?"#166534":"#991b1b", marginBottom:8 }}>
                {result.success?"Import complete":"Import failed"}
              </div>
              <div style={{ fontSize:12, color:"#374151" }}>
                ✅ {result.created} created · ✏️ {result.updated} updated · ⏭️ {result.skipped} skipped
              </div>
              {result.errors?.length > 0 && (
                <div style={{ marginTop:8, fontSize:11, color:"#991b1b" }}>
                  {result.errors.slice(0,3).map((e,i) => <div key={i}>{e}</div>)}
                </div>
              )}
            </div>
            <button onClick={onClose} style={{ width:"100%", padding:"9px", borderRadius:8, border:"none", background:"#3b5bdb", color:"white", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
};

// Builds a plain-text list summary for the copilot
function buildListContext(object, records, total, fields) {
  if (!object || !records) return null;
  const lines = [];
  lines.push("OBJECT: " + (object.plural_name || object.name) + " (slug: " + (object.slug||"") + ")");
  lines.push("TOTAL_VISIBLE: " + records.length + (records.length < total ? " (of " + total + " total — use APPLY_FILTER to narrow further)" : " records"));

  // Field map: api_key → field_type — send ALL fields, not just first 25
  const fieldMap = {};
  if (fields && fields.length) {
    fields.forEach(f => { fieldMap[f.api_key] = f.field_type; });
    lines.push("FIELDS: " + fields.map(f => f.api_key + " (" + f.field_type + ")").join(", "));
  }

  // Auto-generate breakdowns for groupable fields
  const breakdownFields = fields
    ? fields.filter(f => ['select','multi_select','status','boolean','rating','text','textarea'].includes(f.field_type))
    : [];

  // Numeric fields — output min/max/avg so copilot can answer range questions
  const numericFields = fields
    ? fields.filter(f => ['number','currency','rating'].includes(f.field_type))
    : [];

  // Always include these common fields even without schema
  const alwaysCheck = ['status','department','current_title','job_title','location','work_type',
    'employment_type','person_type','source','nationality','category','type'];

  const checkedKeys = new Set([
    ...breakdownFields.map(f => f.api_key),
    ...alwaysCheck
  ]);

  for (const key of checkedKeys) {
    const counts = {};
    records.forEach(r => {
      const v = r.data?.[key];
      if (v === null || v === undefined || v === '') return;
      const vals = Array.isArray(v) ? v : [String(v)];
      vals.forEach(val => { counts[val] = (counts[val] || 0) + 1; });
    });
    const entries = Object.entries(counts).sort((a,b) => b[1]-a[1]);
    // Only include if there are values and ≤30 distinct values (avoid free-text explosion)
    if (entries.length > 0 && entries.length <= 30) {
      lines.push(key + ": " + entries.map(([k,v]) => k + "=" + v).join(", "));
    }
  }

  // Numeric field stats — min/max/avg/count so copilot can answer "less than X" questions
  for (const f of numericFields) {
    const vals = records.map(r => {
      const v = r.data?.[f.api_key];
      return v !== null && v !== undefined && v !== '' ? Number(v) : NaN;
    }).filter(v => !isNaN(v));
    if (vals.length === 0) continue;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const avg = Math.round(vals.reduce((s,v)=>s+v,0) / vals.length);
    // Also count how many are below common thresholds for context
    const below20 = vals.filter(v => v < 20).length;
    const below50 = vals.filter(v => v < 50).length;
    lines.push(`${f.api_key}_stats: min=${min}, max=${max}, avg=${avg}, count=${vals.length}, below_20=${below20}, below_50=${below50}`);
  }

  // Sample record names for context
  const getName = r => {
    const d = r.data || {};
    return (d.first_name ? (d.first_name + " " + (d.last_name || "")).trim() : null)
      || d.job_title || d.pool_name || d.name || "";
  };
  const names = records.slice(0, 10).map(getName).filter(Boolean);
  if (names.length)
    lines.push("sample_names: " + names.join(", ") +
      (records.length > 10 ? " ... +" + (records.length - 10) + " more" : ""));

  return lines.join("\n");
}


export default CSVImportModal;
