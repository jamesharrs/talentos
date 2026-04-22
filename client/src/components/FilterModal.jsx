/**
 * FilterModal — reusable filter panel component
 *
 * Can render as:
 *   - A modal overlay (default)          → pass asModal={true}  (or omit, default)
 *   - An inline panel (no overlay)       → pass asModal={false}
 *
 * Props:
 *   fields        [{id, name, field_type, options?, show_in_list?}]  required
 *   filters       [{id, fieldId, op, value, rowLogic?}]              required
 *   onFiltersChange (filters) => void                                 required
 *   onApply       () => void                                          required
 *   onClose       () => void                                          required
 *   onSave        () => void | undefined     shows "Save as list" btn when provided
 *   title         string                     default "Filter records"
 *   asModal       bool                       default true
 *   // Advanced / cross-object (optional — only used in Records)
 *   linkedGroups  [{label, objectId, objectSlug, fields}]            optional
 * */

import { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";

// ── Design tokens (mirrors theme.js / Records.jsx tokens) ────────────────────
const F = "'DM Sans','Geist',-apple-system,sans-serif";
const C = {
  bg:"#f4f5f8", surface:"#ffffff", border:"#e8eaed",
  text1:"#111827", text2:"#4b5563", text3:"#9ca3af",
  accent:"#3b5bdb", accentLight:"#eef1ff",
};

// ── Operator maps ─────────────────────────────────────────────────────────────
const TYPE_OPS = {
  text:         ["contains","does not contain","is","is not","starts with","is empty","is not empty"],
  textarea:     ["contains","does not contain","is empty","is not empty"],
  number:       ["=","≠","<",">","≤","≥","is empty","is not empty"],
  currency:     ["=","≠","<",">","≤","≥","is empty","is not empty"],
  percent:      ["=","≠","<",">","≤","≥","is empty","is not empty"],
  date:         ["is","before","after","is empty","is not empty"],
  boolean:      ["is true","is false"],
  select:       ["is","is not","is empty","is not empty"],
  multi_select: ["includes","excludes","is empty","is not empty"],
  email:        ["contains","is","is empty","is not empty"],
  url:          ["contains","is empty","is not empty"],
  phone:        ["contains","is","is empty","is not empty"],
  rating:       ["=","≠","<",">","≤","≥"],
};
const NO_VAL_OPS = new Set(["is empty","is not empty","is true","is false"]);
const getOps = f => TYPE_OPS[f?.field_type] || TYPE_OPS.text;

// ── Minimal Lucide-compatible icon component ──────────────────────────────────
const PATHS = {
  filter:  "M22 3H2l8 9.46V19l4 2v-8.54L22 3",
  search:  "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  plus:    "M12 5v14M5 12h14",
  x:       "M18 6L6 18M6 6l12 12",
  chevD:   "M6 9l6 6 6-6",
};
const Ic = ({ n, s = 16, c = "currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
    stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={PATHS[n]}/>
  </svg>
);

// ── FieldSearchPicker — styled searchable dropdown ───────────────────────────
// Matches the Records.jsx version exactly, portal-rendered.
function FieldSearchPicker({ value, onChange, groups = [], flat, placeholder = "Choose field…" }) {
  const [search, setSearch] = useState("");
  const [open,   setOpen]   = useState(false);
  const [hov,    setHov]    = useState(null);
  const btnRef  = useRef(null);
  const dropRef = useRef(null);
  const inputRef = useRef(null);

  const allFields = flat
    ? flat.map(f => ({ ...f, _value: f.id }))
    : groups.flatMap(g => g.fields.map(f => ({ ...f, _group: g.label, _value: f._value || f.id })));

  const sorted   = [...allFields].sort((a, b) => a.name.localeCompare(b.name));
  const q        = search.trim().toLowerCase();
  const filtered = q ? sorted.filter(f => f.name.toLowerCase().includes(q)) : sorted;

  // Re-group for display (only when not searching)
  const displayGroups = [];
  if (groups.length && !q) {
    groups.forEach(g => {
      const gf = g.fields.filter(f => filtered.some(x => x._value === (f._value || f.id)));
      if (gf.length) displayGroups.push({ label: g.label, fields: [...gf].sort((a,b) => a.name.localeCompare(b.name)) });
    });
  }

  const selectedLabel = allFields.find(f => f._value === value)?.name || placeholder;
  const handleOpen    = () => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 30); };
  const handleSelect  = f  => { onChange(f._value, f); setOpen(false); setSearch(""); };

  useEffect(() => {
    if (!open) return;
    const h = e => {
      if (btnRef.current?.contains(e.target)) return;
      if (dropRef.current?.contains(e.target)) return;
      setOpen(false); setSearch("");
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const rowSt = f => ({
    width:"100%", display:"flex", alignItems:"center", gap:8, padding:"7px 12px",
    border:"none", background: hov === f._value ? C.accentLight : "transparent",
    cursor:"pointer", fontFamily:F, textAlign:"left",
    fontSize:13, color: value === f._value ? C.accent : C.text1,
    fontWeight: value === f._value ? 600 : 400,
  });

  const rect = () => btnRef.current?.getBoundingClientRect();

  const dropdown = open && ReactDOM.createPortal(
    <>
      <div style={{ position:"fixed", inset:0, zIndex:9880 }}
        onMouseDown={() => { setOpen(false); setSearch(""); }}/>
      <div ref={dropRef} style={{
        position:"fixed",
        top:  rect() ? rect().bottom + 4 : 0,
        left: rect() ? rect().left       : 0,
        minWidth: Math.max(220, rect()?.width || 220),
        maxWidth: 300, maxHeight:"60vh",
        background:"white", border:`1px solid ${C.border}`, borderRadius:12,
        boxShadow:"0 8px 28px rgba(0,0,0,.14)", zIndex:9881,
        display:"flex", flexDirection:"column", overflow:"hidden", fontFamily:F,
      }}>
        {/* Search input */}
        <div style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, background:C.bg,
            borderRadius:7, padding:"5px 9px", border:`1px solid ${C.border}` }}>
            <Ic n="search" s={12} c={C.text3}/>
            <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search fields…"
              style={{ border:"none", background:"transparent", outline:"none",
                fontSize:12, fontFamily:F, flex:1, color:C.text1 }}/>
            {search && (
              <button onClick={() => setSearch("")}
                style={{ background:"none", border:"none", cursor:"pointer", padding:0, color:C.text3 }}>
                ×
              </button>
            )}
          </div>
        </div>
        {/* List */}
        <div style={{ overflowY:"auto", flex:1 }}>
          {filtered.length === 0 && (
            <div style={{ padding:"16px 12px", textAlign:"center", fontSize:12, color:C.text3 }}>
              No fields match
            </div>
          )}
          {/* Grouped */}
          {!q && displayGroups.length > 0
            ? displayGroups.map(g => (
                <div key={g.label}>
                  {g.label && (
                    <div style={{ padding:"8px 12px 4px", fontSize:10, fontWeight:700,
                      color:C.text3, letterSpacing:"0.07em", textTransform:"uppercase" }}>
                      {g.label}
                    </div>
                  )}
                  {g.fields.map(f => (
                    <button key={f._value || f.id} style={rowSt(f)}
                      onMouseEnter={() => setHov(f._value)} onMouseLeave={() => setHov(null)}
                      onMouseDown={() => handleSelect(f)}>
                      {f.name}
                      {value === (f._value || f.id) && (
                        <span style={{ marginLeft:"auto", color:C.accent, fontSize:11 }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              ))
            : filtered.map(f => (
                <button key={f._value} style={rowSt(f)}
                  onMouseEnter={() => setHov(f._value)} onMouseLeave={() => setHov(null)}
                  onMouseDown={() => handleSelect(f)}>
                  {f.name}
                  {value === f._value && (
                    <span style={{ marginLeft:"auto", color:C.accent, fontSize:11 }}>✓</span>
                  )}
                </button>
              ))
          }
        </div>
      </div>
    </>,
    document.body
  );

  return (
    <>
      <button ref={btnRef} onClick={handleOpen} style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        gap:8, padding:"7px 10px", borderRadius:8,
        border:`1.5px solid ${open ? C.accent : C.border}`,
        background: open ? C.accentLight : "white",
        color: value ? C.text1 : C.text3,
        fontSize:13, fontFamily:F, cursor:"pointer", minWidth:160,
        transition:"border-color .12s, background .12s",
      }}>
        <span>{selectedLabel}</span>
        <Ic n="chevD" s={12} c={C.text3}/>
      </button>
      {dropdown}
    </>
  );
}

// ── Operator dropdown — also styled (no native chrome) ───────────────────────
function OpPicker({ value, ops, onChange }) {
  const [open, setOpen] = useState(false);
  const [hov,  setHov]  = useState(null);
  const btnRef = useRef(null);
  const dropRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = e => {
      if (btnRef.current?.contains(e.target)) return;
      if (dropRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const rect = () => btnRef.current?.getBoundingClientRect();

  return (
    <>
      <button ref={btnRef} onClick={() => setOpen(o => !o)} style={{
        display:"flex", alignItems:"center", gap:8, padding:"7px 10px",
        borderRadius:8, border:`1.5px solid ${open ? C.accent : C.border}`,
        background: open ? C.accentLight : "white", color:C.text1,
        fontSize:13, fontFamily:F, cursor:"pointer", minWidth:130,
        transition:"border-color .12s",
      }}>
        <span style={{ flex:1, textAlign:"left" }}>{value}</span>
        <Ic n="chevD" s={12} c={C.text3}/>
      </button>
      {open && ReactDOM.createPortal(
        <>
          <div style={{ position:"fixed", inset:0, zIndex:9880 }} onMouseDown={() => setOpen(false)}/>
          <div ref={dropRef} style={{
            position:"fixed",
            top:  rect() ? rect().bottom + 4 : 0,
            left: rect() ? rect().left       : 0,
            minWidth: Math.max(140, rect()?.width || 140),
            background:"white", border:`1px solid ${C.border}`, borderRadius:10,
            boxShadow:"0 8px 24px rgba(0,0,0,.12)", zIndex:9881,
            overflow:"hidden", fontFamily:F,
          }}>
            {ops.map(op => (
              <button key={op} onMouseDown={() => { onChange(op); setOpen(false); }}
                onMouseEnter={() => setHov(op)} onMouseLeave={() => setHov(null)}
                style={{
                  width:"100%", display:"block", padding:"8px 14px", border:"none",
                  background: hov === op ? C.accentLight : "transparent",
                  color: value === op ? C.accent : C.text1,
                  fontWeight: value === op ? 600 : 400,
                  fontSize:13, fontFamily:F, cursor:"pointer", textAlign:"left",
                }}>
                {op}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </>
  );
}

// ── FilterRow ─────────────────────────────────────────────────────────────────
// Must be defined at module level (not inside FilterModal) — avoids remounting on parent re-render
function FilterRowInner({ filt, idx, groups, flat, onUpdate, onRemove }) {
  // Resolve field from groups or flat list
  const allFields = flat
    ? flat
    : (groups || []).flatMap(g => g.fields.map(f => ({ ...f, _value: f._value || f.id })));

  const field = allFields.find(f => (f._value || f.id) === (filt.fieldValue || filt.fieldId));
  const ops   = getOps(field);
  const showVal = !NO_VAL_OPS.has(filt.op);
  const opts  = field?.options
    ? (Array.isArray(field.options) ? field.options : (field.options?.split?.(",") || []))
    : [];

  const inpSt = {
    padding:"7px 10px", borderRadius:8, border:`1.5px solid ${C.border}`,
    fontSize:13, fontFamily:F, background:"white", color:C.text1, outline:"none",
    minWidth:130, flex:1,
  };

  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 0",
      borderBottom:`1px solid ${C.border}44` }}>
      {/* Row logic label / toggle */}
      <div style={{ width:48, flexShrink:0, textAlign:"center" }}>
        {idx === 0
          ? <span style={{ fontSize:11, fontWeight:700, color:C.text3,
              textTransform:"uppercase", letterSpacing:"0.06em" }}>Where</span>
          : <button
              onClick={() => onUpdate(filt.id, { rowLogic: filt.rowLogic === "AND" ? "OR" : "AND" })}
              style={{ fontSize:11, fontWeight:800,
                color:      filt.rowLogic === "OR" ? "#7c3aed" : C.accent,
                background: filt.rowLogic === "OR" ? "#7c3aed18" : C.accentLight,
                border: `1.5px solid ${filt.rowLogic === "OR" ? "#7c3aed44" : C.accent+"44"}`,
                borderRadius:6, padding:"3px 8px", cursor:"pointer", fontFamily:F }}>
              {filt.rowLogic || "AND"}
            </button>
        }
      </div>

      {/* Field picker */}
      <FieldSearchPicker
        value={filt.fieldValue || filt.fieldId || ""}
        onChange={(val, fieldObj) => {
          onUpdate(filt.id, {
            fieldId:    val,
            fieldValue: val,
            op:         getOps(fieldObj)[0],
            value:      "",
          });
        }}
        groups={flat ? [] : (groups || [])}
        flat={flat}
        placeholder="Choose field…"
      />

      {/* Operator */}
      <OpPicker value={filt.op} ops={ops} onChange={op => onUpdate(filt.id, { op, value:"" })}/>

      {/* Value */}
      {showVal && field && (
        opts.length > 0
          ? <OpPicker
              value={filt.value || ""}
              ops={["", ...opts]}
              onChange={v => onUpdate(filt.id, { value: v })}
            />
          : field.field_type === "date"
            ? <input type="date" value={filt.value || ""} style={inpSt}
                onChange={e => onUpdate(filt.id, { value: e.target.value })}/>
            : (field.field_type === "number" || field.field_type === "currency" || field.field_type === "rating")
              ? <input type="number" value={filt.value || ""} placeholder="Value" style={inpSt}
                  onChange={e => onUpdate(filt.id, { value: e.target.value })}/>
              : <input value={filt.value || ""} placeholder="Value…" style={inpSt}
                  onChange={e => onUpdate(filt.id, { value: e.target.value })}
                  onFocus={e => e.target.style.borderColor = C.accent}
                  onBlur={e  => e.target.style.borderColor = C.border}/>
      )}
      {(!showVal || !field) && <div style={{ flex:1 }}/>}

      {/* Remove */}
      <button onClick={() => onRemove(filt.id)}
        style={{ flexShrink:0, background:"none", border:"none", cursor:"pointer",
          padding:"4px 6px", display:"flex", color:C.text3, borderRadius:6 }}
        onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
        onMouseLeave={e => e.currentTarget.style.color = C.text3}>
        <Ic n="x" s={14}/>
      </button>
    </div>
  );
}

// ── FilterModal — main exported component ────────────────────────────────────
export default function FilterModal({
  fields        = [],
  filters       = [],
  onFiltersChange,
  onApply,
  onClose,
  onSave,
  title         = "Filter records",
  asModal       = true,
  linkedGroups  = [],
}) {
  // Build field groups: "This record" + any linked object groups
  const ownFields = fields.filter(f => f.show_in_list !== false);
  const groups = [
    { label: linkedGroups.length ? "This record" : null, fields: ownFields },
    ...linkedGroups.map(g => ({ label: `Linked ${g.label}`, fields: g.fields,
      objectId: g.objectId, objectSlug: g.objectSlug })),
  ].filter(g => g.fields?.length);

  const addRow = () => {
    const first = ownFields[0] || fields[0];
    onFiltersChange([...filters, {
      id:         Date.now() + Math.random() + "",
      fieldId:    first?.id || "",
      fieldValue: first?.id || "",
      op:         first ? getOps(first)[0] : "contains",
      value:      "",
      rowLogic:   "AND",
    }]);
  };

  const updateRow = (id, patch) =>
    onFiltersChange(filters.map(f => f.id === id ? { ...f, ...patch } : f));
  const removeRow = id =>
    onFiltersChange(filters.filter(f => f.id !== id));

  const panel = (
    <div style={{ background:C.surface, borderRadius:16, width:720,
      maxWidth:"calc(100vw - 40px)", maxHeight:"80vh",
      display:"flex", flexDirection:"column",
      boxShadow:"0 24px 80px rgba(0,0,0,.22)", border:`1px solid ${C.border}` }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"16px 20px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:C.accentLight,
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Ic n="filter" s={16} c={C.accent}/>
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:C.text1 }}>{title}</div>
            {filters.length > 0 && (
              <div style={{ fontSize:11, color:C.text3, marginTop:1 }}>
                {filters.length} condition{filters.length !== 1 ? "s" : ""} · showing records where conditions match
              </div>
            )}
          </div>
        </div>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer",
          display:"flex", color:C.text3, padding:4, borderRadius:6 }}
          onMouseEnter={e => e.currentTarget.style.color = C.text1}
          onMouseLeave={e => e.currentTarget.style.color = C.text3}>
          <Ic n="x" s={16}/>
        </button>
      </div>

      {/* Filter rows / empty state */}
      <div style={{ flex:1, overflowY:"auto", padding:"8px 20px" }}>
        {filters.length === 0
          ? <div style={{ textAlign:"center", padding:"48px 0" }}>
              <Ic n="filter" s={36} c={C.border}/>
              <div style={{ fontSize:14, fontWeight:600, color:C.text2, marginTop:12, marginBottom:6 }}>
                No filters yet
              </div>
              <div style={{ fontSize:13, color:C.text3 }}>Add a condition below to filter records</div>
            </div>
          : filters.map((f, i) => (
              <FilterRowInner key={f.id} filt={f} idx={i}
                groups={groups.length > 0 ? groups : undefined}
                flat={groups.length === 0 ? fields : undefined}
                onUpdate={updateRow} onRemove={removeRow}/>
            ))
        }
      </div>

      {/* Footer */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"14px 20px", borderTop:`1px solid ${C.border}`, flexShrink:0, gap:8,
        background:C.bg, borderRadius:"0 0 16px 16px" }}>
        <button onClick={addRow}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px",
            borderRadius:8, border:`1.5px dashed ${C.border}`, background:"transparent",
            fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:F, color:C.text2 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor=C.accent; e.currentTarget.style.color=C.accent; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.text2; }}>
          <Ic n="plus" s={13}/> Add condition
        </button>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {filters.length > 0 && (
            <button onClick={() => onFiltersChange([])}
              style={{ padding:"8px 14px", borderRadius:8, border:`1px solid ${C.border}`,
                background:"transparent", fontSize:13, fontWeight:600,
                cursor:"pointer", fontFamily:F, color:C.text3 }}>
              Clear all
            </button>
          )}
          {filters.length > 0 && onSave && (
            <button onClick={onSave}
              style={{ padding:"8px 14px", borderRadius:8, border:`1px solid ${C.accent}`,
                background:C.accentLight, fontSize:13, fontWeight:600,
                cursor:"pointer", fontFamily:F, color:C.accent }}>
              Save as list
            </button>
          )}
          <button onClick={onApply}
            style={{ padding:"9px 22px", borderRadius:8, border:"none",
              background:C.accent, color:"white", fontSize:13, fontWeight:700,
              cursor:"pointer", fontFamily:F, opacity: filters.length === 0 ? 0.55 : 1 }}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );

  if (!asModal) return panel;

  return ReactDOM.createPortal(
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,41,.45)",
      zIndex:9500, display:"flex", alignItems:"center", justifyContent:"center",
      backdropFilter:"blur(3px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      {panel}
    </div>,
    document.body
  );
}
