#!/usr/bin/env node
// Feature 1: Multi-step form builder
const fs = require('fs'), path = require('path');
const portalsPath  = path.join(__dirname, 'client/src/Portals.jsx');
const rendererPath = path.join(__dirname, 'client/src/portals/PortalPageRenderer.jsx');
let portals  = fs.readFileSync(portalsPath,  'utf8');
let renderer = fs.readFileSync(rendererPath, 'utf8');

// 1. Add widget type
if (!portals.includes('multistep_form')) {
  portals = portals.replace(
    `  { type:"hm_profile",label:"HM Profile", icon:"user-check",desc:"Person cards with CTA" },`,
    `  { type:"hm_profile",   label:"HM Profile",    icon:"user-check",  desc:"Person cards with CTA" },\n  { type:"multistep_form",label:"Multi-step Form",icon:"layers",      desc:"Step-by-step form with validation" },`
  );
  console.log('✓ Widget type added');
} else { console.log('  (multistep_form already present)'); }

// 2. Add icon
if (!portals.includes('"layers"')) {
  portals = portals.replace(
    `    "user-check":"M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM22 11l2 2 4-4",`,
    `    "user-check":"M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM22 11l2 2 4-4",\n    layers:"M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",`
  );
}

// 3. Add config case
if (!portals.includes('MultistepFormConfig')) {
  portals = portals.replace(
    `      default: return <p style={{ fontSize:12, color:C.text3, margin:0 }}>No settings for this widget.</p>;`,
    `      case "multistep_form": return <MultistepFormConfig cfg={cfg} set={set} inp={inp} lbl={lbl}/>;
      default: return <p style={{ fontSize:12, color:C.text3, margin:0 }}>No settings for this widget.</p>;`
  );
}

// 4. Add MultistepFormConfig component before WidgetConfigPanel
if (!portals.includes('const FIELD_TYPES =')) {
  const comp = `
// ─── Multi-step Form Config ────────────────────────────────────────────────────
const FIELD_TYPES = [
  { value:"text", label:"Short text" }, { value:"email", label:"Email" },
  { value:"phone", label:"Phone" }, { value:"textarea", label:"Long text" },
  { value:"select", label:"Dropdown" }, { value:"radio", label:"Radio" },
  { value:"checkbox", label:"Checkboxes" }, { value:"date", label:"Date" },
  { value:"file", label:"File upload" },
];
const defaultStep  = (n) => ({ id:Math.random().toString(36).slice(2), title:\`Step \${n}\`, fields:[] });
const defaultField = ()  => ({ id:Math.random().toString(36).slice(2), type:"text", label:"", placeholder:"", required:false, options:"" });

const MultistepFormConfig = ({ cfg, set, inp, lbl }) => {
  const [activeStep, setActiveStep] = useState(0);
  const steps = cfg.steps || [defaultStep(1)];
  const setSteps = (s) => set("steps", s);
  const addStep = () => setSteps([...steps, defaultStep(steps.length+1)]);
  const removeStep = (i) => { const s=[...steps]; s.splice(i,1); setSteps(s); if(activeStep>=s.length) setActiveStep(Math.max(0,s.length-1)); };
  const updateStep = (i,p) => { const s=[...steps]; s[i]={...s[i],...p}; setSteps(s); };
  const addField = () => { const s=[...steps]; s[activeStep]={...s[activeStep],fields:[...(s[activeStep].fields||[]),defaultField()]}; setSteps(s); };
  const removeField = (fi) => { const s=[...steps]; const f=[...s[activeStep].fields]; f.splice(fi,1); s[activeStep]={...s[activeStep],fields:f}; setSteps(s); };
  const updateField = (fi,p) => { const s=[...steps]; const f=[...s[activeStep].fields]; f[fi]={...f[fi],...p}; s[activeStep]={...s[activeStep],fields:f}; setSteps(s); };
  const step = steps[activeStep]||steps[0];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div>{lbl("Form title")}<input value={cfg.formTitle||""} onChange={e=>set("formTitle",e.target.value)} placeholder="Application Form" style={inp}/></div>
      <div>{lbl("Submit button text")}<input value={cfg.submitText||""} onChange={e=>set("submitText",e.target.value)} placeholder="Submit" style={inp}/></div>
      <div>{lbl("Success message")}<input value={cfg.successMessage||""} onChange={e=>set("successMessage",e.target.value)} placeholder="Thank you! We'll be in touch." style={inp}/></div>
      <div style={{borderTop:\`1px solid \${C.border}\`,paddingTop:14}}>
        {lbl("Steps")}
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>
          {steps.map((s,i)=>(
            <button key={s.id} onClick={()=>setActiveStep(i)} style={{padding:"4px 10px",borderRadius:6,border:"1.5px solid",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:F,borderColor:i===activeStep?"#4361EE":"#E8ECF8",background:i===activeStep?"#EEF2FF":"transparent",color:i===activeStep?"#4361EE":"#6B7280"}}>{s.title}</button>
          ))}
          <button onClick={addStep} style={{padding:"4px 8px",borderRadius:6,border:"1.5px dashed #E8ECF8",background:"transparent",cursor:"pointer",color:"#9CA3AF",fontSize:11,fontFamily:F}}>+ Step</button>
        </div>
        {step&&(
          <div style={{background:C.surface2,borderRadius:10,padding:12}}>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <input value={step.title} onChange={e=>updateStep(activeStep,{title:e.target.value})} placeholder="Step title" style={{...inp,flex:1,background:"#fff",fontSize:12,padding:"5px 8px"}}/>
              {steps.length>1&&<button onClick={()=>removeStep(activeStep)} style={{padding:"4px 8px",borderRadius:6,border:"1px solid #FCA5A5",background:"#FEF2F2",cursor:"pointer",color:"#EF4444",fontSize:11}}>Remove</button>}
            </div>
            {(step.fields||[]).map((f,fi)=>(
              <div key={f.id} style={{background:"#fff",borderRadius:8,padding:"10px 12px",marginBottom:8,border:"1px solid #E8ECF8"}}>
                <div style={{display:"flex",gap:6,marginBottom:6}}>
                  <select value={f.type} onChange={e=>updateField(fi,{type:e.target.value})} style={{...inp,flex:"0 0 130px",fontSize:11,padding:"4px 6px",background:"#F8F9FC"}}>
                    {FIELD_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <input value={f.label} onChange={e=>updateField(fi,{label:e.target.value})} placeholder="Field label" style={{...inp,flex:1,fontSize:11,padding:"4px 8px"}}/>
                  <button onClick={()=>removeField(fi)} style={{background:"none",border:"none",cursor:"pointer",color:"#EF4444",fontSize:14,padding:"0 4px"}}>✕</button>
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <input value={f.placeholder||""} onChange={e=>updateField(fi,{placeholder:e.target.value})} placeholder="Placeholder" style={{...inp,flex:1,fontSize:11,padding:"4px 8px"}}/>
                  <label style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#6B7280",flexShrink:0,cursor:"pointer"}}>
                    <input type="checkbox" checked={!!f.required} onChange={e=>updateField(fi,{required:e.target.checked})} style={{width:13,height:13}}/>Required
                  </label>
                </div>
                {(f.type==="select"||f.type==="radio"||f.type==="checkbox")&&(
                  <input value={f.options||""} onChange={e=>updateField(fi,{options:e.target.value})} placeholder="Options, comma separated" style={{...inp,marginTop:6,fontSize:11,padding:"4px 8px"}}/>
                )}
              </div>
            ))}
            <button onClick={addField} style={{width:"100%",padding:"6px",borderRadius:8,border:"1.5px dashed #E8ECF8",background:"transparent",cursor:"pointer",fontSize:11,color:"#9CA3AF",fontFamily:F}}>+ Add field</button>
          </div>
        )}
      </div>
    </div>
  );
};

`;
  portals = portals.replace(
    `// ─── Widget Config Panel ──────────────────────────────────────────────────────`,
    comp + `// ─── Widget Config Panel ──────────────────────────────────────────────────────`
  );
}

// 5. Add preview
if (!portals.includes('multistep_form') || !portals.includes('Step-by-step preview')) {
  portals = portals.replace(
    `  if (cell.widgetType==="job_list") return (`,
    `  if (cell.widgetType==="multistep_form") {
    const steps = cfg.steps||[{title:"Step 1"},{title:"Step 2"},{title:"Step 3"}];
    return (<div style={{padding:"14px 20px",fontFamily:t.fontFamily}}>
      {cfg.formTitle&&<div style={{fontSize:14,fontWeight:700,color:t.textColor,marginBottom:10}}>{cfg.formTitle}</div>}
      <div style={{display:"flex",gap:0,marginBottom:10}}>
        {steps.map((s,i)=>(<div key={i} style={{flex:1,textAlign:"center"}}>
          <div style={{width:22,height:22,borderRadius:"50%",margin:"0 auto 3px",display:"flex",alignItems:"center",justifyContent:"center",background:i===0?t.primaryColor:C.border,color:i===0?"white":C.text3,fontSize:10,fontWeight:700}}>{i+1}</div>
          <div style={{fontSize:9,color:i===0?t.primaryColor:C.text3}}>{s.title}</div>
        </div>))}
      </div>
      <div style={{height:4,background:C.surface2,borderRadius:2,overflow:"hidden",marginBottom:10}}>
        <div style={{width:"33%",height:"100%",background:t.primaryColor,borderRadius:2}}/>
      </div>
      {["Name","Email"].map(f=>(<div key={f} style={{marginBottom:6}}><div style={{fontSize:10,fontWeight:600,color:C.text3,marginBottom:2}}>{f}</div><div style={{height:24,borderRadius:t.borderRadius||6,border:\`1px solid \${C.border}\`,background:C.surface2}}/></div>))}
      <div style={{marginTop:8,display:"flex",justifyContent:"flex-end"}}><div style={{padding:"5px 14px",borderRadius:t.buttonRadius||6,background:t.primaryColor,color:"white",fontSize:10,fontWeight:700}}>Next →</div></div>
    </div>); }

  if (cell.widgetType==="job_list") return (`
  );
}

fs.writeFileSync(portalsPath, portals);

// 6. Add MultistepFormWidget to renderer
if (!renderer.includes('MultistepFormWidget')) {
  const widget = `
const MultistepFormWidget = ({ cfg, theme, portal, api, track }) => {
  const steps = cfg.steps||[];
  const [currentStep,setCurrentStep]=useState(0);
  const [values,setValues]=useState({});
  const [errors,setErrors]=useState({});
  const [done,setDone]=useState(false);
  const [submitting,setSub]=useState(false);
  const step=steps[currentStep]; const isLast=currentStep===steps.length-1;
  const btnStyle=getButtonStyle(theme);
  const setValue=(id,val)=>setValues(v=>({...v,[id]:val}));
  const validate=()=>{const e={};(step?.fields||[]).forEach(f=>{if(f.required&&!values[f.id])e[f.id]='Required';if(f.type==='email'&&values[f.id]&&!/\\S+@\\S+\\.\\S+/.test(values[f.id]))e[f.id]='Invalid email';});setErrors(e);return!Object.keys(e).length;};
  const handleNext=()=>{if(!validate())return;if(currentStep===0)track&&track('form_start',{form:cfg.formTitle});if(isLast)handleSubmit();else setCurrentStep(s=>s+1);};
  const handleSubmit=async()=>{if(!validate())return;setSub(true);try{const fm={};steps.forEach(s=>s.fields?.forEach(f=>{fm[f.id]=f.label;}));const nv=Object.fromEntries(Object.entries(values).map(([k,v])=>[fm[k]||k,v]));if(portal?.id){await api.post(\`/portals/\${portal.id}/apply\`,{first_name:values[steps[0]?.fields?.find(f=>f.type==='text'&&f.label?.toLowerCase().includes('first'))?.id]||'',last_name:values[steps[0]?.fields?.find(f=>f.type==='text'&&f.label?.toLowerCase().includes('last'))?.id]||'',email:values[steps.flatMap(s=>s.fields||[]).find(f=>f.type==='email')?.id]||'',cover_note:JSON.stringify(nv,null,2)}).catch(()=>{});}track&&track('form_complete',{form:cfg.formTitle});setDone(true);}catch{}setSub(false);};
  if(done)return(<div style={{textAlign:'center',padding:'48px 24px'}}><Icon path={ICONS.check} size={56} color={theme.primaryColor} style={{marginBottom:16}}/><h3 style={{fontSize:22,fontWeight:800,color:theme.textColor||'#0F1729',margin:'0 0 8px',fontFamily:theme.headingFont||theme.fontFamily}}>{cfg.successMessage||"Thank you! We'll be in touch."}</h3></div>);
  if(!steps.length)return(<div style={{padding:'32px 24px',textAlign:'center',color:theme.textColor||'#9CA3AF',opacity:0.5,fontFamily:theme.fontFamily}}>No form steps configured.</div>);
  const progress=Math.round((currentStep/steps.length)*100);
  return(<div style={{maxWidth:560,margin:'0 auto',fontFamily:theme.fontFamily}}>
    {cfg.formTitle&&<h2 style={{margin:'0 0 20px',fontSize:24,fontWeight:theme.headingWeight||700,color:theme.textColor||'#0F1729',fontFamily:theme.headingFont||theme.fontFamily}}>{cfg.formTitle}</h2>}
    {steps.length>1&&(<div style={{marginBottom:24}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
        {steps.map((s,i)=>(<div key={i} style={{flex:1,textAlign:'center',position:'relative'}}>
          {i>0&&<div style={{position:'absolute',top:12,right:'50%',left:'-50%',height:2,background:i<=currentStep?theme.primaryColor:'#E8ECF8',zIndex:0}}/>}
          <div style={{width:26,height:26,borderRadius:'50%',margin:'0 auto 5px',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',zIndex:1,background:i<currentStep?theme.primaryColor:i===currentStep?theme.primaryColor:'#E8ECF8',color:i<=currentStep?'#fff':'#9CA3AF',fontSize:11,fontWeight:700}}>{i<currentStep?'✓':i+1}</div>
          <div style={{fontSize:11,color:i===currentStep?theme.primaryColor:'#9CA3AF',fontWeight:i===currentStep?700:400}}>{s.title}</div>
        </div>))}
      </div>
      <div style={{height:4,background:'#E8ECF8',borderRadius:2,overflow:'hidden'}}>
        <div style={{width:progress+'%',height:'100%',background:theme.primaryColor,borderRadius:2,transition:'width .3s'}}/>
      </div>
    </div>)}
    <div style={{marginBottom:20}}>
      {(step?.fields||[]).map(f=>{const err=errors[f.id];const val=values[f.id]||'';const opts=(f.options||'').split(',').map(o=>o.trim()).filter(Boolean);const fi={width:'100%',padding:'10px 14px',borderRadius:theme.borderRadius||8,border:\`1.5px solid \${err?'#EF4444':'#E8ECF8'}\`,fontSize:14,fontFamily:theme.fontFamily,outline:'none',boxSizing:'border-box',color:theme.textColor||'#0F1729',marginTop:4};
        return(<div key={f.id} style={{marginBottom:14}}>
          <label style={{fontSize:13,fontWeight:600,color:theme.textColor||'#374151',fontFamily:theme.fontFamily,display:'block'}}>{f.label}{f.required&&<span style={{color:'#EF4444',marginLeft:2}}>*</span>}</label>
          {f.type==='textarea'&&<textarea value={val} onChange={e=>setValue(f.id,e.target.value)} placeholder={f.placeholder} rows={3} style={{...fi,resize:'vertical'}}/>}
          {f.type==='select'&&<select value={val} onChange={e=>setValue(f.id,e.target.value)} style={fi}><option value="">Select…</option>{opts.map(o=><option key={o}>{o}</option>)}</select>}
          {f.type==='radio'&&<div style={{marginTop:6}}>{opts.map(o=><label key={o} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,fontSize:13,color:theme.textColor||'#374151',cursor:'pointer'}}><input type="radio" name={f.id} value={o} checked={val===o} onChange={()=>setValue(f.id,o)}/>{o}</label>)}</div>}
          {f.type==='checkbox'&&<div style={{marginTop:6}}>{opts.map(o=><label key={o} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,fontSize:13,color:theme.textColor||'#374151',cursor:'pointer'}}><input type="checkbox" checked={(val||[]).includes(o)} onChange={e=>{const c=val||[];setValue(f.id,e.target.checked?[...c,o]:c.filter(x=>x!==o));}}/>{o}</label>)}</div>}
          {f.type==='file'&&<input type="file" onChange={e=>setValue(f.id,e.target.files[0]?.name)} style={{...fi,padding:'8px'}}/>}
          {!['textarea','select','radio','checkbox','file'].includes(f.type)&&<input type={f.type} value={val} onChange={e=>setValue(f.id,e.target.value)} placeholder={f.placeholder} style={fi}/>}
          {err&&<div style={{fontSize:11,color:'#EF4444',marginTop:3}}>{err}</div>}
        </div>);
      })}
    </div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      {currentStep>0?<button onClick={()=>setCurrentStep(s=>s-1)} style={{background:'none',border:'none',cursor:'pointer',color:theme.primaryColor,fontWeight:600,fontSize:14,fontFamily:theme.fontFamily,display:'flex',alignItems:'center',gap:6}}><Icon path={ICONS.arrowLeft} size={14} color={theme.primaryColor}/> Back</button>:<div/>}
      <button onClick={handleNext} disabled={submitting} style={{...btnStyle,border:'none',cursor:'pointer',fontFamily:theme.fontFamily,fontSize:14,fontWeight:700,opacity:submitting?0.6:1}}>{submitting?'Submitting…':isLast?(cfg.submitText||'Submit'):'Next →'}</button>
    </div>
  </div>);
};

`;
  renderer = renderer.replace(`const Widget = ({ cell, theme, portal, api }) => {`, widget + `const Widget = ({ cell, theme, portal, api }) => {`);
  renderer = renderer.replace(
    `    case 'hm_profile':    return <HMProfileWidget    cfg={cfg} theme={theme} portal={portal} api={api}/>`,
    `    case 'hm_profile':    return <HMProfileWidget    cfg={cfg} theme={theme} portal={portal} api={api}/>\n    case 'multistep_form':return <MultistepFormWidget cfg={cfg} theme={theme} portal={portal} api={api} track={track}/>`
  );
  // Add track prop to Widget
  renderer = renderer.replace(
    `const Widget = ({ cell, theme, portal, api }) => {`,
    `const Widget = ({ cell, theme, portal, api, track }) => {`
  );
}

fs.writeFileSync(rendererPath, renderer);
console.log('✅ F1 multistep form done');
