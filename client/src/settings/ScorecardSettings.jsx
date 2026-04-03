import { useState, useEffect, useCallback } from "react";
import api from "../apiClient.js";

const F = "var(--t-font,'Plus Jakarta Sans',sans-serif)";
const C = {
  accent:"var(--t-accent,#3b5bdb)", accentLight:"var(--t-accentLight,#eef2ff)",
  border:"var(--t-border,#e5e7eb)", surface:"var(--t-surface,#fff)",
  surface2:"var(--t-surface2,#f8fafc)", text1:"var(--t-text1,#111827)",
  text2:"var(--t-text2,#374151)", text3:"var(--t-text3,#9ca3af)",
  green:"#059669", greenLight:"#ecfdf5", red:"#ef4444", redLight:"#fef2f2", amber:"#d97706",
};
const RATING_SCALES = [
  { value:"five_point",  label:"1–5 Numeric",  desc:"Rate 1 (poor) to 5 (exceptional)" },
  { value:"named",       label:"Named Scale",   desc:"Exceptional / Strong / Meets / Below / Poor" },
  { value:"ten_point",   label:"1–10 Numeric",  desc:"Rate 1 (poor) to 10 (exceptional)" },
];
const Ic = ({ n, s=16, c="currentColor" }) => {
  const P = { plus:"M12 5v14M5 12h14", x:"M18 6L6 18M6 6l12 12", trash:"M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
    edit:"M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z",
    drag:"M9 5h2M9 12h2M9 19h2M13 5h2M13 12h2M13 19h2", check:"M20 6L9 17l-5-5", star:"M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01z" };
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={P[n]||P.star}/></svg>;
};
const Btn = ({ onClick, children, variant="secondary", disabled, small }) => {
  const styles = { primary:{background:C.accent,color:"#fff",border:"none"}, secondary:{background:C.surface2,color:C.text2,border:`1px solid ${C.border}`}, danger:{background:C.redLight,color:C.red,border:`1px solid ${C.red}40`} };
  return <button onClick={onClick} disabled={disabled} style={{...styles[variant],fontFamily:F,fontSize:small?11:13,fontWeight:600,padding:small?"4px 10px":"8px 16px",borderRadius:8,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.5:1,display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap"}}>{children}</button>;
};

function CompetencyRow({ comp, index, total, onChange, onRemove, onMoveUp, onMoveDown }) {
  return (
    <div style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"12px 14px",marginBottom:6,display:"flex",gap:10,alignItems:"flex-start"}}>
      <div style={{cursor:"grab",color:C.text3,paddingTop:2,flexShrink:0}}><Ic n="drag" s={14}/></div>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
        <div style={{display:"flex",gap:8}}>
          <input value={comp.name} onChange={e=>onChange({...comp,name:e.target.value})} placeholder="Competency name (e.g. Technical Depth)"
            style={{flex:2,padding:"7px 10px",borderRadius:7,border:`1px solid ${C.border}`,fontFamily:F,fontSize:13,outline:"none"}}/>
          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            <label style={{fontSize:11,color:C.text3,fontWeight:600}}>Weight</label>
            <input type="number" min={1} max={10} value={comp.weight||1} onChange={e=>onChange({...comp,weight:Number(e.target.value)})}
              style={{width:52,padding:"7px 8px",borderRadius:7,border:`1px solid ${C.border}`,fontFamily:F,fontSize:13,outline:"none",textAlign:"center"}}/>
          </div>
          <label style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:C.text2,cursor:"pointer",flexShrink:0}}>
            <input type="checkbox" checked={comp.required!==false} onChange={e=>onChange({...comp,required:e.target.checked})} style={{accentColor:C.accent}}/>Required
          </label>
        </div>
        <input value={comp.description||""} onChange={e=>onChange({...comp,description:e.target.value})} placeholder="Guidance for interviewers (optional)"
          style={{padding:"6px 10px",borderRadius:7,border:`1px solid ${C.border}`,fontFamily:F,fontSize:12,outline:"none",color:C.text2}}/>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:2,flexShrink:0}}>
        <button onClick={onMoveUp} disabled={index===0} style={{background:"none",border:"none",cursor:index===0?"default":"pointer",padding:2,opacity:index===0?0.3:1,fontSize:10}}>▲</button>
        <button onClick={onMoveDown} disabled={index===total-1} style={{background:"none",border:"none",cursor:index===total-1?"default":"pointer",padding:2,opacity:index===total-1?0.3:1,fontSize:10}}>▼</button>
        <button onClick={onRemove} style={{background:"none",border:"none",cursor:"pointer",padding:2,color:C.text3}} onMouseEnter={e=>e.currentTarget.style.color=C.red} onMouseLeave={e=>e.currentTarget.style.color=C.text3}><Ic n="x" s={13}/></button>
      </div>
    </div>
  );
}

function TemplateModal({ template, interviewTypes, environment, onSave, onClose }) {
  const isNew = !template?.id;
  const [form, setForm] = useState({
    name:template?.name||"", description:template?.description||"",
    interview_type_id:template?.interview_type_id||"", rating_scale:template?.rating_scale||"five_point",
    competencies:template?.competencies?.length>0?template.competencies:[
      {id:"c1",name:"Communication",description:"Clarity, structure, listening",weight:1,required:true},
      {id:"c2",name:"Technical Knowledge",description:"Depth and accuracy of technical answers",weight:2,required:true},
      {id:"c3",name:"Problem Solving",description:"Analytical approach and creativity",weight:2,required:true},
      {id:"c4",name:"Culture Fit",description:"Alignment with team values",weight:1,required:false},
    ],
  });
  const [saving,setSaving]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const addComp=()=>setForm(f=>({...f,competencies:[...f.competencies,{id:`c_${Date.now()}`,name:"",description:"",weight:1,required:true}]}));
  const updComp=(i,v)=>setForm(f=>{const c=[...f.competencies];c[i]=v;return{...f,competencies:c};});
  const remComp=(i)=>setForm(f=>({...f,competencies:f.competencies.filter((_,j)=>j!==i)}));
  const movComp=(i,d)=>setForm(f=>{const c=[...f.competencies];const j=i+d;if(j<0||j>=c.length)return f;[c[i],c[j]]=[c[j],c[i]];return{...f,competencies:c};});
  const handleSave=async()=>{
    if(!form.name.trim())return; setSaving(true);
    try{ const res=isNew?await api.post("/scorecards/templates",{...form,environment_id:environment?.id}):await api.put(`/scorecards/templates/${template.id}`,form); onSave(res); }
    finally{setSaving(false);}
  };
  return (
    <div style={{position:"fixed",inset:0,zIndex:1200,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center"}} onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:680,maxHeight:"88vh",background:C.surface,borderRadius:16,display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,.18)"}}>
        <div style={{padding:"20px 24px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontFamily:F,fontWeight:800,fontSize:16,color:C.text1}}>{isNew?"New Scorecard Template":"Edit Template"}</div>
            <div style={{fontSize:12,color:C.text3,marginTop:2}}>Define competencies and rating scale for structured feedback</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:C.text3,lineHeight:1}}>×</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <div>
              <label style={{fontFamily:F,fontSize:11,fontWeight:700,color:C.text3,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>Template Name *</label>
              <input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. Technical Interview"
                style={{width:"100%",padding:"9px 12px",borderRadius:9,border:`1.5px solid ${C.border}`,fontFamily:F,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div>
              <label style={{fontFamily:F,fontSize:11,fontWeight:700,color:C.text3,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>Linked Interview Type</label>
              <select value={form.interview_type_id} onChange={e=>set("interview_type_id",e.target.value)}
                style={{width:"100%",padding:"9px 12px",borderRadius:9,border:`1.5px solid ${C.border}`,fontFamily:F,fontSize:13,outline:"none",background:C.surface}}>
                <option value="">Any interview type</option>
                {interviewTypes.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{marginBottom:16}}>
            <label style={{fontFamily:F,fontSize:11,fontWeight:700,color:C.text3,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>Rating Scale</label>
            <div style={{display:"flex",gap:8}}>
              {RATING_SCALES.map(s=>(
                <div key={s.value} onClick={()=>set("rating_scale",s.value)} style={{flex:1,padding:"10px 12px",borderRadius:10,border:`1.5px solid ${form.rating_scale===s.value?C.accent:C.border}`,background:form.rating_scale===s.value?C.accentLight:C.surface,cursor:"pointer"}}>
                  <div style={{fontFamily:F,fontWeight:700,fontSize:12,color:form.rating_scale===s.value?C.accent:C.text2}}>{s.label}</div>
                  <div style={{fontFamily:F,fontSize:11,color:C.text3,marginTop:3}}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <label style={{fontFamily:F,fontSize:11,fontWeight:700,color:C.text3,textTransform:"uppercase",letterSpacing:"0.06em"}}>Competencies ({form.competencies.length})</label>
              <Btn onClick={addComp} small variant="secondary"><Ic n="plus" s={12}/>Add</Btn>
            </div>
            {form.competencies.map((c,i)=><CompetencyRow key={c.id||i} comp={c} index={i} total={form.competencies.length} onChange={v=>updComp(i,v)} onRemove={()=>remComp(i)} onMoveUp={()=>movComp(i,-1)} onMoveDown={()=>movComp(i,1)}/>)}
          </div>
        </div>
        <div style={{padding:"14px 24px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"flex-end",gap:8}}>
          <Btn onClick={onClose} variant="secondary">Cancel</Btn>
          <Btn onClick={handleSave} variant="primary" disabled={!form.name.trim()||saving}>{saving?"Saving…":isNew?"Create Template":"Save Changes"}</Btn>
        </div>
      </div>
    </div>
  );
}

export default function ScorecardSettings({ environment }) {
  const [templates,setTemplates]=useState([]);
  const [interviewTypes,setInterviewTypes]=useState([]);
  const [loading,setLoading]=useState(true);
  const [editing,setEditing]=useState(null);
  const [deleting,setDeleting]=useState(null);
  const load=useCallback(async()=>{
    if(!environment?.id)return; setLoading(true);
    const[tmpl,types]=await Promise.all([
      api.get(`/scorecards/templates?environment_id=${environment.id}`).catch(()=>[]),
      api.get(`/interview-types?environment_id=${environment.id}`).catch(()=>[]),
    ]);
    setTemplates(Array.isArray(tmpl)?tmpl:[]);
    setInterviewTypes(Array.isArray(types)?types:[]);
    setLoading(false);
  },[environment?.id]);
  useEffect(()=>{load();},[load]);
  const handleSave=async()=>{await load();setEditing(null);};
  const handleDelete=async(id)=>{await api.delete(`/scorecards/templates/${id}`);setTemplates(t=>t.filter(x=>x.id!==id));setDeleting(null);};
  const getTypeName=id=>interviewTypes.find(t=>t.id===id)?.name||"Any type";
  const scaleLabel=v=>RATING_SCALES.find(s=>s.value===v)?.label||v;
  if(loading)return<div style={{padding:40,textAlign:"center",color:C.text3,fontFamily:F}}>Loading…</div>;
  return(
    <div style={{fontFamily:F}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <div style={{fontWeight:800,fontSize:18,color:C.text1}}>Scorecard Templates</div>
          <div style={{fontSize:13,color:C.text3,marginTop:3}}>Structured feedback forms for each interview type</div>
        </div>
        <Btn onClick={()=>setEditing({})} variant="primary"><Ic n="plus" s={14}/>New Template</Btn>
      </div>
      {templates.length===0?(
        <div style={{border:`1.5px dashed ${C.border}`,borderRadius:14,padding:"48px 32px",textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:12}}>📋</div>
          <div style={{fontWeight:700,fontSize:15,color:C.text1,marginBottom:6}}>No scorecard templates yet</div>
          <div style={{fontSize:13,color:C.text3,marginBottom:20}}>Create templates to standardise interview feedback</div>
          <Btn onClick={()=>setEditing({})} variant="primary"><Ic n="plus" s={14}/>Create First Template</Btn>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {templates.map(t=>(
            <div key={t.id} style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"16px 18px",display:"flex",alignItems:"flex-start",gap:14}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <span style={{fontWeight:700,fontSize:14,color:C.text1}}>{t.name}</span>
                  {t.interview_type_id&&<span style={{fontSize:11,fontWeight:600,background:C.accentLight,color:C.accent,padding:"2px 8px",borderRadius:99}}>{getTypeName(t.interview_type_id)}</span>}
                  <span style={{fontSize:11,color:C.text3,background:C.surface2,padding:"2px 8px",borderRadius:99,border:`1px solid ${C.border}`}}>{scaleLabel(t.rating_scale)}</span>
                </div>
                {t.description&&<div style={{fontSize:12,color:C.text3,marginBottom:8}}>{t.description}</div>}
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {(t.competencies||[]).map(c=><span key={c.id} style={{fontSize:11,background:C.surface2,border:`1px solid ${C.border}`,borderRadius:99,padding:"2px 8px",color:C.text2,fontWeight:c.required?600:400}}>{c.name}{c.weight>1?` ×${c.weight}`:""}</span>)}
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <Btn onClick={()=>setEditing(t)} small variant="secondary"><Ic n="edit" s={12}/>Edit</Btn>
                <Btn onClick={()=>setDeleting(t.id)} small variant="danger"><Ic n="trash" s={12}/></Btn>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing&&<TemplateModal template={editing.id?editing:null} interviewTypes={interviewTypes} environment={environment} onSave={handleSave} onClose={()=>setEditing(null)}/>}
      {deleting&&(
        <div style={{position:"fixed",inset:0,zIndex:1300,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:C.surface,borderRadius:14,padding:28,width:380,boxShadow:"0 20px 60px rgba(0,0,0,.18)"}}>
            <div style={{fontWeight:700,fontSize:15,color:C.text1,marginBottom:8}}>Delete template?</div>
            <div style={{fontSize:13,color:C.text3,marginBottom:20}}>Existing submitted scorecards won't be affected.</div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <Btn onClick={()=>setDeleting(null)} variant="secondary">Cancel</Btn>
              <Btn onClick={()=>handleDelete(deleting)} variant="danger">Delete</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
