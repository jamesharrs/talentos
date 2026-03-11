import { useState, useEffect, useCallback } from "react";

const F = "'DM Sans', -apple-system, sans-serif";
const C = {
  bg: "#f5f6fa", surface: "#ffffff", border: "#e5e7eb",
  text1: "#111827", text2: "#374151", text3: "#9ca3af",
  accent: "#3b5bdb", accentLight: "#eef2ff",
  ai: "#7c3aed", aiLight: "#f5f3ff",
  green: "#0ca678", greenLight: "#ecfdf5",
  orange: "#f59f00", orangeLight: "#fffbeb",
  red: "#e03131", redLight: "#fef2f2",
};

const api = {
  get:    (p)    => fetch(`/api${p}`).then(r=>r.json()),
  post:   (p, b) => fetch(`/api${p}`, {method:"POST",   headers:{"Content-Type":"application/json"}, body:JSON.stringify(b)}).then(r=>r.json()),
  patch:  (p, b) => fetch(`/api${p}`, {method:"PATCH",  headers:{"Content-Type":"application/json"}, body:JSON.stringify(b)}).then(r=>r.json()),
  put:    (p, b) => fetch(`/api${p}`, {method:"PUT",    headers:{"Content-Type":"application/json"}, body:JSON.stringify(b)}).then(r=>r.json()),
  delete: (p)    => fetch(`/api${p}`, {method:"DELETE"}).then(r=>r.json()),
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const PATHS = {
  plus:       "M12 5v14M5 12h14",
  x:          "M18 6L6 18M6 6l12 12",
  edit:       "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  trash:      "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  play:       "M5 3l14 9-14 9V3z",
  check:      "M20 6L9 17l-5-5",
  zap:        "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  mail:       "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  webhook:    "M18 16.016l3-5.196M9 4.516L12 6l3-1.5M6 16.016l-3-5.196M12 21v-6M9.268 4.516L3 15m6-3h6m3-8.5l-6 10.5",
  cpu:        "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
  layers:     "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  tag:        "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
  loader:     "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
  chevRight:  "M9 18l6-6-6-6",
  copy:       "M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2M8 4a2 2 0 012-2h4a2 2 0 012 2M8 4h8",
  eye:        "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  workflow:   "M22 12h-4l-3 9L9 3l-3 9H2",
  user:       "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  briefcase:  "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2",
  settings:   "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
};
const Ic = ({ n, s=16, c="currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={PATHS[n]||PATHS.settings}/>
  </svg>
);

// ─── Step type definitions ────────────────────────────────────────────────────
const AUTOMATION_TYPES = [
  { type:"ai_prompt",    label:"AI Prompt",       icon:"cpu",     color:"#7c3aed", desc:"Run an AI prompt against this record" },
  { type:"stage_change", label:"Change Stage",    icon:"tag",     color:"#3b5bdb", desc:"Update the record's status/stage field" },
  { type:"update_field", label:"Update Field",    icon:"edit",    color:"#0ca678", desc:"Set a field to a specific value" },
  { type:"send_email",   label:"Send Email",      icon:"mail",    color:"#f59f00", desc:"Send an email to the candidate" },
  { type:"webhook",      label:"Webhook",         icon:"webhook", color:"#e03131", desc:"POST record data to an external URL" },
];

// Keep STEP_TYPES as alias for display in run results etc.
const STEP_TYPES = AUTOMATION_TYPES;

const automationDef = (type) => AUTOMATION_TYPES.find(s => s.type === type);
const stepDef = (type) => automationDef(type) || { type:"placeholder", label:"Stage", icon:"chevRight", color:"#9ca3af", desc:"Process stage" };

// ─── Step Card ────────────────────────────────────────────────────────────────
const StepCard = ({ step, index, total, onChange, onDelete, onMoveUp, onMoveDown, fields }) => {
  const [showAutomationPicker, setShowAutomationPicker] = useState(false);
  const cfg = step.config || {};
  const auto = automationDef(step.automation_type); // may be undefined = placeholder

  const setConfig   = (key, val) => onChange({ ...step, config: { ...cfg, [key]: val } });
  const setName     = (name)     => onChange({ ...step, name });
  const setAuto     = (type)     => { onChange({ ...step, automation_type: type, config: {} }); setShowAutomationPicker(false); };
  const removeAuto  = ()         => onChange({ ...step, automation_type: null, config: {} });

  return (
    <div style={{ background: C.surface, border: `1.5px solid ${auto ? auto.color+"40" : C.border}`, borderRadius: 12, overflow: "hidden" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: auto ? `${auto.color}06` : "#fafbff" }}>
        {/* Stage icon */}
        <div style={{ width: 28, height: 28, borderRadius: 8, background: auto ? auto.color : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Ic n={auto ? auto.icon : "chevRight"} s={13} c="white"/>
        </div>

        {/* Editable name */}
        <input
          value={step.name || ""}
          onChange={e => setName(e.target.value)}
          placeholder="Stage name…"
          onClick={e => e.stopPropagation()}
          style={{ flex: 1, border: "none", outline: "none", fontSize: 13, fontWeight: 700, color: C.text1, background: "transparent", fontFamily: F, minWidth: 0 }}
        />

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: C.text3, background: "#f3f4f6", borderRadius: 99, padding: "2px 8px", fontWeight: 600 }}>Step {index + 1}</span>
          <button onClick={e=>{e.stopPropagation();onMoveUp();}} disabled={index===0}
            style={{ background:"none",border:"none",cursor:index===0?"default":"pointer",opacity:index===0?.3:1,padding:4,display:"flex",transform:"rotate(-90deg)" }}>
            <Ic n="chevRight" s={12} c={C.text3}/>
          </button>
          <button onClick={e=>{e.stopPropagation();onMoveDown();}} disabled={index===total-1}
            style={{ background:"none",border:"none",cursor:index===total-1?"default":"pointer",opacity:index===total-1?.3:1,padding:4,display:"flex",transform:"rotate(90deg)" }}>
            <Ic n="chevRight" s={12} c={C.text3}/>
          </button>
          <button onClick={e=>{e.stopPropagation();onDelete();}} style={{ background:"none",border:"none",cursor:"pointer",padding:4,display:"flex" }}>
            <Ic n="trash" s={13} c={C.red}/>
          </button>
        </div>
      </div>

      {/* Automation section */}
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${auto ? auto.color+"20" : C.border}`, background: auto ? `${auto.color}04` : "transparent" }}>
        {!auto ? (
          /* No automation — show picker trigger */
          showAutomationPicker ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".5px" }}>Choose automation</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {AUTOMATION_TYPES.map(t => (
                  <button key={t.type} onClick={() => setAuto(t.type)}
                    style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 11px", borderRadius:8, border:`1.5px solid ${t.color}40`, background:`${t.color}08`, color:t.color, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:F }}
                    onMouseEnter={e=>{e.currentTarget.style.background=`${t.color}18`;}}
                    onMouseLeave={e=>{e.currentTarget.style.background=`${t.color}08`;}}>
                    <Ic n={t.icon} s={12}/>{t.label}
                  </button>
                ))}
                <button onClick={() => setShowAutomationPicker(false)}
                  style={{ padding:"6px 11px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.text3, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:F }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAutomationPicker(true)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 10px", borderRadius:7, border:`1.5px dashed ${C.border}`, background:"transparent", color:C.text3, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:F }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text3;}}>
              <Ic n="zap" s={11}/> + Add automation
            </button>
          )
        ) : (
          /* Automation configured — show its config */
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, fontWeight:700, color:auto.color, background:`${auto.color}12`, padding:"3px 9px", borderRadius:99 }}>
                <Ic n={auto.icon} s={10}/> {auto.label}
              </span>
              <button onClick={removeAuto}
                style={{ marginLeft:"auto", fontSize:11, color:C.text3, background:"none", border:"none", cursor:"pointer", fontFamily:F, display:"flex", alignItems:"center", gap:3 }}>
                <Ic n="x" s={10}/> Remove
              </button>
            </div>

            {/* Config fields per automation type */}
            {step.automation_type === "stage_change" && (
              <input value={cfg.to_stage||""} onChange={e=>setConfig("to_stage", e.target.value)} placeholder="New stage value e.g. Interview, Offer, Rejected"
                style={{ width:"100%", boxSizing:"border-box", padding:"8px 10px", border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, fontFamily:F, outline:"none", color:C.text1 }}/>
            )}

            {step.automation_type === "update_field" && (
              <div style={{ display:"flex", gap:10 }}>
                <select value={cfg.field||""} onChange={e=>setConfig("field", e.target.value)}
                  style={{ flex:1, padding:"8px 10px", border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, fontFamily:F, outline:"none", background:"white", color:C.text1 }}>
                  <option value="">Select field…</option>
                  {fields.map(f => <option key={f.api_key} value={f.api_key}>{f.name}</option>)}
                </select>
                <input value={cfg.value||""} onChange={e=>setConfig("value", e.target.value)} placeholder="New value"
                  style={{ flex:1, boxSizing:"border-box", padding:"8px 10px", border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, fontFamily:F, outline:"none", color:C.text1 }}/>
              </div>
            )}

            {step.automation_type === "ai_prompt" && (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <textarea value={cfg.prompt||""} onChange={e=>setConfig("prompt", e.target.value)} rows={3}
                  placeholder={`Prompt — use {{first_name}}, {{skills}} etc. to inject record data`}
                  style={{ width:"100%", boxSizing:"border-box", padding:"10px 12px", border:`1px solid ${C.border}`, borderRadius:8, fontSize:12, fontFamily:F, outline:"none", resize:"vertical", color:C.text1, lineHeight:1.5 }}/>
                <select value={cfg.output_field||""} onChange={e=>setConfig("output_field", e.target.value)}
                  style={{ padding:"8px 10px", border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, fontFamily:F, outline:"none", background:"white", color:C.text1 }}>
                  <option value="">Don't save output to a field</option>
                  {fields.map(f => <option key={f.api_key} value={f.api_key}>Save to: {f.name}</option>)}
                </select>
              </div>
            )}

            {step.automation_type === "send_email" && (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <input value={cfg.subject||""} onChange={e=>setConfig("subject", e.target.value)} placeholder="Subject — e.g. Update for {{first_name}}"
                  style={{ width:"100%", boxSizing:"border-box", padding:"8px 10px", border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, fontFamily:F, outline:"none", color:C.text1 }}/>
                <textarea value={cfg.body||""} onChange={e=>setConfig("body", e.target.value)} rows={3}
                  placeholder="Hi {{first_name}}, we wanted to update you…"
                  style={{ width:"100%", boxSizing:"border-box", padding:"10px 12px", border:`1px solid ${C.border}`, borderRadius:8, fontSize:12, fontFamily:F, outline:"none", resize:"vertical", color:C.text1, lineHeight:1.5 }}/>
              </div>
            )}

            {step.automation_type === "webhook" && (
              <input value={cfg.url||""} onChange={e=>setConfig("url", e.target.value)} placeholder="https://hooks.example.com/talentos"
                style={{ width:"100%", boxSizing:"border-box", padding:"8px 10px", border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, fontFamily:F, outline:"none", color:C.text1 }}/>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Workflow Editor ──────────────────────────────────────────────────────────
const WorkflowEditor = ({ workflow, objects: parentObjects, environment, onSave, onClose }) => {
  const [name, setName]       = useState(workflow?.name || "");
  const [objectId, setObjectId] = useState(workflow?.object_id || "");
  const [desc, setDesc]       = useState(workflow?.description || "");
  const [wfType, setWfType]   = useState(workflow?.workflow_type || "automation");
  const [steps, setSteps]     = useState(workflow?.steps || []);
  const [saving, setSaving]   = useState(false);
  const [fields, setFields]   = useState([]);
  const [objects, setObjects] = useState(parentObjects || []);

  useEffect(() => {
    if (parentObjects?.length > 0) setObjects(parentObjects);
  }, [parentObjects]);
  useEffect(() => {
    if (objects.length === 0 && environment?.id) {
      api.get(`/objects?environment_id=${environment.id}`)
        .then(objs => setObjects(Array.isArray(objs) ? objs : []));
    }
  }, [environment?.id]);

  useEffect(() => {
    if (!objectId) return;
    api.get(`/fields?object_id=${objectId}`).then(fs => setFields(Array.isArray(fs) ? fs : []));
  }, [objectId]);

  const addStep = () => {
    setSteps(s => [...s, { id: `new_${Date.now()}`, name: "", automation_type: null, config: {} }]);
  };

  const updateStep = (i, updated) => setSteps(s => s.map((st, idx) => idx === i ? updated : st));
  const deleteStep = (i) => setSteps(s => s.filter((_, idx) => idx !== i));
  const moveStep = (i, dir) => {
    setSteps(s => {
      const arr = [...s];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return arr;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
  };

  const save = async () => {
    if (!name.trim() || !objectId) return;
    setSaving(true);
    try {
      let wf;
      if (workflow?.id) {
        wf = await api.patch(`/workflows/${workflow.id}`, { name, object_id: objectId, description: desc, workflow_type: wfType });
      } else {
        wf = await api.post("/workflows", { name, object_id: objectId, description: desc, environment_id: environment.id, workflow_type: wfType });
      }
      if (!wf?.id) throw new Error("Server did not return a workflow ID");
      await api.put(`/workflows/${wf.id}/steps`, { steps });
      onSave({ ...wf, steps });
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 1000, display: "flex", alignItems: "stretch", justifyContent: "flex-end" }}>
      <div style={{ width: 680, background: C.bg, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "-8px 0 40px rgba(0,0,0,.2)", animation: "slideIn .2s ease" }}>
        <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 24px", background: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${C.accent},${C.ai})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ic n="workflow" s={18} c="white"/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text1 }}>{workflow?.id ? "Edit Workflow" : "New Workflow"}</div>
            <div style={{ fontSize: 12, color: C.text3 }}>{steps.length} step{steps.length !== 1 ? "s" : ""}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex", borderRadius: 8 }}><Ic n="x" s={18} c={C.text3}/></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Workflow meta */}
          <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text2, marginBottom: -4 }}>Workflow Settings</div>
            <div style={{ display: "flex", gap: 14 }}>
              <label style={{ flex: 2 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.text2, marginBottom: 6 }}>Name *</div>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Application Review"
                  style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 14, fontFamily: F, outline: "none", color: C.text1, fontWeight: 600 }}/>
              </label>
              <label style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.text2, marginBottom: 6 }}>Linked Object *</div>
                <select value={objectId} onChange={e=>setObjectId(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 13, fontFamily: F, outline: "none", background: "white", color: C.text1 }}>
                  <option value="">Select…</option>
                  {objects.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </label>
            </div>
            <label>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.text2, marginBottom: 6 }}>Description</div>
              <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="What does this workflow do?"
                style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 13, fontFamily: F, outline: "none", color: C.text1 }}/>
            </label>
            {/* Workflow type */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.text2, marginBottom: 8 }}>Workflow Type</div>
              <div style={{ display:"flex", gap:8 }}>
                {[
                  { value:"automation",  label:"⚡ Automation",    desc:"Run automated steps on records" },
                  { value:"pipeline",    label:"📋 Record Pipeline", desc:"Drive a record's status/stage" },
                  { value:"people_link", label:"🔗 People Pipeline", desc:"Link people to records with stages" },
                ].map(t => (
                  <button key={t.value} onClick={()=>setWfType(t.value)}
                    style={{ flex:1, padding:"10px 12px", borderRadius:10, border:`2px solid ${wfType===t.value?C.accent:C.border}`,
                      background: wfType===t.value ? C.accentLight : "white",
                      cursor:"pointer", fontFamily:F, textAlign:"left" }}>
                    <div style={{ fontSize:12, fontWeight:700, color:wfType===t.value?C.accent:C.text1, marginBottom:3 }}>{t.label}</div>
                    <div style={{ fontSize:11, color:C.text3, lineHeight:1.4 }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Steps */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text2, marginBottom: 12 }}>Steps</div>
            {steps.length === 0 && (
              <div style={{ background: C.surface, border: `2px dashed ${C.border}`, borderRadius: 12, padding: "32px", textAlign: "center", color: C.text3 }}>
                <Ic n="workflow" s={28} c={C.border}/>
                <div style={{ fontSize: 13, marginTop: 10, fontWeight: 600 }}>No steps yet</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Add steps below to build your workflow</div>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {steps.map((step, i) => (
                <div key={step.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  {/* Connector line */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 14, flexShrink: 0 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: stepDef(step.type).color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "white" }}>{i + 1}</div>
                    {i < steps.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 20, background: `${stepDef(step.type).color}30`, marginTop: 4 }}/>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <StepCard step={step} index={i} total={steps.length} fields={fields}
                      onChange={updated => updateStep(i, updated)}
                      onDelete={() => deleteStep(i)}
                      onMoveUp={() => moveStep(i, -1)}
                      onMoveDown={() => moveStep(i, 1)}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add step button */}
          <button onClick={addStep}
            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", padding:"12px", borderRadius:12, border:`2px dashed ${C.border}`, background:"transparent", color:C.text3, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:F, transition:"all .15s" }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent;e.currentTarget.style.background=C.accentLight;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text3;e.currentTarget.style.background="transparent";}}>
            <Ic n="plus" s={15}/> Add Stage
          </button>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", gap: 10, justifyContent: "flex-end", flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 9, border: `1px solid ${C.border}`, background: "transparent", color: C.text2, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F }}>Cancel</button>
          <button onClick={save} disabled={saving || !name.trim() || !objectId || !environment?.id}
            style={{ padding: "9px 24px", borderRadius: 9, border: "none", background: (!name.trim() || !objectId || !environment?.id) ? C.border : `linear-gradient(135deg,${C.accent},${C.ai})`, color: "white", fontSize: 13, fontWeight: 700, cursor: (!name.trim() || !objectId || !environment?.id) ? "not-allowed" : "pointer", fontFamily: F, display: "flex", alignItems: "center", gap: 8 }}>
            {saving ? <><Ic n="loader" s={14}/> Saving…</> : <><Ic n="check" s={14}/> Save Workflow</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Run Panel ────────────────────────────────────────────────────────────────
const RunPanel = ({ workflow, environment, objects, onClose }) => {
  const [records, setRecords]     = useState([]);
  const [selected, setSelected]   = useState([]);
  const [running, setRunning]     = useState(false);
  const [results, setResults]     = useState(null);
  const [search, setSearch]       = useState("");

  useEffect(() => {
    if (!workflow?.object_id || !environment?.id) return;
    api.get(`/records?object_id=${workflow.object_id}&environment_id=${environment.id}&limit=200`)
      .then(d => setRecords(d.records || []));
  }, [workflow, environment]);

  const obj = objects.find(o => o.id === workflow.object_id);
  const getLabel = (r) => {
    const d = r.data || {};
    return [d.first_name, d.last_name].filter(Boolean).join(" ") || d.job_title || d.pool_name || d.name || r.id.slice(0, 8);
  };

  const filtered = records.filter(r => {
    const d = r.data || {};
    const label = getLabel(r).toLowerCase();
    return !search || label.includes(search.toLowerCase());
  });

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const selectAll    = () => setSelected(filtered.map(r => r.id));
  const clearAll     = () => setSelected([]);

  const run = async () => {
    if (!selected.length) return;
    setRunning(true);
    setResults(null);
    const allResults = [];
    for (const recordId of selected) {
      const res = await api.post(`/workflows/${workflow.id}/run`, { record_id: recordId });
      allResults.push({ record: records.find(r => r.id === recordId), result: res });
    }
    setResults(allResults);
    setRunning(false);
  };

  const statusColor = (s) => s === "done" ? C.green : s === "error" ? C.red : C.orange;
  const statusBg    = (s) => s === "done" ? C.greenLight : s === "error" ? C.redLight : C.orangeLight;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 700, maxHeight: "88vh", background: C.surface, borderRadius: 20, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,.2)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 24px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${C.accent},${C.ai})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ic n="play" s={16} c="white"/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text1 }}>Run: {workflow.name}</div>
            <div style={{ fontSize: 12, color: C.text3 }}>{workflow.steps?.length} step{workflow.steps?.length !== 1 ? "s" : ""} · {obj?.name} records</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 6 }}><Ic n="x" s={18} c={C.text3}/></button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {!results ? (
            <>
              {/* Record selector */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search ${obj?.plural_name || "records"}…`}
                    style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px 8px 32px", border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 13, fontFamily: F, outline: "none", color: C.text1 }}/>
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.text3 }}><Ic n="eye" s={14}/></span>
                </div>
                <button onClick={selectAll} style={{ fontSize: 12, fontWeight: 600, color: C.accent, background: "none", border: "none", cursor: "pointer", fontFamily: F }}>Select all</button>
                <button onClick={clearAll}  style={{ fontSize: 12, fontWeight: 600, color: C.text3, background: "none", border: "none", cursor: "pointer", fontFamily: F }}>Clear</button>
              </div>
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", maxHeight: 340, overflowY: "auto" }}>
                {filtered.length === 0 && <div style={{ padding: "24px", textAlign: "center", color: C.text3, fontSize: 13 }}>No records found</div>}
                {filtered.map((r, i) => {
                  const label = getLabel(r);
                  const checked = selected.includes(r.id);
                  return (
                    <div key={r.id} onClick={() => toggleSelect(r.id)}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", cursor: "pointer", borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none", background: checked ? C.accentLight : "white", transition: "background .1s" }}>
                      <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${checked ? C.accent : C.border}`, background: checked ? C.accent : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {checked && <Ic n="check" s={11} c="white"/>}
                      </div>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: obj?.color || C.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>{label.charAt(0).toUpperCase()}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: checked ? 700 : 500, color: C.text1 }}>{label}</div>
                        {r.data?.status && <div style={{ fontSize: 11, color: C.text3 }}>{r.data.status}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: C.text3 }}>{selected.length} record{selected.length !== 1 ? "s" : ""} selected</span>
                <button onClick={run} disabled={!selected.length || running}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 24px", borderRadius: 9, border: "none", background: selected.length ? `linear-gradient(135deg,${C.accent},${C.ai})` : C.border, color: "white", fontSize: 13, fontWeight: 700, cursor: selected.length ? "pointer" : "not-allowed", fontFamily: F }}>
                  {running ? <><Ic n="loader" s={14}/> Running…</> : <><Ic n="play" s={14}/> Run on {selected.length} record{selected.length !== 1 ? "s" : ""}</>}
                </button>
              </div>
            </>
          ) : (
            /* Results */
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.text1 }}>Run Complete</div>
                <div style={{ fontSize: 12, color: C.green, background: C.greenLight, padding: "3px 10px", borderRadius: 99, fontWeight: 600 }}>
                  {results.filter(r => r.result.steps?.every(s => s.status === "done")).length}/{results.length} succeeded
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {results.map((r, i) => (
                  <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#f9fafb", borderBottom: `1px solid ${C.border}` }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: obj?.color || C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: "white", fontSize: 11, fontWeight: 700 }}>{getLabel(r.record).charAt(0).toUpperCase()}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.text1 }}>{getLabel(r.record)}</span>
                    </div>
                    <div style={{ padding: "10px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                      {r.result.steps?.map((step, j) => (
                        <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 10px", borderRadius: 8, background: statusBg(step.status) }}>
                          <Ic n={step.status === "done" ? "check" : "x"} s={13} c={statusColor(step.status)}/>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: C.text1 }}>{stepDef(step.type).label}</div>
                            {step.output && <div style={{ fontSize: 11, color: C.text2, marginTop: 2, whiteSpace: "pre-wrap" }}>{step.output}</div>}
                            {step.error  && <div style={{ fontSize: 11, color: C.red,   marginTop: 2 }}>Error: {step.error}</div>}
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, color: statusColor(step.status), textTransform: "uppercase" }}>{step.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Workflows Page ──────────────────────────────────────────────────────
export default function WorkflowsPage({ environment }) {
  const [workflows, setWorkflows]   = useState([]);
  const [objects, setObjects]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [editing, setEditing]       = useState(null);  // null | workflow | {}
  const [running, setRunning]       = useState(null);  // workflow to run
  const [filterObj, setFilterObj]   = useState("");

  const load = useCallback(async () => {
    if (!environment?.id) return;
    const [wfs, objs] = await Promise.all([
      api.get(`/workflows?environment_id=${environment.id}`),
      api.get(`/objects?environment_id=${environment.id}`),
    ]);
    setWorkflows(Array.isArray(wfs) ? wfs : []);
    setObjects(Array.isArray(objs) ? objs : []);
    setLoading(false);
  }, [environment?.id]);

  useEffect(() => { load(); }, [load]);

  const deleteWorkflow = async (id) => {
    if (!confirm("Delete this workflow?")) return;
    await api.delete(`/workflows/${id}`);
    setWorkflows(w => w.filter(x => x.id !== id));
  };

  const toggleActive = async (wf) => {
    const updated = await api.patch(`/workflows/${wf.id}`, { active: !wf.active });
    setWorkflows(ws => ws.map(w => w.id === wf.id ? { ...w, active: !w.active } : w));
  };

  const objName = (id) => objects.find(o => o.id === id)?.name || "—";
  const objColor= (id) => objects.find(o => o.id === id)?.color || C.accent;

  const filtered = filterObj ? workflows.filter(w => w.object_id === filterObj) : workflows;

  return (
    <div style={{ fontFamily: F, height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 800, color: C.text1 }}>Workflows</h1>
          <p style={{ margin: 0, fontSize: 13, color: C.text3 }}>Automate actions and AI prompts on your records</p>
        </div>
        {/* Filter by object */}
        <select value={filterObj} onChange={e=>setFilterObj(e.target.value)}
          style={{ padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 13, fontFamily: F, outline: "none", background: "white", color: C.text1 }}>
          <option value="">All objects</option>
          {objects.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <button onClick={() => setEditing({})}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9, border: "none", background: `linear-gradient(135deg,${C.accent},${C.ai})`, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F, boxShadow: "0 2px 12px rgba(99,102,241,.3)" }}>
          <Ic n="plus" s={15} c="white"/> New Workflow
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.text3, fontSize: 14 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: C.text3 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Ic n="workflow" s={30} c={C.accent}/>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text2, marginBottom: 6 }}>No workflows yet</div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>Create your first workflow to automate actions on records</div>
          <button onClick={() => setEditing({})}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 9, border: "none", background: `linear-gradient(135deg,${C.accent},${C.ai})`, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F }}>
            <Ic n="plus" s={14} c="white"/> Create Workflow
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(wf => {
            const color = objColor(wf.object_id);
            return (
              <div key={wf.id} style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                {/* Object badge */}
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}15`, border: `1.5px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Ic n="workflow" s={20} c={color}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.text1 }}>{wf.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color, background: `${color}15`, padding: "2px 8px", borderRadius: 99 }}>{objName(wf.object_id)}</span>
                    {wf.workflow_type === "pipeline"    && <span style={{ fontSize:11, color:"#0ca678", background:"#ecfdf5", padding:"2px 8px", borderRadius:99, fontWeight:600 }}>📋 Pipeline</span>}
                    {wf.workflow_type === "people_link" && <span style={{ fontSize:11, color:"#7c3aed", background:"#f5f3ff", padding:"2px 8px", borderRadius:99, fontWeight:600 }}>🔗 People</span>}
                    {!wf.active && <span style={{ fontSize: 11, color: C.text3, background: "#f3f4f6", padding: "2px 8px", borderRadius: 99 }}>Inactive</span>}
                  </div>
                  {wf.description && <div style={{ fontSize: 12, color: C.text3, marginBottom: 6 }}>{wf.description}</div>}
                  {/* Step pills */}
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {(wf.steps || []).map((s, i) => {
                      const auto = automationDef(s.automation_type);
                      return (
                        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: auto ? auto.color : C.text3, background: auto ? `${auto.color}12` : "#f3f4f6", padding: "2px 8px", borderRadius: 99 }}>
                          <Ic n={auto ? auto.icon : "chevRight"} s={9}/>{s.name || auto?.label || `Step ${i+1}`}
                        </span>
                      );
                    })}
                    {(wf.steps || []).length === 0 && <span style={{ fontSize: 11, color: C.text3 }}>No steps configured</span>}
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {/* Active toggle */}
                  <div onClick={() => toggleActive(wf)} style={{ width: 38, height: 22, borderRadius: 99, background: wf.active ? C.green : "#e5e7eb", cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: wf.active ? 19 : 3, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }}/>
                  </div>
                  <button onClick={() => setRunning(wf)}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, border: `1.5px solid ${C.accent}30`, background: C.accentLight, color: C.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
                    <Ic n="play" s={12}/> Run
                  </button>
                  <button onClick={() => setEditing(wf)}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.text2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
                    <Ic n="edit" s={12}/> Edit
                  </button>
                  <button onClick={() => deleteWorkflow(wf.id)}
                    style={{ display: "flex", alignItems: "center", padding: "7px 8px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.red, cursor: "pointer" }}>
                    <Ic n="trash" s={13}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor panel */}
      {editing !== null && (
        <WorkflowEditor workflow={editing?.id ? editing : null} objects={objects} environment={environment}
          onClose={() => setEditing(null)}
          onSave={(wf) => {
            setWorkflows(ws => ws.find(w => w.id === wf.id) ? ws.map(w => w.id === wf.id ? wf : w) : [...ws, wf]);
            setEditing(null);
          }}/>
      )}

      {/* Run panel */}
      {running && (
        <RunPanel workflow={running} environment={environment} objects={objects} onClose={() => setRunning(null)}/>
      )}
    </div>
  );
}


// ─── RecordPipelinePanel ──────────────────────────────────────────────────────
// Shown inside a record's Workflows panel. Lets user:
//  1. Pick a "pipeline" workflow → drives record status
//  2. Pick a "people_link" workflow → link People with stages
//  3. Manage linked people + move them between stages
export function RecordPipelinePanel({ record, objectId, environment, objectName }) {
  const [assignments, setAssignments]   = useState([]);       // [{type, workflow:{steps}}]
  const [allWorkflows, setAllWorkflows] = useState([]);
  const [peopleLinks, setPeopleLinks]   = useState([]);
  const [personRecords, setPersonRecords] = useState([]);     // all Person records for picker
  const [loading, setLoading]           = useState(true);
  const [addingPerson, setAddingPerson] = useState(false);
  const [personSearch, setPersonSearch] = useState("");
  const [saving, setSaving]             = useState(false);

  const pipelineWf   = assignments.find(a => a.type === "pipeline")?.workflow;
  const peopleLinkWf = assignments.find(a => a.type === "people_link")?.workflow;

  const load = async () => {
    if (!record?.id || !environment?.id) return;
    setLoading(true);
    const [asgn, wfs, links] = await Promise.all([
      api.get(`/workflows/assignments?record_id=${record.id}`),
      api.get(`/workflows?environment_id=${environment.id}`),
      api.get(`/workflows/people-links?target_record_id=${record.id}`),
    ]);
    setAssignments(Array.isArray(asgn) ? asgn : []);
    setAllWorkflows(Array.isArray(wfs)  ? wfs  : []);
    setPeopleLinks(Array.isArray(links) ? links : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [record?.id, environment?.id]);

  const assignWorkflow = async (type, workflow_id) => {
    setSaving(true);
    await api.put("/workflows/assignments", { record_id: record.id, workflow_id: workflow_id||null, type });
    await load();
    setSaving(false);
  };

  const loadPersonRecords = async () => {
    // Find Person object
    const objs = await api.get(`/objects?environment_id=${environment.id}`);
    const personObj = (Array.isArray(objs)?objs:[]).find(o => o.name === "Person" || o.slug === "people");
    if (!personObj) return;
    const recs = await api.get(`/records?object_id=${personObj.id}&environment_id=${environment.id}&limit=500`);
    setPersonRecords(recs.records || []);
  };

  const openAddPerson = async () => {
    await loadPersonRecords();
    setPersonSearch("");
    setAddingPerson(true);
  };

  const linkPerson = async (personRecordId) => {
    const firstStep = peopleLinkWf?.steps?.[0];
    await api.post("/workflows/people-links", {
      person_record_id: personRecordId,
      target_record_id: record.id,
      target_object_id: objectId,
      stage_id:   firstStep?.id   || null,
      stage_name: firstStep?.name || "New",
      environment_id: environment.id,
    });
    setAddingPerson(false);
    await load();
  };

  const moveStage = async (linkId, step) => {
    await api.patch(`/workflows/people-links/${linkId}`, { stage_id: step.id, stage_name: step.name });
    setPeopleLinks(ls => ls.map(l => l.id === linkId ? { ...l, stage_id: step.id, stage_name: step.name } : l));
  };

  const removeLink = async (linkId) => {
    await api.delete(`/workflows/people-links/${linkId}`);
    setPeopleLinks(ls => ls.filter(l => l.id !== linkId));
  };

  const personLabel = (p) => {
    const d = p.person_data || {};
    return [d.first_name, d.last_name].filter(Boolean).join(" ") || d.email || p.person_record_id?.slice(0,8);
  };

  const personInitial = (p) => personLabel(p).charAt(0).toUpperCase();

  // Filtered person list (exclude already linked)
  const linkedIds = new Set(peopleLinks.map(l => l.person_record_id));
  const filteredPersons = personRecords.filter(r => {
    if (linkedIds.has(r.id)) return false;
    if (!personSearch) return true;
    const d = r.data || {};
    const label = [d.first_name, d.last_name, d.email].filter(Boolean).join(" ").toLowerCase();
    return label.includes(personSearch.toLowerCase());
  });

  if (loading) return <div style={{ padding:16, color:C.text3, fontSize:13 }}>Loading…</div>;

  // Pipeline workflows and people_link workflows for this object
  const pipelineOptions   = allWorkflows.filter(w => w.workflow_type === "pipeline"    && w.object_id === objectId);
  const peopleLinkOptions = allWorkflows.filter(w => w.workflow_type === "people_link" && w.object_id === objectId);

  return (
    <div style={{ fontFamily:F, display:"flex", flexDirection:"column", gap:16 }}>

      {/* ── Record Pipeline picker ── */}
      <div style={{ background:"#fafbff", borderRadius:12, border:`1px solid ${C.border}`, padding:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
          <span style={{ fontSize:16 }}>📋</span>
          <span style={{ fontWeight:700, fontSize:13, color:C.text1 }}>Record Pipeline</span>
          {pipelineWf && (
            <span style={{ marginLeft:"auto", fontSize:11, color:C.green, background:C.greenLight,
              padding:"2px 8px", borderRadius:99, fontWeight:600 }}>Active</span>
          )}
        </div>
        <div style={{ fontSize:12, color:C.text3, marginBottom:10, lineHeight:1.5 }}>
          Drives the status of this record through defined stages.
        </div>
        <select value={pipelineWf?.id||""} onChange={e=>assignWorkflow("pipeline", e.target.value)}
          disabled={saving}
          style={{ width:"100%", padding:"9px 12px", border:`1px solid ${C.border}`, borderRadius:9,
            fontSize:13, fontFamily:F, outline:"none", background:"white", color:C.text1 }}>
          <option value="">— No pipeline —</option>
          {pipelineOptions.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        {/* Show current stages as visual track */}
        {pipelineWf?.steps?.length > 0 && (
          <div style={{ marginTop:12, display:"flex", gap:4, flexWrap:"wrap" }}>
            {pipelineWf.steps.map((step, i) => {
              const isCurrent = record.data?.status === step.name;
              return (
                <button key={step.id} onClick={async ()=>{
                    await api.patch(`/records/${record.id}`, { data:{ ...record.data, status: step.name }});
                  }}
                  title={`Set status to "${step.name}"`}
                  style={{ padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:isCurrent?700:500,
                    border:`1.5px solid ${isCurrent?C.accent:C.border}`,
                    background:isCurrent?C.accentLight:"white",
                    color:isCurrent?C.accent:C.text2, cursor:"pointer", fontFamily:F,
                    display:"flex", alignItems:"center", gap:5 }}>
                  {i > 0 && <span style={{ fontSize:10, color:C.text3 }}>›</span>}
                  {step.name||`Stage ${i+1}`}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── People Pipeline picker ── */}
      <div style={{ background:"#faf5ff", borderRadius:12, border:`1px solid #e9d5ff`, padding:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
          <span style={{ fontSize:16 }}>🔗</span>
          <span style={{ fontWeight:700, fontSize:13, color:C.text1 }}>People Pipeline</span>
          {peopleLinkWf && (
            <span style={{ marginLeft:"auto", fontSize:11, color:"#7c3aed", background:"#f5f3ff",
              padding:"2px 8px", borderRadius:99, fontWeight:600 }}>Active</span>
          )}
        </div>
        <div style={{ fontSize:12, color:C.text3, marginBottom:10, lineHeight:1.5 }}>
          Tracks people linked to this record and their stage (e.g. application, interview, offer).
        </div>
        <select value={peopleLinkWf?.id||""} onChange={e=>assignWorkflow("people_link", e.target.value)}
          disabled={saving}
          style={{ width:"100%", padding:"9px 12px", border:`1px solid #e9d5ff`, borderRadius:9,
            fontSize:13, fontFamily:F, outline:"none", background:"white", color:C.text1 }}>
          <option value="">— No people pipeline —</option>
          {peopleLinkOptions.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>

      {/* ── Linked people ── */}
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
          <span style={{ fontWeight:700, fontSize:13, color:C.text1 }}>
            Linked People <span style={{ fontWeight:500, color:C.text3 }}>({peopleLinks.length})</span>
          </span>
          {peopleLinkWf && (
            <button onClick={openAddPerson}
              style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:5, padding:"5px 11px",
                borderRadius:8, border:`1.5px solid #7c3aed`, background:"#f5f3ff", color:"#7c3aed",
                fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:F }}>
              <Ic n="plus" s={12}/> Add Person
            </button>
          )}
        </div>

        {!peopleLinkWf && peopleLinks.length === 0 && (
          <div style={{ textAlign:"center", padding:"20px 0", color:C.text3, fontSize:12 }}>
            Select a People Pipeline above to start linking people.
          </div>
        )}

        {peopleLinks.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {peopleLinks.map(link => {
              const steps = peopleLinkWf?.steps || [];
              return (
                <div key={link.id} style={{ background:C.surface, border:`1px solid ${C.border}`,
                  borderRadius:10, padding:"10px 12px", display:"flex", alignItems:"center", gap:10 }}>
                  {/* Avatar */}
                  <div style={{ width:32, height:32, borderRadius:"50%", background:"#7c3aed",
                    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span style={{ color:"white", fontSize:13, fontWeight:700 }}>{personInitial(link)}</span>
                  </div>
                  {/* Name */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.text1 }}>{personLabel(link)}</div>
                    {link.person_data?.email && (
                      <div style={{ fontSize:11, color:C.text3 }}>{link.person_data.email}</div>
                    )}
                  </div>
                  {/* Stage picker — show all steps as clickable pills */}
                  {steps.length > 0 && (
                    <div style={{ display:"flex", gap:3, flexWrap:"wrap", maxWidth:240, justifyContent:"flex-end" }}>
                      {steps.map(step => {
                        const active = link.stage_id === step.id || (!link.stage_id && steps[0]?.id === step.id);
                        return (
                          <button key={step.id} onClick={()=>moveStage(link.id, step)}
                            style={{ padding:"3px 9px", borderRadius:20, fontSize:11, fontWeight:active?700:500,
                              border:`1.5px solid ${active?"#7c3aed":"#e9d5ff"}`,
                              background: active?"#7c3aed":"white",
                              color: active?"white":"#7c3aed",
                              cursor:"pointer", fontFamily:F, whiteSpace:"nowrap" }}>
                            {step.name||`Stage`}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {steps.length === 0 && (
                    <span style={{ fontSize:11, color:C.text3, fontStyle:"italic" }}>
                      {link.stage_name || "Linked"}
                    </span>
                  )}
                  {/* Remove */}
                  <button onClick={()=>removeLink(link.id)}
                    style={{ background:"none", border:"none", cursor:"pointer", padding:4, flexShrink:0 }}>
                    <Ic n="x" s={13} c={C.text3}/>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add person modal ── */}
      {addingPerson && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.4)", zIndex:2000,
          display:"flex", alignItems:"center", justifyContent:"center" }}
          onClick={()=>setAddingPerson(false)}>
          <div style={{ background:C.surface, borderRadius:16, width:420, maxHeight:"70vh",
            display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}
            onClick={e=>e.stopPropagation()}>
            <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontWeight:700, fontSize:14, color:C.text1, flex:1 }}>Link a Person</span>
              <button onClick={()=>setAddingPerson(false)} style={{ background:"none", border:"none", cursor:"pointer" }}>
                <Ic n="x" s={16} c={C.text3}/>
              </button>
            </div>
            <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}` }}>
              <input autoFocus value={personSearch} onChange={e=>setPersonSearch(e.target.value)}
                placeholder="Search by name or email…"
                style={{ width:"100%", boxSizing:"border-box", padding:"9px 12px", border:`1px solid ${C.border}`,
                  borderRadius:9, fontSize:13, fontFamily:F, outline:"none", color:C.text1 }}/>
            </div>
            <div style={{ flex:1, overflowY:"auto" }}>
              {filteredPersons.length === 0 && (
                <div style={{ padding:"24px", textAlign:"center", color:C.text3, fontSize:13 }}>
                  {personSearch ? "No matching people" : "All people already linked"}
                </div>
              )}
              {filteredPersons.map((r, i) => {
                const d = r.data||{};
                const label = [d.first_name, d.last_name].filter(Boolean).join(" ") || d.email || r.id.slice(0,8);
                return (
                  <div key={r.id} onClick={()=>linkPerson(r.id)}
                    style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px",
                      cursor:"pointer", borderBottom:i<filteredPersons.length-1?`1px solid ${C.border}`:"none" }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.accentLight}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div style={{ width:32, height:32, borderRadius:"50%", background:"#7c3aed",
                      display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span style={{ color:"white", fontSize:13, fontWeight:700 }}>{label.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:C.text1 }}>{label}</div>
                      {d.email && <div style={{ fontSize:11, color:C.text3 }}>{d.email}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
