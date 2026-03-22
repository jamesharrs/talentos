#!/usr/bin/env node
// Feature 2: Nav & Footer editors
const fs = require('fs'), path = require('path');
const portalsPath  = path.join(__dirname, 'client/src/Portals.jsx');
const rendererPath = path.join(__dirname, 'client/src/portals/PortalPageRenderer.jsx');
let portals  = fs.readFileSync(portalsPath,  'utf8');
let renderer = fs.readFileSync(rendererPath, 'utf8');

// 1. Icons
if (!portals.includes('"menu"')) {
  portals = portals.replace(
    `    film:"M19.82 2H4.18`,
    `    menu:"M3 12h18M3 6h18M3 18h18",\n    footer2:"M3 3h18v4H3zM3 17h18v4H3zM3 10h18v4H3z",\n    externalLink:"M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3",\n    film:"M19.82 2H4.18`
  );
}

// 2. Inject defaults + components before PortalBuilder
if (!portals.includes('defaultNav')) {
  const code = `
const defaultNav = () => ({ logoText:'', logoUrl:'', bgColor:'', textColor:'', sticky:true,
  links:[{id:'nl1',label:'Home',href:'/'},{id:'nl2',label:'Jobs',href:'#jobs'},{id:'nl3',label:'Apply',href:'/apply'}] });
const defaultFooter = () => ({ bgColor:'#0F1729', textColor:'#F1F5F9',
  bottomText:'© 2026 Your Company. All rights reserved.',
  columns:[{id:'fc1',heading:'Company',links:[{label:'About',href:'#'},{label:'Careers',href:'#jobs'}]},{id:'fc2',heading:'Legal',links:[{label:'Privacy',href:'#'},{label:'Terms',href:'#'}]}] });

const NavEditor = ({ nav, onChange, theme, onClose }) => {
  const set=(k,v)=>onChange({...nav,[k]:v});
  const inp={padding:"7px 10px",borderRadius:8,border:\`1px solid \${C.border}\`,fontSize:13,fontFamily:F,outline:"none",color:C.text1,background:C.surface,width:"100%",boxSizing:"border-box"};
  const lbl=t=><div style={{fontSize:11,fontWeight:700,color:C.text3,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:5}}>{t}</div>;
  const links=nav.links||[];
  const addLink=()=>set("links",[...links,{id:Math.random().toString(36).slice(2),label:'New Link',href:'/'}]);
  const removeLink=i=>{const l=[...links];l.splice(i,1);set("links",l);};
  const updateLink=(i,p)=>{const l=[...links];l[i]={...l[i],...p};set("links",l);};
  return(
    <div style={{position:"fixed",top:0,right:0,width:340,height:"100vh",background:C.surface,borderLeft:\`1px solid \${C.border}\`,zIndex:500,display:"flex",flexDirection:"column",boxShadow:"-8px 0 40px rgba(0,0,0,.1)"}}>
      <div style={{padding:"16px 20px",borderBottom:\`1px solid \${C.border}\`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><Ic n="menu" s={15} c={C.accent}/><span style={{fontSize:15,fontWeight:800,color:C.text1}}>Navigation</span></div>
        <button onClick={onClose} style={{background:C.surface2,border:\`1px solid \${C.border}\`,borderRadius:6,cursor:"pointer",color:C.text2,padding:"5px 10px",display:"flex",alignItems:"center",gap:4,fontSize:12,fontWeight:600,fontFamily:F}}><Ic n="x" s={12}/> Close</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>{lbl("Logo text")}<input value={nav.logoText||""} onChange={e=>set("logoText",e.target.value)} placeholder="Company name" style={inp}/></div>
          <div>{lbl("Logo image URL")}<input value={nav.logoUrl||""} onChange={e=>set("logoUrl",e.target.value)} placeholder="https://…/logo.png" style={inp}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>{lbl("Nav background")}<input type="color" value={nav.bgColor||theme?.bgColor||"#ffffff"} onChange={e=>set("bgColor",e.target.value)} style={{width:"100%",height:32,borderRadius:6,border:\`1px solid \${C.border}\`,cursor:"pointer",padding:2}}/></div>
            <div>{lbl("Nav text")}<input type="color" value={nav.textColor||theme?.textColor||"#0F1729"} onChange={e=>set("textColor",e.target.value)} style={{width:"100%",height:32,borderRadius:6,border:\`1px solid \${C.border}\`,cursor:"pointer",padding:2}}/></div>
          </div>
          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:C.text2,cursor:"pointer"}}><input type="checkbox" checked={!!nav.sticky} onChange={e=>set("sticky",e.target.checked)} style={{width:14,height:14}}/>Sticky nav</label>
          <div style={{borderTop:\`1px solid \${C.border}\`,paddingTop:14}}>
            {lbl("Nav links")}
            {links.map((lnk,i)=>(<div key={lnk.id} style={{background:C.surface2,borderRadius:8,padding:10,marginBottom:8,border:\`1px solid \${C.border}\`}}>
              <div style={{display:"flex",gap:6,marginBottom:6}}><input value={lnk.label} onChange={e=>updateLink(i,{label:e.target.value})} placeholder="Label" style={{...inp,flex:1,fontSize:12,padding:"5px 8px"}}/><button onClick={()=>removeLink(i)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:14,padding:"0 4px"}}>✕</button></div>
              <input value={lnk.href} onChange={e=>updateLink(i,{href:e.target.value})} placeholder="URL or #anchor" style={{...inp,fontSize:12,padding:"5px 8px"}}/>
            </div>))}
            <button onClick={addLink} style={{width:"100%",padding:"6px",borderRadius:8,border:\`1.5px dashed \${C.border}\`,background:"transparent",cursor:"pointer",fontSize:12,color:C.text3,fontFamily:F}}>+ Add link</button>
          </div>
        </div>
      </div>
      <div style={{padding:"12px 20px",borderTop:\`1px solid \${C.border}\`,flexShrink:0}}>
        <div style={{padding:"10px 14px",borderRadius:8,background:nav.bgColor||"#fff",border:\`1px solid \${C.border}\`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:13,fontWeight:800,color:theme?.primaryColor||"#4361EE"}}>{nav.logoText||"Company"}</span>
          <div style={{display:"flex",gap:10}}>{links.slice(0,3).map(l=><span key={l.id} style={{fontSize:11,color:nav.textColor||"#374151"}}>{l.label}</span>)}</div>
        </div>
      </div>
    </div>
  );
};

const FooterEditor = ({ footer, onChange, onClose }) => {
  const set=(k,v)=>onChange({...footer,[k]:v});
  const inp={padding:"7px 10px",borderRadius:8,border:\`1px solid \${C.border}\`,fontSize:13,fontFamily:F,outline:"none",color:C.text1,background:C.surface,width:"100%",boxSizing:"border-box"};
  const lbl=t=><div style={{fontSize:11,fontWeight:700,color:C.text3,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:5}}>{t}</div>;
  const cols=footer.columns||[];
  const addCol=()=>set("columns",[...cols,{id:Math.random().toString(36).slice(2),heading:'Column',links:[]}]);
  const removeCol=i=>{const c=[...cols];c.splice(i,1);set("columns",c);};
  const updateCol=(i,p)=>{const c=[...cols];c[i]={...c[i],...p};set("columns",c);};
  const addColLink=ci=>{const c=[...cols];c[ci].links=[...(c[ci].links||[]),{label:'Link',href:'#'}];set("columns",c);};
  const updateColLink=(ci,li,p)=>{const c=[...cols];const l=[...c[ci].links];l[li]={...l[li],...p};c[ci]={...c[ci],links:l};set("columns",c);};
  const removeColLink=(ci,li)=>{const c=[...cols];const l=[...c[ci].links];l.splice(li,1);c[ci]={...c[ci],links:l};set("columns",c);};
  return(
    <div style={{position:"fixed",top:0,right:0,width:340,height:"100vh",background:C.surface,borderLeft:\`1px solid \${C.border}\`,zIndex:500,display:"flex",flexDirection:"column",boxShadow:"-8px 0 40px rgba(0,0,0,.1)"}}>
      <div style={{padding:"16px 20px",borderBottom:\`1px solid \${C.border}\`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><Ic n="footer2" s={15} c={C.accent}/><span style={{fontSize:15,fontWeight:800,color:C.text1}}>Footer</span></div>
        <button onClick={onClose} style={{background:C.surface2,border:\`1px solid \${C.border}\`,borderRadius:6,cursor:"pointer",color:C.text2,padding:"5px 10px",display:"flex",alignItems:"center",gap:4,fontSize:12,fontWeight:600,fontFamily:F}}><Ic n="x" s={12}/> Close</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>{lbl("Background")}<input type="color" value={footer.bgColor||"#0F1729"} onChange={e=>set("bgColor",e.target.value)} style={{width:"100%",height:32,borderRadius:6,border:\`1px solid \${C.border}\`,cursor:"pointer",padding:2}}/></div>
            <div>{lbl("Text colour")}<input type="color" value={footer.textColor||"#F1F5F9"} onChange={e=>set("textColor",e.target.value)} style={{width:"100%",height:32,borderRadius:6,border:\`1px solid \${C.border}\`,cursor:"pointer",padding:2}}/></div>
          </div>
          <div>{lbl("Copyright text")}<input value={footer.bottomText||""} onChange={e=>set("bottomText",e.target.value)} placeholder="© 2026 Your Company." style={inp}/></div>
          <div style={{borderTop:\`1px solid \${C.border}\`,paddingTop:14}}>
            {lbl("Link columns")}
            {cols.map((col,ci)=>(<div key={col.id} style={{background:C.surface2,borderRadius:10,padding:10,marginBottom:10,border:\`1px solid \${C.border}\`}}>
              <div style={{display:"flex",gap:6,marginBottom:8}}><input value={col.heading} onChange={e=>updateCol(ci,{heading:e.target.value})} placeholder="Heading" style={{...inp,flex:1,fontSize:12,padding:"5px 8px"}}/><button onClick={()=>removeCol(ci)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:14,padding:"0 4px"}}>✕</button></div>
              {(col.links||[]).map((lnk,li)=>(<div key={li} style={{display:"flex",gap:5,marginBottom:5}}>
                <input value={lnk.label} onChange={e=>updateColLink(ci,li,{label:e.target.value})} placeholder="Label" style={{...inp,flex:1,fontSize:11,padding:"4px 6px"}}/>
                <input value={lnk.href}  onChange={e=>updateColLink(ci,li,{href:e.target.value})}  placeholder="URL" style={{...inp,flex:1,fontSize:11,padding:"4px 6px"}}/>
                <button onClick={()=>removeColLink(ci,li)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:12}}>✕</button>
              </div>))}
              <button onClick={()=>addColLink(ci)} style={{fontSize:10,color:C.text3,background:"none",border:"none",cursor:"pointer",fontFamily:F}}>+ Link</button>
            </div>))}
            <button onClick={addCol} style={{width:"100%",padding:"6px",borderRadius:8,border:\`1.5px dashed \${C.border}\`,background:"transparent",cursor:"pointer",fontSize:12,color:C.text3,fontFamily:F}}>+ Add column</button>
          </div>
        </div>
      </div>
    </div>
  );
};

`;
  portals = portals.replace(
    `// ─── Portal Builder (full-screen editor) ──────────────────────────────────────`,
    code + `// ─── Portal Builder (full-screen editor) ──────────────────────────────────────`
  );
}

// 3. Add nav/footer to portal state
portals = portals.replace(
  `    theme: init.theme||defaultTheme(),\n    pages: init.pages?.length?init.pages:[defaultPage()],\n  });`,
  `    theme: init.theme||defaultTheme(),\n    pages: init.pages?.length?init.pages:[defaultPage()],\n    nav:   init.nav   ||defaultNav(),\n    footer:init.footer||defaultFooter(),\n  });`
);

// 4. Add showNav/showFooter/activeTab state
if (!portals.includes('showNav')) {
  portals = portals.replace(
    `  const [showTheme, setShowTheme] = useState(false);`,
    `  const [showTheme,   setShowTheme]  = useState(false);\n  const [showNav,     setShowNav]    = useState(false);\n  const [showFooter,  setShowFooter] = useState(false);\n  const [activeTab,   setActiveTab]  = useState('canvas');`
  );
}

// 5. Add tabs to top bar
if (!portals.includes('activeTab===')) {
  portals = portals.replace(
    `        <div style={{width:1,height:24,background:C.border,margin:"0 12px"}}/>
        {/* Actions */}`,
    `        <div style={{width:1,height:24,background:C.border,margin:"0 12px"}}/>
        <div style={{display:"flex",gap:2,background:C.surface2,borderRadius:7,padding:2,border:\`1px solid \${C.border}\`}}>
          {[["canvas","Canvas"],["nav","Nav"],["footer","Footer"]].map(([id,l])=>(
            <button key={id} onClick={()=>setActiveTab(id)} style={{padding:"4px 10px",borderRadius:5,border:"none",fontFamily:F,fontSize:11,fontWeight:600,cursor:"pointer",background:activeTab===id?C.surface:"transparent",color:activeTab===id?C.text1:C.text3,boxShadow:activeTab===id?"0 1px 3px rgba(0,0,0,.06)":"none"}}>{l}</button>
          ))}
        </div>
        <div style={{width:1,height:24,background:C.border,margin:"0 12px"}}/>
        {/* Actions */}`
  );
}

// 6. Wrap canvas area with tab switching
if (!portals.includes('activeTab==="nav"')) {
  portals = portals.replace(
    `      {/* Canvas */}\n      <div style={{flex:1,overflow:"auto",marginRight:showTheme?320:0,transition:"margin-right .2s",background:isMobile?C.bg:"transparent"}}>`,
    `      {/* Canvas / Nav / Footer tabs */}\n      <div style={{flex:1,overflow:"auto",marginRight:showTheme?320:0,transition:"margin-right .2s",background:isMobile?C.bg:"transparent"}}>
        {activeTab==="nav"&&<div style={{maxWidth:600,margin:"32px auto",padding:"0 24px"}}><div style={{fontSize:16,fontWeight:800,color:C.text1,marginBottom:4}}>Navigation</div><NavEditor nav={portal.nav} onChange={nav=>setPortal(p=>({...p,nav}))} theme={portal.theme} onClose={()=>setActiveTab("canvas")}/></div>}
        {activeTab==="footer"&&<div style={{maxWidth:600,margin:"32px auto",padding:"0 24px"}}><div style={{fontSize:16,fontWeight:800,color:C.text1,marginBottom:4}}>Footer</div><FooterEditor footer={portal.footer} onChange={footer=>setPortal(p=>({...p,footer}))} onClose={()=>setActiveTab("canvas")}/></div>}
        {activeTab==="canvas"&&(`
  );
  // Close the canvas conditional
  portals = portals.replace(
    `        </div>\n      </div>\n      {showTheme&&<>`,
    `        )}\n        </div>\n      </div>\n      {showTheme&&<>`
  );
}

fs.writeFileSync(portalsPath, portals);

// 7. Update renderer nav
if (!renderer.includes('nav.logoUrl')) {
  renderer = renderer.replace(
    `const PortalNav = ({ portal, theme, currentPage, onNav, pages }) => (
  <nav style={{ position:'sticky', top:0, zIndex:100, background:theme.bgColor||'#fff', borderBottom:\`1px solid \${theme.primaryColor}18\`, boxShadow:'0 1px 8px rgba(0,0,0,.06)' }}>
    <div style={{ maxWidth:theme.maxWidth||'1200px', margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>
      <div style={{ fontSize:18, fontWeight:800, color:theme.primaryColor, fontFamily:theme.headingFont||theme.fontFamily }}>{portal.branding?.company_name||portal.name}</div>
      {pages.length>1&&(
        <div style={{ display:'flex', gap:4 }}>
          {pages.map(pg=>(
            <button key={pg.id} onClick={()=>onNav(pg)} style={{ background:'none', border:'none', cursor:'pointer', padding:'6px 12px', borderRadius:8, fontSize:14, fontWeight:currentPage?.id===pg.id?700:500, color:currentPage?.id===pg.id?theme.primaryColor:(theme.textColor||'#374151'), fontFamily:theme.fontFamily }}>{pg.name}</button>
          ))}
        </div>
      )}
    </div>
  </nav>
)`,
    `const PortalNav = ({ portal, theme, currentPage, onNav, pages }) => {
  const nav=portal.nav||{};
  const bg=nav.bgColor||theme.bgColor||'#fff';
  const fg=nav.textColor||theme.textColor||'#0F1729';
  return(
    <nav style={{ position:nav.sticky!==false?'sticky':'relative', top:0, zIndex:100, background:bg, borderBottom:\`1px solid \${theme.primaryColor}18\`, boxShadow:'0 1px 8px rgba(0,0,0,.06)' }}>
      <div style={{ maxWidth:theme.maxWidth||'1200px', margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>
        {nav.logoUrl?<img src={nav.logoUrl} alt={nav.logoText||portal.name} style={{height:36,objectFit:'contain'}}/>:<div style={{fontSize:18,fontWeight:800,color:theme.primaryColor,fontFamily:theme.headingFont||theme.fontFamily}}>{nav.logoText||portal.branding?.company_name||portal.name}</div>}
        <div style={{display:'flex',gap:4,alignItems:'center'}}>
          {(nav.links||[]).map(lnk=>(<a key={lnk.id} href={lnk.href||'#'} style={{padding:'6px 12px',borderRadius:8,fontSize:14,fontWeight:500,color:fg,textDecoration:'none',fontFamily:theme.fontFamily}}>{lnk.label}</a>))}
          {!(nav.links||[]).length&&pages.length>1&&pages.map(pg=>(<button key={pg.id} onClick={()=>onNav(pg)} style={{background:'none',border:'none',cursor:'pointer',padding:'6px 12px',borderRadius:8,fontSize:14,fontWeight:currentPage?.id===pg.id?700:500,color:currentPage?.id===pg.id?theme.primaryColor:fg,fontFamily:theme.fontFamily}}>{pg.name}</button>))}
        </div>
      </div>
    </nav>
  );
}`
  );
}

// 8. Replace simple footer with configurable one
renderer = renderer.replace(
  `      <div style={{ padding:'20px 24px', textAlign:'center', borderTop:\`1px solid \${theme.primaryColor}15\`, fontFamily:theme.fontFamily }}>
        <span style={{ fontSize:11, color:theme.textColor||'#9CA3AF', opacity:0.5 }}>Powered by Vercentic</span>
      </div>`,
  `      <PortalFooter portal={portal} theme={theme}/>`
);

if (!renderer.includes('const PortalFooter')) {
  renderer = renderer.replace(
    `const PortalNav = `,
    `const PortalFooter = ({ portal, theme }) => {
  const f=portal.footer||{}; const bg=f.bgColor||'#0F1729'; const fg=f.textColor||'#F1F5F9';
  return(<footer style={{background:bg,padding:'48px 24px 24px',fontFamily:theme.fontFamily}}>
    <div style={{maxWidth:theme.maxWidth||'1200px',margin:'0 auto'}}>
      {(f.columns||[]).length>0&&(<div style={{display:'grid',gridTemplateColumns:\`repeat(\${Math.min((f.columns||[]).length,4)},1fr)\`,gap:32,marginBottom:40}}>
        {(f.columns||[]).map(col=>(<div key={col.id}>
          <div style={{fontSize:13,fontWeight:700,color:fg,marginBottom:12}}>{col.heading}</div>
          {(col.links||[]).map((lnk,i)=>(<a key={i} href={lnk.href||'#'} style={{display:'block',fontSize:13,color:fg,opacity:0.65,marginBottom:8,textDecoration:'none'}}>{lnk.label}</a>))}
        </div>))}
      </div>)}
      <div style={{borderTop:'1px solid rgba(255,255,255,.1)',paddingTop:20,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
        <span style={{fontSize:12,color:fg,opacity:0.5}}>{f.bottomText||'© 2026 Your Company. All rights reserved.'}</span>
        <span style={{fontSize:11,color:fg,opacity:0.3}}>Powered by Vercentic</span>
      </div>
    </div>
  </footer>);
};

const PortalNav = `
  );
}

fs.writeFileSync(portalsPath, portals);
fs.writeFileSync(rendererPath, renderer);
console.log('✅ F2 nav/footer done');
