#!/usr/bin/env node
// F3: Section Library | F4: Analytics | F5: Conditional visibility
const fs = require('fs'), path = require('path');
const portalsPath  = path.join(__dirname, 'client/src/Portals.jsx');
const rendererPath = path.join(__dirname, 'client/src/portals/PortalPageRenderer.jsx');
const indexPath    = path.join(__dirname, 'server/index.js');

// ── F3: Section Library ───────────────────────────────────────────────────────
let portals = fs.readFileSync(portalsPath, 'utf8');

if (!portals.includes('SECTION_LIBRARY')) {
  // Add library icon
  if (!portals.includes('"library"')) {
    portals = portals.replace(
      `    "user-check":`,
      `    library:"M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5z",\n    "user-check":`
    );
  }

  const sectionLib = `
const uid2=()=>Math.random().toString(36).slice(2,10);
const mk=(preset,cells,bg,pad)=>({id:uid2(),preset,bgColor:bg||"",bgImage:"",overlayOpacity:0,padding:pad||"lg",cells});
const mkcell=(type,cfg)=>({id:uid2(),widgetType:type,widgetConfig:cfg||{}});
const SECTION_LIBRARY=[
  {category:"Hero",sections:[
    {id:"hero-c",name:"Centred Hero",preview:[{type:"hero",w:"full"}],row:()=>mk("1",[mkcell("hero",{headline:"Find Your Next Opportunity",subheading:"Join a team building something meaningful.",ctaText:"See Open Roles",ctaHref:"#jobs"})],"","xl")},
    {id:"hero-dark",name:"Dark Hero",preview:[{type:"hero",w:"full",dark:true}],row:()=>mk("1",[mkcell("hero",{headline:"Join Our Team",subheading:"We're hiring across engineering, product and design.",ctaText:"View Roles",ctaHref:"#jobs"})],"#0F1729","xl")},
    {id:"hero-split",name:"Split Hero + Image",preview:[{type:"text",w:"half"},{type:"image",w:"half"}],row:()=>mk("2",[mkcell("text",{heading:"We're hiring for the future",content:"Join a fast-moving team where your work ships to millions."}),mkcell("image",{})],"","xl")},
  ]},
  {category:"Jobs",sections:[
    {id:"jobs-full",name:"Full Job Board",preview:[{type:"jobs",w:"full"}],row:()=>mk("1",[mkcell("jobs",{heading:"Open Positions"})])},
    {id:"jobs-featured",name:"Featured Roles",preview:[{type:"job_list",w:"full"}],row:()=>mk("1",[mkcell("job_list",{heading:"Featured Roles",limit:5})],"#F8F9FF")},
  ]},
  {category:"Stats",sections:[
    {id:"stats-3",name:"3 Stats",preview:[{type:"stats",w:"full"}],row:()=>mk("1",[mkcell("stats",{stats:[{value:"500+",label:"Team Members"},{value:"12",label:"Offices"},{value:"4.8★",label:"Glassdoor"}]})],"#F8F9FF","md")},
    {id:"stats-4",name:"4 Stats",preview:[{type:"stats",w:"full"}],row:()=>mk("1",[mkcell("stats",{stats:[{value:"500+",label:"Employees"},{value:"12",label:"Offices"},{value:"40+",label:"Nationalities"},{value:"4.8★",label:"Glassdoor"}]})],"","md")},
  ]},
  {category:"Content",sections:[
    {id:"text-img",name:"Text + Image",preview:[{type:"text",w:"half"},{type:"image",w:"half"}],row:()=>mk("2",[mkcell("text",{heading:"Why work with us?",content:"We believe great work happens when talented people have the freedom to do their best."}),mkcell("image",{})])},
    {id:"img-text",name:"Image + Text",preview:[{type:"image",w:"half"},{type:"text",w:"half"}],row:()=>mk("2",[mkcell("image",{}),mkcell("text",{heading:"Our Culture",content:"We move fast, stay curious, and support each other every step of the way."})])},
    {id:"two-text",name:"Two Columns",preview:[{type:"text",w:"half"},{type:"text",w:"half"}],row:()=>mk("2",[mkcell("text",{heading:"Our Mission",content:"Making hiring human — fairer processes, clearer communication, faster decisions."}),mkcell("text",{heading:"Our Values",content:"Trust. Speed. Ownership. We hold ourselves to high standards."})])},
    {id:"full-text",name:"Full Width Text",preview:[{type:"text",w:"full"}],row:()=>mk("1",[mkcell("text",{heading:"About Us",content:"We're a fast-growing company united by a shared belief that work should be meaningful."})])},
  ]},
  {category:"Team",sections:[
    {id:"team-grid",name:"Team Grid",preview:[{type:"team",w:"full"}],row:()=>mk("1",[mkcell("team",{heading:"Meet the Team"})],"#F8F9FF")},
    {id:"hm-prof",name:"HM Profile Cards",preview:[{type:"hm_profile",w:"full"}],row:()=>mk("1",[mkcell("hm_profile",{heading:"Meet Your Hiring Team",ctaText:"Schedule a call"})])},
  ]},
  {category:"CTA",sections:[
    {id:"cta-dark",name:"Dark CTA Banner",preview:[{type:"text",w:"full",dark:true}],row:()=>mk("1",[mkcell("text",{heading:"Ready to apply?",content:"We review every application carefully. Our team will be in touch within 5 business days."})],"#0F1729")},
    {id:"cta-light",name:"Light CTA Banner",preview:[{type:"text",w:"full",accent:true}],row:()=>mk("1",[mkcell("text",{heading:"Don't see the right role?",content:"Send us your CV — we're always looking for talented people."})],"#EEF2FF")},
  ]},
  {category:"Forms",sections:[
    {id:"form-simple",name:"Application Form",preview:[{type:"form",w:"full"}],row:()=>mk("1",[mkcell("form",{title:"Apply Now"})])},
    {id:"form-multi",name:"Multi-step Application",preview:[{type:"multistep_form",w:"full"}],row:()=>mk("1",[mkcell("multistep_form",{formTitle:"Application Form",submitText:"Submit",successMessage:"Thank you! We'll be in touch.",steps:[
      {id:uid2(),title:"About You",fields:[{id:uid2(),type:"text",label:"First name",placeholder:"Jane",required:true},{id:uid2(),type:"text",label:"Last name",placeholder:"Smith",required:true},{id:uid2(),type:"email",label:"Email",placeholder:"jane@…",required:true},{id:uid2(),type:"phone",label:"Phone",required:false}]},
      {id:uid2(),title:"Experience",fields:[{id:uid2(),type:"text",label:"Current role",placeholder:"Senior Engineer",required:false},{id:uid2(),type:"select",label:"Years of experience",options:"0-2,3-5,6-10,10+",required:true},{id:uid2(),type:"textarea",label:"Why do you want to join?",placeholder:"Tell us…",required:true}]},
      {id:uid2(),title:"Documents",fields:[{id:uid2(),type:"file",label:"Upload CV",required:true},{id:uid2(),type:"textarea",label:"Anything else?",placeholder:"Optional…",required:false}]},
    ]})]) }),
  ]},
];

const SectionLibrary = ({ onInsert, onClose }) => {
  const [cat,setCat]=useState(SECTION_LIBRARY[0].category);
  const [hov,setHov]=useState(null);
  const category=SECTION_LIBRARY.find(c=>c.category===cat);
  const PBlock=({type,w,dark,accent})=>{const colors={hero:"#4361EE",text:"#E8ECF8",image:"#DDD",stats:"#EEF2FF",jobs:"#F0FDF4",job_list:"#F0FDF4",form:"#FEF9EE",team:"#FAF5FF",hm_profile:"#F0F9FF",multistep_form:"#FFF5F5"};return(<div style={{flex:w==="full"?1:"",width:w==="half"?"50%":"100%",height:24,borderRadius:4,background:dark?"#0F1729":accent?"#EEF2FF":(colors[type]||"#E8ECF8"),display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:7,color:dark?"rgba(255,255,255,.5)":"rgba(0,0,0,.3)",fontWeight:600}}>{type.replace("_"," ")}</span></div>);};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,41,.45)",zIndex:850,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:C.surface,borderRadius:16,width:680,maxWidth:"100%",height:"80vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 64px rgba(0,0,0,.2)",overflow:"hidden"}}>
        <div style={{padding:"16px 20px",borderBottom:\`1px solid \${C.border}\`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}><Ic n="library" s={15} c={C.accent}/><span style={{fontSize:15,fontWeight:800,color:C.text1}}>Section Library</span></div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.text3}}><Ic n="x" s={16}/></button>
        </div>
        <div style={{display:"flex",flex:1,overflow:"hidden"}}>
          <div style={{width:150,borderRight:\`1px solid \${C.border}\`,padding:"10px 8px",overflowY:"auto",flexShrink:0}}>
            {SECTION_LIBRARY.map(c=>(<button key={c.category} onClick={()=>setCat(c.category)} style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"none",background:cat===c.category?C.accentLight:"transparent",color:cat===c.category?C.accent:C.text2,fontSize:12,fontWeight:cat===c.category?700:500,cursor:"pointer",fontFamily:F,textAlign:"left",marginBottom:2}}>{c.category}</button>))}
          </div>
          <div style={{flex:1,padding:"12px 14px",overflowY:"auto"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {(category?.sections||[]).map(sec=>(<div key={sec.id} onClick={()=>{onInsert(sec.row());onClose();}} onMouseEnter={()=>setHov(sec.id)} onMouseLeave={()=>setHov(null)} style={{borderRadius:10,border:\`1.5px solid \${hov===sec.id?C.accent:C.border}\`,background:hov===sec.id?C.accentLight:C.surface2,cursor:"pointer",overflow:"hidden",transition:"all .12s"}}>
                <div style={{padding:"10px 10px 6px",display:"flex",gap:4,flexWrap:"wrap"}}>{sec.preview.map((p,i)=><PBlock key={i} {...p}/>)}</div>
                <div style={{padding:"5px 10px 9px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:12,fontWeight:600,color:hov===sec.id?C.accent:C.text1}}>{sec.name}</span>{hov===sec.id&&<span style={{fontSize:10,color:C.accent,fontWeight:700}}>Insert ↵</span>}</div>
              </div>))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

`;
  portals = portals.replace(
    `// ─── Portal Builder (full-screen editor) ──────────────────────────────────────`,
    sectionLib + `// ─── Portal Builder (full-screen editor) ──────────────────────────────────────`
  );
}

// Add showLibrary state
if (!portals.includes('showLibrary')) {
  portals = portals.replace(
    `  const [showTheme,   setShowTheme]  = useState(false);`,
    `  const [showTheme,   setShowTheme]  = useState(false);\n  const [showLibrary, setShowLibrary] = useState(false);`
  );
}

// Add Sections button
if (!portals.includes('Sections</Btn>')) {
  portals = portals.replace(
    `          <Btn v="primary" s="sm" onClick={handleSave} disabled={saving}>{saving?"Saving…":"Save"}</Btn>`,
    `          <Btn v="secondary" s="sm" icon="library" onClick={()=>setShowLibrary(true)}>Sections</Btn>\n          <Btn v="primary" s="sm" onClick={handleSave} disabled={saving}>{saving?"Saving…":"Save"}</Btn>`
  );
}

// Render library modal
if (!portals.includes('showLibrary&&<SectionLibrary')) {
  portals = portals.replace(
    `      {showTheme&&<>`,
    `      {showLibrary&&<SectionLibrary onInsert={row=>{const rows=[...page.rows];rows.push(row);updatePage({...page,rows});}} onClose={()=>setShowLibrary(false)}/>}\n      {showTheme&&<>`
  );
}

// ── F4: Analytics server route ────────────────────────────────────────────────
const analyticsRoute = `const express=require('express'),router=express.Router(),{getStore,saveStore}=require('../db/init'),crypto=require('crypto');
function ensure(){const s=getStore();if(!s.portal_events){s.portal_events=[];saveStore();}}
router.post('/:id/track',(req,res)=>{ensure();const{event,data}=req.body;const s=getStore();s.portal_events.push({id:crypto.randomUUID(),portal_id:req.params.id,event:event||'page_view',data:data||{},created_at:new Date().toISOString()});if(s.portal_events.length>100000)s.portal_events=s.portal_events.slice(-100000);saveStore();res.json({ok:true});});
router.get('/:id/stats',(req,res)=>{ensure();const s=getStore();const all=(s.portal_events||[]).filter(e=>e.portal_id===req.params.id);const since=new Date(Date.now()-parseInt(req.query.days||30)*86400000).toISOString();const recent=all.filter(e=>e.created_at>=since);const count=(arr,ev)=>arr.filter(e=>e.event===ev).length;const dm={};recent.filter(e=>e.event==='page_view').forEach(e=>{const d=e.created_at.slice(0,10);dm[d]=(dm[d]||0)+1;});const daily=Object.entries(dm).sort(([a],[b])=>a.localeCompare(b)).map(([date,views])=>({date,views}));const jc={};recent.filter(e=>e.event==='job_click').forEach(e=>{const t=e.data?.job_title||'Unknown';jc[t]=(jc[t]||0)+1;});const topJobs=Object.entries(jc).sort(([,a],[,b])=>b-a).slice(0,5).map(([title,clicks])=>({title,clicks}));res.json({total_views:count(all,'page_view'),views_period:count(recent,'page_view'),job_clicks:count(recent,'job_click'),applications:count(recent,'application'),form_starts:count(recent,'form_start'),form_completions:count(recent,'form_complete'),conversion_rate:count(recent,'page_view')>0?Math.round((count(recent,'application')/count(recent,'page_view'))*100):0,daily,top_jobs:topJobs,days:parseInt(req.query.days||30)});});
module.exports=router;`;
fs.writeFileSync(path.join(__dirname, 'server/routes/portal_analytics.js'), analyticsRoute);

let idx = fs.readFileSync(indexPath, 'utf8');
if (!idx.includes('portal_analytics')) {
  idx = idx.replace(
    `app.use('/api/brand-kits',`,
    `app.use('/api/portal-analytics',require('./routes/portal_analytics'));\napp.use('/api/brand-kits',`
  );
  fs.writeFileSync(indexPath, idx);
}

// F4: Add tracking to renderer
let renderer = fs.readFileSync(rendererPath, 'utf8');
if (!renderer.includes('const track =')) {
  renderer = renderer.replace(
    `  const [currentPage, setCurrentPage] = useState(pages[0]||null)`,
    `  const [currentPage, setCurrentPage] = useState(pages[0]||null)
  const track=(event,data={})=>{if(!portal?.id)return;api.post(\`/portal-analytics/\${portal.id}/track\`,{event,data}).catch(()=>{});};
  useEffect(()=>{track('page_view',{page:currentPage?.slug||'/'});},[currentPage?.id]);`
  );
}
// Add track to PortalRow
if (!renderer.includes('PortalRow = ({ row, theme, portal, api, track })')) {
  renderer = renderer.replace(`const PortalRow = ({ row, theme, portal, api }) => {`, `const PortalRow = ({ row, theme, portal, api, track }) => {`);
  renderer = renderer.replace(`{cell.widgetType&&<Widget cell={cell} theme={theme} portal={portal} api={api}/>}`, `{cell.widgetType&&<Widget cell={cell} theme={theme} portal={portal} api={api} track={track}/>}`);
  renderer = renderer.replace(
    `{(currentPage.rows||[]).map(row => <PortalRow key={row.id} row={row} theme={theme} portal={portal} api={api}/>)}`,
    `{(currentPage.rows||[]).map(row => <PortalRow key={row.id} row={row} theme={theme} portal={portal} api={api} track={track}/>)}`
  );
}

// F4: Add stats strip to PortalCard
if (!portals.includes('views_period')) {
  // Load analytics in PortalsPage
  portals = portals.replace(
    `  const [creating, setCreating] = useState(false);`,
    `  const [creating, setCreating] = useState(false);\n  const [analytics,setAnalytics]=useState({});
  const loadStats=useCallback(async(list)=>{if(!list?.length)return;const res=await Promise.all(list.map(p=>api.get('/portal-analytics/'+p.id+'/stats?days=30').catch(()=>null)));const m={};list.forEach((p,i)=>{if(res[i])m[p.id]=res[i];});setAnalytics(m);},[]);`
  );
  portals = portals.replace(
    `    setPortals(Array.isArray(data)?data:[]);\n    setLoading(false);`,
    `    const list=Array.isArray(data)?data:[];\n    setPortals(list);\n    setLoading(false);\n    loadStats(list);`
  );
  // Add stats to PortalCard
  portals = portals.replace(`const PortalCard = ({ portal, onEdit, onDelete, onDuplicate }) => {`, `const PortalCard = ({ portal, onEdit, onDelete, onDuplicate, stats }) => {`);
  portals = portals.replace(
    `      {/* Footer */}\n      <div style={{padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>`,
    `      {stats&&<div style={{padding:"6px 14px",background:C.surface2,borderTop:\`1px solid \${C.border}\`,display:"flex",gap:16}}>
        {[{label:"Views",val:stats.views_period},{label:"Clicks",val:stats.job_clicks},{label:"Apps",val:stats.applications},{label:"Conv.",val:stats.conversion_rate+"%"}].map(({label,val})=>(<div key={label} style={{textAlign:"center"}}><div style={{fontSize:14,fontWeight:800,color:C.text1}}>{val??'—'}</div><div style={{fontSize:9,color:C.text3}}>{label}</div></div>))}
      </div>}
      {/* Footer */}\n      <div style={{padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>`
  );
  portals = portals.replace(
    `            <PortalCard key={p.id} portal={p}\n              onEdit={()=>setEditing(p)}\n              onDelete={()=>handleDelete(p.id)}\n              onDuplicate={()=>handleDuplicate(p)}/>`,
    `            <PortalCard key={p.id} portal={p} stats={analytics[p.id]}\n              onEdit={()=>setEditing(p)}\n              onDelete={()=>handleDelete(p.id)}\n              onDuplicate={()=>handleDuplicate(p)}/>`
  );
}

// ── F5: Conditional row visibility ────────────────────────────────────────────
// Add UI to RowSettings
if (!portals.includes('Conditional Visibility')) {
  portals = portals.replace(
    `        {row.bgImage&&(\n          <div>\n            <div style={{fontSize:11,fontWeight:700,color:C.text3,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:5}}>\n              Image Overlay · {row.overlayOpacity||0}%\n            </div>\n            <input type="range" min="0" max="85" value={row.overlayOpacity||0}\n              onChange={e=>set("overlayOpacity",parseInt(e.target.value))} style={{width:"100%"}}/>\n          </div>\n        )}`,
    `        {row.bgImage&&(<div><div style={{fontSize:11,fontWeight:700,color:C.text3,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:5}}>Image Overlay · {row.overlayOpacity||0}%</div><input type="range" min="0" max="85" value={row.overlayOpacity||0} onChange={e=>set("overlayOpacity",parseInt(e.target.value))} style={{width:"100%"}}/></div>)}
        <div style={{borderTop:\`1px solid \${C.border}\`,paddingTop:12}}>
          <div style={{fontSize:11,fontWeight:700,color:C.text3,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>Conditional Visibility</div>
          <div style={{fontSize:11,color:C.text3,marginBottom:8}}>Show this row only when a URL parameter matches.</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}>
            <input value={row.condition?.param||""} onChange={e=>set("condition",{...row.condition,param:e.target.value})} placeholder="URL param (e.g. dept)" style={inp}/>
            <input value={row.condition?.value||""} onChange={e=>set("condition",{...row.condition,value:e.target.value})} placeholder="Value (e.g. engineering)" style={inp}/>
          </div>
          {(row.condition?.param||row.condition?.value)&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{fontSize:11,color:C.accent}}>Visible when ?{row.condition?.param}={row.condition?.value}</div><button onClick={()=>set("condition",null)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:10}}>Clear</button></div>}
        </div>`
  );
}

// Renderer: apply condition
if (!renderer.includes('row.condition?.param')) {
  renderer = renderer.replace(
    `const PortalRow = ({ row, theme, portal, api, track }) => {`,
    `const PortalRow = ({ row, theme, portal, api, track }) => {
  if(row.condition?.param&&row.condition?.value){const p=new URLSearchParams(window.location.search);if((p.get(row.condition.param)||'').toLowerCase()!==row.condition.value.toLowerCase())return null;}`
  );
}

fs.writeFileSync(portalsPath, portals);
fs.writeFileSync(rendererPath, renderer);
console.log('✅ F3 section library, F4 analytics, F5 conditional visibility done');
