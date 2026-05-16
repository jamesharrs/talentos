// client/src/Offers.jsx  — Enhanced Offer Management
// Enhancements: package builder, templates, versioning, bulk ops, conditional offers

import { useState, useEffect, useCallback, useRef } from "react";
import api from "./apiClient.js";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:         "var(--t-bg,#F0F2FF)",
  surface:    "var(--t-surface,#FFFFFF)",
  surface2:   "var(--t-surface2,#F8F9FE)",
  border:     "var(--t-border,#E8EAF2)",
  accent:     "var(--t-accent,#5B5BD6)",
  accentLight:"var(--t-accent-light,#EEF0FF)",
  text1:      "var(--t-text1,#0D0D1A)",
  text2:      "var(--t-text2,#3D3D5C)",
  text3:      "var(--t-text3,#8B8BAD)",
  green:      "#0CA678", greenLight: "#ECFDF5",
  amber:      "#D97706", amberLight: "#FFFBEB",
  red:        "#DC2626", redLight:   "#FEF2F2",
  purple:     "#7C3AED", purpleLight:"#F5F3FF",
};
const F = "'DM Sans', -apple-system, sans-serif";

const PRESET_ITEMS = [
  { type:"car",        label:"Car Allowance",         exclude_from_total:false },
  { type:"health",     label:"Health Insurance",       exclude_from_total:true  },
  { type:"life",       label:"Life Insurance",         exclude_from_total:true  },
  { type:"pension",    label:"Pension / Gratuity",     exclude_from_total:false },
  { type:"housing",    label:"Housing Allowance",      exclude_from_total:false },
  { type:"education",  label:"Education Allowance",    exclude_from_total:false },
  { type:"ticket",     label:"Annual Flight Ticket",   exclude_from_total:false },
  { type:"phone",      label:"Phone Allowance",        exclude_from_total:false },
  { type:"ltip",       label:"LTIP / Equity",          exclude_from_total:false },
  { type:"disc_bonus", label:"Discretionary Bonus",    exclude_from_total:false },
  { type:"relocation", label:"Relocation Allowance",   exclude_from_total:true  },
  { type:"gym",        label:"Gym / Wellness",         exclude_from_total:true  },
];

const STATUS_CONFIG = {
  draft:            { label:"Draft",            color:"#6B7280", bg:"#F3F4F6",   icon:"M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" },
  pending_approval: { label:"Pending Approval", color:"#D97706", bg:"#FFFBEB",   icon:"M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2" },
  approved:         { label:"Approved",         color:"#2563EB", bg:"#EFF6FF",   icon:"M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" },
  sent:             { label:"Sent",             color:"#7C3AED", bg:"#F5F3FF",   icon:"M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" },
  accepted:         { label:"Accepted",         color:"#0CA678", bg:"#ECFDF5",   icon:"M20 6L9 17l-5-5" },
  declined:         { label:"Declined",         color:"#DC2626", bg:"#FEF2F2",   icon:"M18 6L6 18M6 6l12 12" },
  expired:          { label:"Expired",          color:"#6B7280", bg:"#F9FAFB",   icon:"M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2" },
  withdrawn:        { label:"Withdrawn",        color:"#6B7280", bg:"#F9FAFB",   icon:"M18 6L6 18M6 6l12 12" },
};

const fmt = {
  currency:(amt,cur="USD")=>amt!=null?new Intl.NumberFormat("en-US",{style:"currency",currency:cur,maximumFractionDigits:0}).format(amt):"—",
  date:(d)=>d?new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}):"—",
  ago:(d)=>{if(!d)return"";const s=Math.floor((Date.now()-new Date(d))/1000);if(s<60)return"just now";if(s<3600)return`${Math.floor(s/60)}m ago`;if(s<86400)return`${Math.floor(s/3600)}h ago`;return`${Math.floor(s/86400)}d ago`;},
};

function computeTotal(offer) {
  let t = parseFloat(offer.base_salary)||0;
  if (offer.bonus) t += offer.bonus_type==="percentage"?t*(parseFloat(offer.bonus)/100):parseFloat(offer.bonus);
  (offer.package_items||[]).forEach(i=>{ if(!i.exclude_from_total) t+=parseFloat(i.value)||0; });
  return t;
}

const PATHS = {
  plus:"M12 5v14M5 12h14", x:"M18 6L6 18M6 6l12 12", check:"M20 6L9 17l-5-5",
  trash:"M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6", edit:"M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  send:"M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z", star:"M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  gift:"M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z",
  refresh:"M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
  chevD:"M6 9l6 6 6-6", grip:"M9 5h2M9 12h2M9 19h2M13 5h2M13 12h2M13 19h2",
  shield:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", clock:"M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2",
  info:"M12 22a10 10 0 100-20 10 10 0 000 20zM12 8h.01M12 12v4", dollar:"M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  users:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
};
const Ic = ({n,s=16,c="currentColor"})=>{const d=PATHS[n];if(!d)return null;return(<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d.split("M").filter(Boolean).map((seg,i)=><path key={i} d={`M${seg}`}/>)}</svg>);};
const StatusBadge=({status,size=11})=>{const cfg=STATUS_CONFIG[status]||STATUS_CONFIG.draft;return(<span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 9px",borderRadius:99,background:cfg.bg,color:cfg.color,fontSize:size,fontWeight:700,whiteSpace:"nowrap"}}><svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d={cfg.icon}/></svg>{cfg.label}</span>);};
const Avatar=({name,size=28,color=C.accent})=>{const init=(name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();return(<div style={{width:size,height:size,borderRadius:"50%",background:`${color}20`,border:`1.5px solid ${color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.36,fontWeight:700,color,flexShrink:0}}>{init}</div>);};

// ── Package Builder ───────────────────────────────────────────────────────────
function PackageBuilder({ currency, base_salary, bonus, bonus_type, items, onChange }) {
  const [showPresets, setShowPresets] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [customValue, setCustomValue] = useState("");
  const [dragIdx, setDragIdx] = useState(null);

  const addPreset = (preset) => {
    if (items.some(i=>i.type===preset.type)) return;
    onChange([...items,{...preset,id:Math.random().toString(36).slice(2),value:""}]);
    setShowPresets(false);
  };
  const addCustom = () => {
    if (!customLabel.trim()) return;
    onChange([...items,{type:"custom",label:customLabel.trim(),value:customValue,exclude_from_total:false,id:Math.random().toString(36).slice(2)}]);
    setCustomLabel(""); setCustomValue("");
  };
  const updateItem=(idx,patch)=>{const next=[...items];next[idx]={...next[idx],...patch};onChange(next);};
  const removeItem=(idx)=>onChange(items.filter((_,i)=>i!==idx));

  const baseNum=parseFloat(base_salary)||0;
  const bonusNum=bonus?(bonus_type==="percentage"?baseNum*(parseFloat(bonus)/100):parseFloat(bonus)):0;
  const itemsTotal=items.filter(i=>!i.exclude_from_total).reduce((s,i)=>s+(parseFloat(i.value)||0),0);
  const total=baseNum+bonusNum+itemsTotal;

  return (
    <div>
      {baseNum>0&&(
        <div style={{padding:"14px 16px",borderRadius:12,background:C.accentLight,border:`1px solid ${C.accent}30`,marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:700,color:C.accent,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>Total Remuneration</div>
          <div style={{display:"flex",gap:0,flexWrap:"wrap",alignItems:"center"}}>
            {[[" Base",fmt.currency(baseNum,currency)],bonusNum?["Bonus",fmt.currency(bonusNum,currency)]:null,itemsTotal?["Allowances",fmt.currency(itemsTotal,currency)]:null].filter(Boolean).map(([k,v],i,arr)=>(
              <div key={k} style={{display:"flex",alignItems:"center"}}>
                <div style={{textAlign:"center",padding:"0 12px"}}>
                  <div style={{fontSize:10,color:C.text3,fontWeight:600}}>{k}</div>
                  <div style={{fontSize:14,fontWeight:700,color:C.text1}}>{v}</div>
                </div>
                {i<arr.length-1&&<div style={{width:1,height:32,background:`${C.accent}30`}}/>}
              </div>
            ))}
            <div style={{display:"flex",alignItems:"center",marginLeft:"auto"}}>
              <div style={{textAlign:"right",padding:"0 0 0 16px",borderLeft:`1px solid ${C.accent}30`}}>
                <div style={{fontSize:10,color:C.accent,fontWeight:700,textTransform:"uppercase"}}>Total Package</div>
                <div style={{fontSize:20,fontWeight:900,color:C.accent}}>{fmt.currency(total,currency)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      {items.length>0&&(
        <div style={{marginBottom:16}}>
          {items.map((item,idx)=>(
            <div key={item.id||idx} draggable onDragStart={()=>setDragIdx(idx)}
              onDragOver={e=>e.preventDefault()}
              onDrop={()=>{if(dragIdx===null||dragIdx===idx)return;const next=[...items];const[m]=next.splice(dragIdx,1);next.splice(idx,0,m);onChange(next);setDragIdx(null);}}
              style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",marginBottom:8,borderRadius:10,border:`1px solid ${C.border}`,background:C.surface,cursor:"grab"}}>
              <Ic n="grip" s={14} c={C.text3}/>
              <span style={{flex:1,fontSize:13,fontWeight:600,color:C.text1}}>{item.label}</span>
              <input type="number" value={item.value} onChange={e=>updateItem(idx,{value:e.target.value})} placeholder="0"
                style={{width:120,padding:"5px 8px",borderRadius:8,border:`1px solid ${C.border}`,fontSize:13,fontFamily:F,outline:"none",textAlign:"right"}}/>
              <span style={{fontSize:11,color:C.text3,minWidth:30}}>{currency}</span>
              <label style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:C.text3,cursor:"pointer",userSelect:"none",minWidth:100}}>
                <input type="checkbox" checked={!item.exclude_from_total} onChange={e=>updateItem(idx,{exclude_from_total:!e.target.checked})} style={{accentColor:C.accent}}/>
                <span style={{color:!item.exclude_from_total?C.green:C.text3}}>{!item.exclude_from_total?"In total":"Benefit only"}</span>
              </label>
              <button onClick={()=>removeItem(idx)} style={{background:"none",border:"none",cursor:"pointer",padding:4,borderRadius:6,display:"flex"}}>
                <Ic n="x" s={13} c={C.text3}/>
              </button>
            </div>
          ))}
        </div>
      )}
      <div style={{display:"flex",gap:8}}>
        <div style={{position:"relative"}}>
          <button onClick={()=>setShowPresets(p=>!p)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:9,border:`1.5px solid ${C.accent}`,background:C.accentLight,color:C.accent,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:F}}>
            <Ic n="plus" s={13} c={C.accent}/> Add Benefit <Ic n="chevD" s={12} c={C.accent}/>
          </button>
          {showPresets&&(
            <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,zIndex:100,background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",minWidth:220,overflow:"hidden"}}>
              {PRESET_ITEMS.map(p=>{const exists=items.some(i=>i.type===p.type);return(
                <button key={p.type} onClick={()=>addPreset(p)} disabled={exists} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",border:"none",background:"transparent",cursor:exists?"default":"pointer",opacity:exists?0.4:1,fontFamily:F,fontSize:13,color:C.text1,textAlign:"left"}}>
                  <span>{p.label}</span>{p.exclude_from_total&&<span style={{fontSize:10,color:C.text3}}>benefit</span>}
                </button>
              );})}
            </div>
          )}
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:10}}>
        <input value={customLabel} onChange={e=>setCustomLabel(e.target.value)} placeholder="Custom item label…"
          style={{flex:1,padding:"8px 10px",borderRadius:8,border:`1px solid ${C.border}`,fontSize:12,fontFamily:F,outline:"none"}}/>
        <input value={customValue} onChange={e=>setCustomValue(e.target.value)} type="number" placeholder="Value"
          style={{width:90,padding:"8px 10px",borderRadius:8,border:`1px solid ${C.border}`,fontSize:12,fontFamily:F,outline:"none"}}/>
        <button onClick={addCustom} disabled={!customLabel.trim()} style={{padding:"8px 14px",borderRadius:8,border:"none",background:customLabel.trim()?C.accent:C.border,color:customLabel.trim()?"white":C.text3,fontSize:12,fontWeight:700,cursor:customLabel.trim()?"pointer":"default",fontFamily:F}}>Add</button>
      </div>
    </div>
  );
}

// ── Conditions panel ──────────────────────────────────────────────────────────
function ConditionsPanel({ conditions, onToggle }) {
  if (!conditions||!conditions.length) return null;
  return (
    <div style={{padding:"14px 16px",background:C.amberLight,borderRadius:12,border:`1px solid ${C.amber}30`,marginBottom:16}}>
      <div style={{fontSize:12,fontWeight:700,color:C.amber,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
        <Ic n="shield" s={13} c={C.amber}/> Conditional — {conditions.filter(c=>c.cleared).length}/{conditions.length} cleared
      </div>
      {conditions.map((c,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<conditions.length-1?`1px solid ${C.amber}20`:"none"}}>
          <button onClick={()=>onToggle(i,!c.cleared)} style={{width:18,height:18,borderRadius:4,border:`2px solid ${c.cleared?C.green:C.amber}`,background:c.cleared?C.green:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,padding:0}}>
            {c.cleared&&<Ic n="check" s={11} c="white"/>}
          </button>
          <span style={{fontSize:13,color:C.text2,textDecoration:c.cleared?"line-through":"none",opacity:c.cleared?0.6:1}}>{c.label}</span>
          {c.cleared&&c.cleared_at&&<span style={{fontSize:11,color:C.green,marginLeft:"auto"}}>Cleared {fmt.ago(c.cleared_at)}</span>}
        </div>
      ))}
    </div>
  );
}

// ── Offer card ────────────────────────────────────────────────────────────────
function OfferCard({ offer, onClick, selected, onSelect, selectable }) {
  const daysToExpiry=offer.expiry_date?Math.ceil((new Date(offer.expiry_date)-Date.now())/86400000):null;
  const urgentExpiry=daysToExpiry!==null&&daysToExpiry<=3&&daysToExpiry>=0;
  const total=computeTotal(offer);
  return (
    <div style={{position:"relative"}}>
      {selectable&&<input type="checkbox" checked={selected} onChange={e=>{e.stopPropagation();onSelect(offer.id,e.target.checked);}} style={{position:"absolute",top:14,left:14,zIndex:2,accentColor:C.accent,cursor:"pointer"}} onClick={e=>e.stopPropagation()}/>}
      <div onClick={onClick} style={{padding:"14px 18px",paddingLeft:selectable?36:18,borderRadius:10,cursor:"pointer",transition:"all .12s",background:selected?C.accentLight:C.surface,border:`1.5px solid ${selected?C.accent:urgentExpiry?C.amber:C.border}`,boxShadow:selected?`0 0 0 3px ${C.accent}20`:urgentExpiry?`0 0 0 2px ${C.amber}20`:"none",marginBottom:8}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,flexWrap:"wrap"}}>
              <StatusBadge status={offer.status}/>
              {(offer.version||1)>1&&<span style={{fontSize:10,fontWeight:700,color:C.text3,padding:"2px 7px",borderRadius:99,background:`${C.text3}15`,border:`1px solid ${C.text3}30`}}>v{offer.version}</span>}
              {offer.conditions?.some(c=>!c.cleared)&&<span style={{fontSize:10,color:C.amber,fontWeight:700}}>⚠ Conditional</span>}
            </div>
            <div style={{fontSize:14,fontWeight:700,color:C.text1,marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{offer.candidate_name||"Candidate"}</div>
            <div style={{fontSize:12,color:C.text3}}>{offer.job_name||"—"}{offer.job_department?` · ${offer.job_department}`:""}</div>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontSize:16,fontWeight:800,color:C.accent}}>{fmt.currency(total,offer.currency)}</div>
            {urgentExpiry&&daysToExpiry>0&&<div style={{fontSize:10,color:C.amber,fontWeight:700,marginTop:2}}>Expires in {daysToExpiry}d</div>}
            {daysToExpiry===0&&<div style={{fontSize:10,color:C.red,fontWeight:700}}>Expires today</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Offer detail panel ────────────────────────────────────────────────────────
function OfferDetail({ offer, environment, onClose, onUpdate, onRevise, session }) {
  const [actTab,setActTab]=useState("details");
  const [actionLoading,setActionLoading]=useState(false);
  const [showSaveTemplate,setShowSaveTemplate]=useState(false);
  const [templateName,setTemplateName]=useState("");
  const [savingTemplate,setSavingTemplate]=useState(false);
  const total=computeTotal(offer);

  const performAction=async(action,payload={})=>{
    setActionLoading(true);
    try{const updated=await api.patch(`/offers/${offer.id}/status`,{status:action,user:session?.user?.id,...payload});onUpdate(updated);}
    catch(e){console.error(e);}finally{setActionLoading(false);}
  };
  const toggleCondition=async(idx,cleared)=>{
    await api.patch(`/offers/${offer.id}/conditions/${idx}`,{cleared});
    const updated=await api.get(`/offers/${offer.id}`);onUpdate(updated);
  };
  const saveAsTemplate=async()=>{
    if(!templateName.trim())return;setSavingTemplate(true);
    try{await api.post("/offers/templates",{environment_id:environment?.id,name:templateName.trim(),shared:true,base_salary:offer.base_salary,currency:offer.currency,bonus:offer.bonus,bonus_type:offer.bonus_type,package_items:offer.package_items,terms:offer.terms,approval_chain:offer.approval_chain});setShowSaveTemplate(false);setTemplateName("");}
    finally{setSavingTemplate(false);}
  };

  const ACTIONS={
    draft:[{label:"Submit for Approval",action:"pending_approval",icon:"check",color:C.accent},{label:"Save as Template",action:"__template__",icon:"star",color:C.amber}],
    pending_approval:[{label:"Approve",action:"approved",icon:"check",color:C.green},{label:"Reject",action:"draft",icon:"x",color:C.red}],
    approved:[{label:"Send to Candidate",action:"sent",icon:"send",color:C.accent}],
    sent:[{label:"Mark Accepted",action:"accepted",icon:"check",color:C.green},{label:"Mark Declined",action:"declined",icon:"x",color:C.red},{label:"Mark Expired",action:"expired",icon:"clock",color:C.amber}],
    declined:[{label:"Revise Offer",action:"__revise__",icon:"refresh",color:C.accent}],
    expired:[{label:"Revise Offer",action:"__revise__",icon:"refresh",color:C.accent}],
  };
  const actions=ACTIONS[offer.status]||[];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",minHeight:0,position:"relative"}}>
      <div style={{padding:"20px 24px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <StatusBadge status={offer.status} size={12}/>
              {(offer.version||1)>1&&<span style={{fontSize:11,fontWeight:600,color:C.text3}}>Version {offer.version}</span>}
            </div>
            <div style={{fontSize:18,fontWeight:800,color:C.text1,marginBottom:2}}>{offer.candidate_name}</div>
            <div style={{fontSize:13,color:C.text3}}>{[offer.job_name,offer.job_department].filter(Boolean).join(" · ")}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",padding:4,borderRadius:6}}><Ic n="x" s={18} c={C.text3}/></button>
        </div>
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          {[{label:"Base",value:fmt.currency(offer.base_salary,offer.currency)},{label:"Total",value:fmt.currency(total,offer.currency),highlight:true},{label:"Start",value:fmt.date(offer.start_date)},offer.expiry_date?{label:"Expires",value:fmt.date(offer.expiry_date)}:null].filter(Boolean).map(item=>(
            <div key={item.label} style={{flex:1,minWidth:80}}>
              <div style={{fontSize:10,fontWeight:700,color:C.text3,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:2}}>{item.label}</div>
              <div style={{fontSize:14,fontWeight:700,color:item.highlight?C.accent:C.text1,whiteSpace:"nowrap"}}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:2,padding:"12px 24px 0",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        {[["details","Details"],["package","Package"],["conditions","Conditions"],["chain","Approval"],["timeline","Timeline"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setActTab(id)} style={{padding:"7px 14px",borderRadius:"8px 8px 0 0",border:"none",fontFamily:F,fontSize:12,fontWeight:600,cursor:"pointer",background:actTab===id?C.surface:"transparent",color:actTab===id?C.accent:C.text3,borderBottom:actTab===id?`2px solid ${C.accent}`:"2px solid transparent"}}>{lbl}</button>
        ))}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
        {actTab==="details"&&(<div><ConditionsPanel conditions={offer.conditions} onToggle={toggleCondition}/>{offer.notes&&<div style={{marginBottom:16}}><div style={{fontSize:11,fontWeight:700,color:C.text3,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>Notes</div><div style={{fontSize:13,color:C.text2,lineHeight:1.6,background:C.surface2,padding:"10px 14px",borderRadius:10,border:`1px solid ${C.border}`}}>{offer.notes}</div></div>}{offer.terms&&<div><div style={{fontSize:11,fontWeight:700,color:C.text3,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>Terms</div><div style={{fontSize:13,color:C.text2,lineHeight:1.6,background:C.surface2,padding:"10px 14px",borderRadius:10,border:`1px solid ${C.border}`}}>{offer.terms}</div></div>}</div>)}
        {actTab==="package"&&(
          <div style={{padding:"14px 16px",background:C.accentLight,borderRadius:12,border:`1px solid ${C.accent}30`}}>
            {[["Base Salary",fmt.currency(offer.base_salary,offer.currency),true],offer.bonus?["Bonus",offer.bonus_type==="percentage"?`${offer.bonus}%`:fmt.currency(offer.bonus,offer.currency),false]:null,...(offer.package_items||[]).map(item=>[item.label+(item.exclude_from_total?" (benefit)":""),fmt.currency(item.value,offer.currency),false]),["","",null],["Total Remuneration",fmt.currency(total,offer.currency),true]].filter(Boolean).map(([k,v,bold],i)=>v===""?<div key={i} style={{height:1,background:`${C.accent}20`,margin:"8px 0"}}/>:<div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0"}}><span style={{fontSize:13,color:C.text2,fontWeight:bold?700:400}}>{k}</span><span style={{fontSize:13,fontWeight:bold?800:600,color:bold?C.accent:C.text1}}>{v}</span></div>)}
          </div>
        )}
        {actTab==="conditions"&&(offer.conditions?.length>0?<ConditionsPanel conditions={offer.conditions} onToggle={toggleCondition}/>:<div style={{textAlign:"center",padding:40,color:C.text3,fontSize:13}}>No conditions on this offer.</div>)}
        {actTab==="chain"&&((offer.approval_chain||[]).length===0?<div style={{textAlign:"center",padding:40,color:C.text3,fontSize:13}}>No approval chain configured.</div>:offer.approval_chain.map((a,i)=>(
          <div key={i} style={{display:"flex",gap:12,marginBottom:16}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
              <div style={{width:36,height:36,borderRadius:"50%",flexShrink:0,background:a.status==="approved"?C.greenLight:a.status==="rejected"?"#FEF2F2":C.accentLight,border:`2px solid ${a.status==="approved"?C.green:a.status==="rejected"?C.red:C.accent}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {a.status==="approved"?<Ic n="check" s={14} c={C.green}/>:a.status==="rejected"?<Ic n="x" s={14} c={C.red}/>:<span style={{fontSize:12,fontWeight:700,color:C.accent}}>{i+1}</span>}
              </div>
              {i<offer.approval_chain.length-1&&<div style={{width:2,flex:1,background:C.border,marginTop:4,minHeight:20}}/>}
            </div>
            <div style={{paddingTop:6,flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:C.text1}}>{a.name}</div>
              <div style={{fontSize:12,color:C.text3,marginBottom:a.comment?6:0}}>{a.role||a.email}</div>
              {a.comment&&<div style={{fontSize:12,color:C.text2,background:C.surface2,padding:"8px 10px",borderRadius:8,border:`1px solid ${C.border}`}}>{a.comment}</div>}
              {a.decided_at&&<div style={{fontSize:11,color:C.text3,marginTop:4}}>{fmt.ago(a.decided_at)}</div>}
            </div>
          </div>
        )))}
        {actTab==="timeline"&&(offer.activity_log||[]).slice().reverse().map((entry,i)=>(
          <div key={entry.id||i} style={{display:"flex",gap:12,marginBottom:16}}>
            <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,background:entry.type==="approved"?C.greenLight:entry.type==="rejected"?"#FEF2F2":C.accentLight,border:`1.5px solid ${entry.type==="approved"?C.green:entry.type==="rejected"?C.red:C.accent}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Ic n={entry.type==="approved"?"check":entry.type==="rejected"?"x":"info"} s={13} c={entry.type==="approved"?C.green:entry.type==="rejected"?C.red:C.accent}/>
            </div>
            <div style={{flex:1,paddingTop:4}}>
              <div style={{fontSize:13,color:C.text1,lineHeight:1.5}}>{entry.message}</div>
              <div style={{fontSize:11,color:C.text3,marginTop:2}}>{fmt.ago(entry.timestamp)}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{padding:"16px 24px",borderTop:`1px solid ${C.border}`,flexShrink:0,display:"flex",flexWrap:"wrap",gap:8}}>
        {actions.map(act=>(
          <button key={act.action} onClick={()=>{if(act.action==="__template__"){setShowSaveTemplate(true);return;}if(act.action==="__revise__"){onRevise(offer);return;}performAction(act.action);}} disabled={actionLoading}
            style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:9,border:`1.5px solid ${act.color}`,background:`${act.color}15`,color:act.color,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:F}}>
            <Ic n={act.icon} s={13} c={act.color}/>{act.label}
          </button>
        ))}
      </div>
      {showSaveTemplate&&(
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.3)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:10}}>
          <div style={{background:C.surface,borderRadius:16,padding:24,maxWidth:360,width:"100%",margin:20}}>
            <div style={{fontSize:16,fontWeight:700,color:C.text1,marginBottom:4}}>Save as Template</div>
            <div style={{fontSize:13,color:C.text3,marginBottom:16}}>Saves compensation structure as a reusable template.</div>
            <input value={templateName} onChange={e=>setTemplateName(e.target.value)} placeholder="Template name…" style={{width:"100%",padding:"9px 12px",borderRadius:9,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:F,outline:"none",boxSizing:"border-box",marginBottom:12}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{setShowSaveTemplate(false);setTemplateName("");}} style={{flex:1,padding:"9px",borderRadius:9,border:`1px solid ${C.border}`,background:"transparent",color:C.text2,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:F}}>Cancel</button>
              <button onClick={saveAsTemplate} disabled={!templateName.trim()||savingTemplate} style={{flex:1,padding:"9px",borderRadius:9,border:"none",background:C.accent,color:"white",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:F}}>{savingTemplate?"Saving…":"Save Template"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── New Offer Wizard ──────────────────────────────────────────────────────────
const WIZARD_STEPS=[{id:"candidate",label:"Candidate"},{id:"details",label:"Details"},{id:"package",label:"Package"},{id:"approval",label:"Approval"}];

function NewOfferWizard({ environment, session, onCreated, onCancel }) {
  const [step,setStep]=useState(0);
  const [loading,setLoading]=useState(false);
  const [templates,setTemplates]=useState([]);
  const [errors,setErrors]=useState({});
  const [form,setForm]=useState({candidate_id:"",candidate_name:"",job_id:"",job_name:"",job_department:"",start_date:"",expiry_date:"",base_salary:"",currency:"AED",bonus:"",bonus_type:"fixed",package_items:[],conditions:[],notes:"",terms:"",approval_chain:[],is_conditional:false,new_condition:""});
  const [candidateSearch,setCandidateSearch]=useState("");
  const [candidates,setCandidates]=useState([]);
  const [jobSearch,setJobSearch]=useState("");
  const [jobs,setJobs]=useState([]);
  const [approverInput,setApproverInput]=useState({name:"",email:"",role:""});

  useEffect(()=>{
    if(environment?.id) api.get(`/offers/templates?environment_id=${environment.id}`).then(d=>setTemplates(Array.isArray(d)?d:[])).catch(()=>{});
  },[environment?.id]);

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const searchCandidates=useCallback(async(q)=>{
    if(!q||q.length<2){setCandidates([]);return;}
    try{const d=await api.get(`/records/search?q=${encodeURIComponent(q)}&environment_id=${environment?.id}&limit=8`);setCandidates((d?.results||[]).filter(r=>r.object_slug==="people"));}catch{setCandidates([]);}
  },[environment?.id]);

  const searchJobs=useCallback(async(q)=>{
    if(!q||q.length<2){setJobs([]);return;}
    try{const d=await api.get(`/records/search?q=${encodeURIComponent(q)}&environment_id=${environment?.id}&limit=6`);setJobs((d?.results||[]).filter(r=>r.object_slug==="jobs"));}catch{setJobs([]);}
  },[environment?.id]);

  const loadTemplate=(t)=>setForm(f=>({...f,base_salary:t.base_salary||"",currency:t.currency||"AED",bonus:t.bonus||"",bonus_type:t.bonus_type||"fixed",package_items:t.package_items||[],terms:t.terms||"",approval_chain:t.approval_chain||[]}));

  const submit=async()=>{
    const e={};if(!form.candidate_id)e.candidate="Select a candidate";if(!form.base_salary)e.base_salary="Base salary is required";
    setErrors(e);if(Object.keys(e).length)return;
    setLoading(true);
    try{const data=await api.post("/offers",{environment_id:environment?.id,candidate_id:form.candidate_id,candidate_name:form.candidate_name,job_id:form.job_id||null,job_name:form.job_name,job_department:form.job_department,base_salary:parseFloat(form.base_salary)||null,currency:form.currency,bonus:form.bonus?parseFloat(form.bonus):null,bonus_type:form.bonus_type,package_items:form.package_items,start_date:form.start_date||null,expiry_date:form.expiry_date||null,conditions:form.is_conditional?form.conditions.filter(c=>c.label):[],notes:form.notes,terms:form.terms,approval_chain:form.approval_chain,created_by:session?.user?.id});onCreated(data);}
    catch(e){console.error(e);}finally{setLoading(false);}
  };

  const inp=(k)=>({width:"100%",padding:"9px 12px",borderRadius:9,border:`1.5px solid ${errors[k]?C.red:C.border}`,fontSize:13,fontFamily:F,outline:"none",boxSizing:"border-box"});
  const lbl=(txt,req)=><div style={{fontSize:12,fontWeight:700,color:C.text2,marginBottom:5}}>{txt}{req&&<span style={{color:C.red}}> *</span>}</div>;

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",fontFamily:F}}>
      <div style={{padding:"20px 24px 0",display:"flex",gap:0,borderBottom:`1px solid ${C.border}`}}>
        {WIZARD_STEPS.map((s,i)=>(
          <div key={s.id} style={{display:"flex",alignItems:"center",flex:1}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
              <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:i<step?C.green:i===step?C.accent:C.border,color:"white",fontSize:12,fontWeight:800,marginBottom:6}}>
                {i<step?<Ic n="check" s={13} c="white"/>:i+1}
              </div>
              <div style={{fontSize:11,fontWeight:600,color:i===step?C.accent:C.text3,marginBottom:8,whiteSpace:"nowrap"}}>{s.label}</div>
            </div>
            {i<WIZARD_STEPS.length-1&&<div style={{height:2,flex:1,background:i<step?C.green:C.border,margin:"0 4px 14px"}}/>}
          </div>
        ))}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"24px"}}>
        {step===0&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {templates.length>0&&(
              <div style={{padding:"12px 14px",background:C.accentLight,borderRadius:10,border:`1px solid ${C.accent}30`}}>
                <div style={{fontSize:12,fontWeight:700,color:C.accent,marginBottom:8,display:"flex",alignItems:"center",gap:6}}><Ic n="star" s={12} c={C.accent}/> Load from template</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{templates.map(t=>(<button key={t.id} onClick={()=>loadTemplate(t)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${C.accent}40`,background:"white",color:C.accent,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:F}}>{t.name}</button>))}</div>
              </div>
            )}
            <div>
              {lbl("Candidate",true)}{errors.candidate&&<div style={{fontSize:11,color:C.red,marginBottom:4}}>{errors.candidate}</div>}
              {form.candidate_id?(
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,background:C.greenLight,border:`1px solid ${C.green}30`}}>
                  <Avatar name={form.candidate_name} size={32} color={C.green}/>
                  <span style={{flex:1,fontSize:14,fontWeight:700,color:C.text1}}>{form.candidate_name}</span>
                  <button onClick={()=>{set("candidate_id","");set("candidate_name","");setCandidateSearch("");}} style={{background:"none",border:"none",cursor:"pointer"}}><Ic n="x" s={14} c={C.text3}/></button>
                </div>
              ):(
                <div>
                  <input value={candidateSearch} onChange={e=>{setCandidateSearch(e.target.value);searchCandidates(e.target.value);}} placeholder="Search candidates…" style={inp("candidate")}/>
                  {candidates.length>0&&(
                    <div style={{border:`1px solid ${C.border}`,borderTop:"none",borderRadius:"0 0 10px 10px",overflow:"hidden"}}>
                      {candidates.map(c=>{const name=[c.data?.first_name,c.data?.last_name].filter(Boolean).join(" ")||c.data?.email||"Candidate";return(
                        <div key={c.id} onClick={()=>{set("candidate_id",c.id);set("candidate_name",name);setCandidates([]);}} style={{padding:"10px 14px",cursor:"pointer",borderBottom:`1px solid ${C.border}`,background:C.surface,display:"flex",alignItems:"center",gap:10}} onMouseEnter={e=>e.currentTarget.style.background=C.surface2} onMouseLeave={e=>e.currentTarget.style.background=C.surface}>
                          <Avatar name={name} size={28}/><div><div style={{fontSize:13,fontWeight:600,color:C.text1}}>{name}</div><div style={{fontSize:11,color:C.text3}}>{c.data?.current_title||""}</div></div>
                        </div>
                      );})}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              {lbl("Job (optional)")}
              <input value={jobSearch} onChange={e=>{setJobSearch(e.target.value);searchJobs(e.target.value);}} placeholder="Link to a job…" style={inp(null)}/>
              {jobs.length>0&&(<div style={{border:`1px solid ${C.border}`,borderTop:"none",borderRadius:"0 0 10px 10px",overflow:"hidden"}}>{jobs.map(j=>(<div key={j.id} onClick={()=>{set("job_id",j.id);set("job_name",j.data?.job_title||"");set("job_department",j.data?.department||"");setJobSearch(j.data?.job_title||"");setJobs([]);}} style={{padding:"10px 14px",cursor:"pointer",borderBottom:`1px solid ${C.border}`,background:C.surface,fontSize:13,color:C.text1}} onMouseEnter={e=>e.currentTarget.style.background=C.surface2} onMouseLeave={e=>e.currentTarget.style.background=C.surface}>{j.data?.job_title}{j.data?.department?` · ${j.data.department}`:""}</div>))}</div>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>{lbl("Start Date")}<input type="date" value={form.start_date} onChange={e=>set("start_date",e.target.value)} style={inp(null)}/></div>
              <div>{lbl("Expiry Date")}<input type="date" value={form.expiry_date} onChange={e=>set("expiry_date",e.target.value)} style={inp(null)}/></div>
            </div>
          </div>
        )}
        {step===1&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12}}>
              <div>{lbl("Base Salary",true)}<input type="number" value={form.base_salary} onChange={e=>set("base_salary",e.target.value)} placeholder="e.g. 120000" style={inp("base_salary")}/>{errors.base_salary&&<div style={{fontSize:11,color:C.red,marginTop:4}}>{errors.base_salary}</div>}</div>
              <div>{lbl("Currency")}<select value={form.currency} onChange={e=>set("currency",e.target.value)} style={{...inp(null),background:C.surface}}>{["AED","USD","GBP","EUR","SAR","QAR","KWD","SGD","AUD","CAD"].map(c=><option key={c}>{c}</option>)}</select></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12}}>
              <div>{lbl("Bonus (optional)")}<input type="number" value={form.bonus} onChange={e=>set("bonus",e.target.value)} placeholder="e.g. 10000 or 10" style={inp(null)}/></div>
              <div>{lbl("Bonus Type")}<select value={form.bonus_type} onChange={e=>set("bonus_type",e.target.value)} style={{...inp(null),background:C.surface}}><option value="fixed">Fixed</option><option value="percentage">% of Salary</option></select></div>
            </div>
            <div>
              <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
                <input type="checkbox" checked={form.is_conditional} onChange={e=>set("is_conditional",e.target.checked)} style={{accentColor:C.accent}}/>
                <span style={{fontSize:13,fontWeight:600,color:C.text2}}>Conditional offer</span>
                <span style={{fontSize:11,color:C.text3}}>(must meet conditions before acceptance confirmed)</span>
              </label>
              {form.is_conditional&&(
                <div style={{marginTop:12}}>
                  {form.conditions.map((c,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <span style={{flex:1,fontSize:13,color:C.text1,padding:"8px 12px",background:C.amberLight,borderRadius:8,border:`1px solid ${C.amber}30`}}>{c.label}</span>
                      <button onClick={()=>set("conditions",form.conditions.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer"}}><Ic n="x" s={13} c={C.text3}/></button>
                    </div>
                  ))}
                  <div style={{display:"flex",gap:8}}>
                    <input value={form.new_condition} onChange={e=>set("new_condition",e.target.value)} placeholder="e.g. Reference check, Right to Work…" onKeyDown={e=>{if(e.key==="Enter"&&form.new_condition.trim()){set("conditions",[...form.conditions,{label:form.new_condition.trim(),cleared:false}]);set("new_condition","");}}} style={inp(null)}/>
                    <button onClick={()=>{if(form.new_condition.trim()){set("conditions",[...form.conditions,{label:form.new_condition.trim(),cleared:false}]);set("new_condition","");}}} style={{padding:"9px 14px",borderRadius:9,border:"none",background:C.accent,color:"white",cursor:"pointer",fontFamily:F,fontWeight:700,fontSize:13}}>Add</button>
                  </div>
                </div>
              )}
            </div>
            <div>{lbl("Internal Notes")}<textarea value={form.notes} onChange={e=>set("notes",e.target.value)} rows={3} placeholder="Notes visible to recruiters only…" style={{...inp(null),resize:"vertical"}}/></div>
            <div>{lbl("Terms & Conditions")}<textarea value={form.terms} onChange={e=>set("terms",e.target.value)} rows={4} placeholder="Terms sent to candidate…" style={{...inp(null),resize:"vertical"}}/></div>
          </div>
        )}
        {step===2&&<PackageBuilder currency={form.currency} base_salary={form.base_salary} bonus={form.bonus} bonus_type={form.bonus_type} items={form.package_items} onChange={items=>set("package_items",items)}/>}
        {step===3&&(
          <div>
            <p style={{fontSize:13,color:C.text2,marginBottom:20,lineHeight:1.6}}>Add approvers in order. You can skip for a draft.</p>
            {form.approval_chain.map((a,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",marginBottom:8,borderRadius:10,border:`1px solid ${C.border}`,background:C.surface2}}>
                <Avatar name={a.name} size={28}/><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:C.text1}}>{a.name}</div><div style={{fontSize:11,color:C.text3}}>{a.role||a.email}</div></div>
                <button onClick={()=>set("approval_chain",form.approval_chain.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer"}}><Ic n="x" s={13} c={C.text3}/></button>
              </div>
            ))}
            <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:16}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <input value={approverInput.name} onChange={e=>setApproverInput(p=>({...p,name:e.target.value}))} placeholder="Name" style={inp(null)}/>
                <input value={approverInput.role} onChange={e=>setApproverInput(p=>({...p,role:e.target.value}))} placeholder="Role (optional)" style={inp(null)}/>
              </div>
              <input value={approverInput.email} onChange={e=>setApproverInput(p=>({...p,email:e.target.value}))} placeholder="Email" style={inp(null)}/>
              <button onClick={()=>{if(!approverInput.name.trim())return;set("approval_chain",[...form.approval_chain,{...approverInput,status:"pending",decided_at:null,comment:""}]);setApproverInput({name:"",email:"",role:""}); }} style={{padding:"9px",borderRadius:9,border:`1.5px solid ${C.accent}`,background:C.accentLight,color:C.accent,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:F,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                <Ic n="plus" s={13} c={C.accent}/> Add Approver
              </button>
            </div>
          </div>
        )}
      </div>
      <div style={{padding:"16px 24px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8,flexShrink:0}}>
        <button onClick={onCancel} style={{padding:"10px 18px",borderRadius:10,border:`1px solid ${C.border}`,background:"transparent",color:C.text2,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:F}}>Cancel</button>
        {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{padding:"10px 18px",borderRadius:10,border:`1px solid ${C.border}`,background:"transparent",color:C.text2,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:F}}>← Back</button>}
        <div style={{flex:1}}/>
        {step<WIZARD_STEPS.length-1?(
          <button onClick={()=>{if(step===0&&!form.candidate_id){setErrors({candidate:"Select a candidate"});return;}setErrors({});setStep(s=>s+1);}} style={{padding:"10px 24px",borderRadius:10,border:"none",background:C.accent,color:"white",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:F}}>Next →</button>
        ):(
          <button onClick={submit} disabled={loading} style={{padding:"10px 24px",borderRadius:10,border:"none",background:C.accent,color:"white",fontSize:13,fontWeight:700,cursor:loading?"wait":"pointer",fontFamily:F,display:"flex",alignItems:"center",gap:8}}>
            {loading?"Creating…":<><Ic n="check" s={14} c="white"/> Create Offer</>}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Offers page ──────────────────────────────────────────────────────────
export default function OffersModule({ environment, session }) {
  const [offers,setOffers]=useState([]);
  const [templates,setTemplates]=useState([]);
  const [loading,setLoading]=useState(true);
  const [selected,setSelected]=useState(null);
  const [showNew,setShowNew]=useState(false);
  const [mainTab,setMainTab]=useState("offers");
  const [statusFilter,setStatusFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [selectedIds,setSelectedIds]=useState(new Set());
  const [bulkLoading,setBulkLoading]=useState(false);

  const load=useCallback(async()=>{
    if(!environment?.id)return;setLoading(true);
    try{const[o,t]=await Promise.all([api.get(`/offers?environment_id=${environment.id}`),api.get(`/offers/templates?environment_id=${environment.id}`)]);setOffers(Array.isArray(o)?o:[]);setTemplates(Array.isArray(t)?t:[]);}
    catch{}finally{setLoading(false);}
  },[environment?.id]);

  useEffect(()=>{load();},[load]);

  const handleCreated=(offer)=>{setOffers(prev=>[offer,...prev]);setShowNew(false);setSelected(offer);};
  const handleUpdate=(updated)=>{setOffers(prev=>prev.map(o=>o.id===updated.id?updated:o));setSelected(updated);};
  const handleRevise=async(offer)=>{try{const revised=await api.post(`/offers/${offer.id}/revise`);setOffers(prev=>[revised,...prev]);setSelected(revised);}catch(e){console.error(e);}};
  const handleDeleteTemplate=async(id)=>{if(!window.confirm("Delete this template?"))return;await api.delete(`/offers/templates/${id}`);setTemplates(prev=>prev.filter(t=>t.id!==id));};

  const bulkSend=async()=>{
    if(!selectedIds.size)return;setBulkLoading(true);
    try{await api.post("/offers/bulk-send",{offer_ids:[...selectedIds]});await load();setSelectedIds(new Set());}finally{setBulkLoading(false);}
  };

  const filteredOffers=offers.filter(o=>{
    if(statusFilter!=="all"&&o.status!==statusFilter)return false;
    if(search){const q=search.toLowerCase();return(o.candidate_name||"").toLowerCase().includes(q)||(o.job_name||"").toLowerCase().includes(q);}
    return true;
  });

  const canBulkSend=[...selectedIds].every(id=>{const o=offers.find(o=>o.id===id);return o?.status==="approved";})&&selectedIds.size>0;
  const STATUS_TABS=["all","draft","pending_approval","approved","sent","accepted","declined"];
  const stats={total:offers.length,pending:offers.filter(o=>o.status==="pending_approval").length,sent:offers.filter(o=>o.status==="sent").length,accepted:offers.filter(o=>o.status==="accepted").length};

  return (
    <div style={{display:"flex",height:"100%",minHeight:0,fontFamily:F,gap:0}}>
      {/* Left panel */}
      <div style={{width:340,flexShrink:0,display:"flex",flexDirection:"column",borderRight:`1px solid ${C.border}`,height:"100%",minHeight:0}}>
        <div style={{padding:"20px 20px 16px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div style={{fontSize:20,fontWeight:800,color:C.text1}}>Offers</div>
            <button onClick={()=>{setShowNew(true);setSelected(null);}} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:9,border:"none",background:C.accent,color:"white",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:F}}>
              <Ic n="plus" s={13} c="white"/> New
            </button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
            {[{label:"Total",value:stats.total,color:C.text1},{label:"Pending",value:stats.pending,color:C.amber},{label:"Sent",value:stats.sent,color:C.purple},{label:"Accepted",value:stats.accepted,color:C.green}].map(s=>(
              <div key={s.label} style={{padding:"10px 12px",borderRadius:10,background:C.surface2,border:`1px solid ${C.border}`,textAlign:"center"}}>
                <div style={{fontSize:20,fontWeight:800,color:s.color}}>{s.value}</div>
                <div style={{fontSize:10,fontWeight:700,color:C.text3,textTransform:"uppercase",letterSpacing:"0.05em"}}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:2}}>
            {[["offers","Offers"],["templates","Templates"]].map(([id,lbl])=>(
              <button key={id} onClick={()=>setMainTab(id)} style={{flex:1,padding:"7px",borderRadius:9,border:"none",fontFamily:F,fontSize:12,fontWeight:700,cursor:"pointer",background:mainTab===id?C.accent:C.surface2,color:mainTab===id?"white":C.text3}}>{lbl}</button>
            ))}
          </div>
        </div>

        {mainTab==="offers"&&(
          <>
            <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search offers…" style={{width:"100%",padding:"8px 12px",borderRadius:9,border:`1px solid ${C.border}`,fontSize:13,fontFamily:F,outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div style={{overflowX:"auto",padding:"10px 16px 6px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:4}}>
              {STATUS_TABS.map(s=>(
                <button key={s} onClick={()=>setStatusFilter(s)} style={{whiteSpace:"nowrap",padding:"4px 10px",borderRadius:20,border:"none",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:F,background:statusFilter===s?C.accent:C.surface2,color:statusFilter===s?"white":C.text3}}>
                  {s==="all"?"All":STATUS_CONFIG[s]?.label||s}
                </button>
              ))}
            </div>
            {selectedIds.size>0&&(
              <div style={{padding:"10px 16px",background:C.accentLight,borderBottom:`1px solid ${C.accent}30`,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,fontWeight:700,color:C.accent}}>{selectedIds.size} selected</span>
                {canBulkSend&&<button onClick={bulkSend} disabled={bulkLoading} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 12px",borderRadius:8,border:"none",background:C.accent,color:"white",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:F}}><Ic n="send" s={11} c="white"/>{bulkLoading?"Sending…":"Bulk Send"}</button>}
                <button onClick={()=>setSelectedIds(new Set())} style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer"}}><Ic n="x" s={13} c={C.text3}/></button>
              </div>
            )}
            <div style={{flex:1,overflowY:"auto",padding:"12px 16px"}}>
              {loading?<div style={{textAlign:"center",padding:40,color:C.text3}}>Loading…</div>:filteredOffers.length===0?<div style={{textAlign:"center",padding:40,color:C.text3,fontSize:13}}>No offers yet.</div>:filteredOffers.map(o=>(
                <OfferCard key={o.id} offer={o} selected={selected?.id===o.id} selectable={true}
                  onSelect={(id,checked)=>setSelectedIds(prev=>{const next=new Set(prev);checked?next.add(id):next.delete(id);return next;})}
                  onClick={()=>{setSelected(o);setShowNew(false);}}
                />
              ))}
            </div>
          </>
        )}

        {mainTab==="templates"&&(
          <div style={{flex:1,overflowY:"auto",padding:"16px"}}>
            {templates.length===0?<div style={{textAlign:"center",padding:40,color:C.text3,fontSize:13}}>No templates yet. Create an offer and save it as a template.</div>:templates.map(t=>(
              <div key={t.id} style={{padding:"12px 14px",marginBottom:8,borderRadius:10,border:`1px solid ${C.border}`,background:C.surface}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><Ic n="star" s={12} c={C.amber}/><span style={{fontSize:13,fontWeight:700,color:C.text1}}>{t.name}</span>{t.shared&&<span style={{fontSize:10,color:C.green,fontWeight:700}}>shared</span>}</div>
                    <div style={{fontSize:12,color:C.text3}}>{fmt.currency(t.base_salary,t.currency)}{t.package_items?.length>0?` · ${t.package_items.length} benefits`:""}</div>
                  </div>
                  <button onClick={()=>handleDeleteTemplate(t.id)} style={{background:"none",border:"none",cursor:"pointer",padding:2}}><Ic n="trash" s={13} c={C.text3}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right panel */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0,position:"relative"}}>
        {showNew?(
          <NewOfferWizard environment={environment} session={session} onCreated={handleCreated} onCancel={()=>setShowNew(false)}/>
        ):selected?(
          <OfferDetail offer={selected} environment={environment} session={session} onClose={()=>setSelected(null)} onUpdate={handleUpdate} onRevise={handleRevise}/>
        ):(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",color:C.text3,gap:16}}>
            <div style={{width:60,height:60,borderRadius:18,background:C.accentLight,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n="gift" s={28} c={C.accent}/></div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:15,fontWeight:700,color:C.text1,marginBottom:4}}>Select an offer</div>
              <div style={{fontSize:13,color:C.text3}}>Choose from the list or create a new offer</div>
            </div>
            <button onClick={()=>setShowNew(true)} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 20px",borderRadius:10,border:"none",background:C.accent,color:"white",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:F}}><Ic n="plus" s={13} c="white"/> Create Offer</button>
          </div>
        )}
      </div>
    </div>
  );
}
