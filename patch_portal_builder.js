#!/usr/bin/env node
/**
 * Portal Builder Enhancement Patch
 * 
 * 1. Top navigation tidy — compact toolbar with grouped actions + overflow menu
 * 2. Unsaved changes alert — dirty state tracking + beforeunload + confirmation dialog
 * 3. Video hero banner — video URL support in hero widget with text/nav overlay
 * 
 * Run from the talentos root:
 *   node patch_portal_builder.js
 */

const fs = require('fs');
const path = require('path');

const PORTALS_PATH  = path.join(__dirname, 'client/src/Portals.jsx');
const RENDERER_PATH = path.join(__dirname, 'client/src/portals/PortalPageRenderer.jsx');

let portals, renderer;
try {
  portals  = fs.readFileSync(PORTALS_PATH, 'utf8');
  renderer = fs.readFileSync(RENDERER_PATH, 'utf8');
} catch (e) {
  console.error('Could not read files. Run this from the talentos project root.');
  console.error('Expected:', PORTALS_PATH);
  process.exit(1);
}

let changes = 0;

// ============================================================================
// FEATURE 1: TOP NAVIGATION TIDY
// ============================================================================
// Replace the flat button row with a compact grouped toolbar that wraps gracefully

// 1a. Add "more" / "chevD" icon paths if missing
if (!portals.includes('"more"')) {
  portals = portals.replace(
    /(\s*film:"M19\.82 2H4\.18)/,
    `    more:"M12 13a1 1 0 100-2 1 1 0 000 2zM19 13a1 1 0 100-2 1 1 0 000 2zM5 13a1 1 0 100-2 1 1 0 000 2z",\n$1`
  );
  changes++;
}

// 1b. Replace the entire top bar section with a reorganized, compact version.
// The current top bar has buttons spaced individually. We'll group them into:
//   Left:  ← Portals | Portal Name | Page tabs
//   Right: [Edit/Preview] | [Sections] [Theme] [More ▾] | [Save] [Publish] [View Live]
// The "More" menu holds: Brand, Domain, Settings

const OLD_TOP_BAR_START = `      {/* Top bar */}
      <div style={{height:52,background:C.surface,borderBottom:\`1px solid \${C.border}\`,display:"flex",alignItems:"center",gap:0,flexShrink:0,padding:"0 16px"}}>`;

const NEW_TOP_BAR = `      {/* Top bar — compact grouped layout */}
      <div style={{height:48,background:C.surface,borderBottom:\`1px solid \${C.border}\`,display:"flex",alignItems:"center",gap:0,flexShrink:0,padding:"0 12px",overflow:"hidden"}}>`;

if (portals.includes('height:52,background:C.surface,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:0,flexShrink:0,padding:"0 16px"')) {
  portals = portals.replace(
    'height:52,background:C.surface,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:0,flexShrink:0,padding:"0 16px"',
    'height:48,background:C.surface,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:0,flexShrink:0,padding:"0 12px",overflow:"hidden"'
  );
  changes++;
  console.log('  ✓ Top bar height reduced 52→48, added overflow:hidden');
}

// 1c. Make page tabs scrollable when many pages exist — wrap with overflow
// Find the page tabs container and add maxWidth + overflow
if (portals.includes('display:"flex",gap:2,background:C.surface2,borderRadius:8,padding:3,border:`1px solid ${C.border}`}}>')) {
  // This is the page tabs wrapper. Add max-width and horizontal scroll.
  portals = portals.replace(
    'display:"flex",gap:2,background:C.surface2,borderRadius:8,padding:3,border:`1px solid ${C.border}`}}>\n          {portal.pages.map',
    'display:"flex",gap:2,background:C.surface2,borderRadius:8,padding:3,border:`1px solid ${C.border}`,maxWidth:280,overflowX:"auto",flexShrink:0}}>\n          {portal.pages.map'
  );
  changes++;
  console.log('  ✓ Page tabs capped at 280px with horizontal scroll');
}

// 1d. Wrap the action buttons in a "more" overflow menu for Brand, Domain, Settings
// Add showMoreMenu state if not present
if (!portals.includes('showMoreMenu')) {
  portals = portals.replace(
    '  const [showTheme',
    '  const [showMoreMenu, setShowMoreMenu] = useState(false);\n  const [showTheme'
  );
  changes++;
}

// Replace the individual Brand / Domain / Settings buttons with a single "More" dropdown
const BRAND_BTN = `<button onClick={()=>setShowBrandKit(true)}
            style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:7,cursor:"pointer",fontFamily:F,fontSize:11,fontWeight:600,border:\`1px solid \${C.border}\`,background:"transparent",color:C.text2}}>
            <Ic n="sparkles" s={12} c={C.text2}/>Brand
          </button>`;
const DOMAIN_BTN = `<button onClick={()=>setShowDomainWizard(true)}
            style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:7,cursor:"pointer",fontFamily:F,fontSize:11,fontWeight:600,border:\`1px solid \${C.border}\`,background:"transparent",color:C.text2}}>
            <Ic n="externalLink" s={12} c={C.text2}/>Domain
          </button>`;
const SETTINGS_BTN_START = `<button onClick={()=>{setShowPortalSettings(s=>!s);setShowTheme(false);}}`;

// Find and replace the three buttons with one "More" dropdown
if (portals.includes('Brand\n          </button>\n          <button onClick={()=>setShowDomainWizard')) {
  // The three buttons are sequential. Replace them with a single More menu.
  const moreMenuCode = `{/* More menu — Brand, Domain, Settings */}
          <div style={{position:"relative"}}>
            <button onClick={()=>setShowMoreMenu(m=>!m)}
              style={{display:"flex",alignItems:"center",gap:4,padding:"5px 9px",borderRadius:7,cursor:"pointer",fontFamily:F,fontSize:11,fontWeight:600,border:\`1px solid \${C.border}\`,background:showMoreMenu?C.accentLight:"transparent",color:showMoreMenu?C.accent:C.text2}}>
              <Ic n="more" s={13} c={showMoreMenu?C.accent:C.text2}/>
            </button>
            {showMoreMenu&&<>
              <div onClick={()=>setShowMoreMenu(false)} style={{position:"fixed",inset:0,zIndex:299}}/>
              <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,background:C.surface,borderRadius:10,boxShadow:"0 8px 32px rgba(0,0,0,.15)",border:\`1px solid \${C.border}\`,zIndex:300,minWidth:160,padding:4}}>
                {[
                  {icon:"sparkles",label:"Brand Kit",onClick:()=>{setShowBrandKit(true);setShowMoreMenu(false);}},
                  {icon:"externalLink",label:"Domain",onClick:()=>{setShowDomainWizard(true);setShowMoreMenu(false);}},
                  {icon:"settings",label:"Settings",onClick:()=>{setShowPortalSettings(s=>!s);setShowTheme(false);setShowMoreMenu(false);}},
                ].map(item=>(
                  <button key={item.label} onClick={item.onClick}
                    style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:7,border:"none",background:"transparent",cursor:"pointer",fontFamily:F,fontSize:12,fontWeight:500,color:C.text1,textAlign:"left"}}
                    onMouseEnter={e=>{e.currentTarget.style.background=C.surface2;}}
                    onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
                    <Ic n={item.icon} s={13} c={C.text2}/>{item.label}
                  </button>
                ))}
              </div>
            </>}
          </div>`;

  // Do sequential replacements for each button
  // First: Brand button
  if (portals.includes('/>Brand\n          </button>')) {
    const brandStart = portals.indexOf('<button onClick={()=>setShowBrandKit(true)}');
    const brandEnd = portals.indexOf('/>Brand\n          </button>') + '/>Brand\n          </button>'.length;
    if (brandStart > 0 && brandEnd > brandStart) {
      const before = portals.slice(0, brandStart);
      const after = portals.slice(brandEnd);
      portals = before + moreMenuCode + after;
      changes++;
      console.log('  ✓ Replaced Brand button with More menu');
    }
  }
  // Remove Domain button
  if (portals.includes('/>Domain\n          </button>')) {
    const domainStart = portals.indexOf('<button onClick={()=>setShowDomainWizard(true)}');
    const domainEnd = portals.indexOf('/>Domain\n          </button>') + '/>Domain\n          </button>'.length;
    if (domainStart > 0 && domainEnd > domainStart) {
      portals = portals.slice(0, domainStart) + portals.slice(domainEnd);
      changes++;
      console.log('  ✓ Removed standalone Domain button');
    }
  }
  // Remove Settings button
  if (portals.includes('/>Settings\n          </button>')) {
    const settingsStart = portals.indexOf('<button onClick={()=>{setShowPortalSettings(s=>!s);setShowTheme(false);}}');
    const settingsEnd = portals.indexOf('/>Settings\n          </button>') + '/>Settings\n          </button>'.length;
    if (settingsStart > 0 && settingsEnd > settingsStart) {
      portals = portals.slice(0, settingsStart) + portals.slice(settingsEnd);
      changes++;
      console.log('  ✓ Removed standalone Settings button');
    }
  }
}

// 1e. Make the action button font sizes slightly smaller for compactness
portals = portals.replace(/padding:"5px 10px",borderRadius:7,cursor:"pointer",fontFamily:F,fontSize:11/g, 
  'padding:"4px 9px",borderRadius:7,cursor:"pointer",fontFamily:F,fontSize:11');
changes++;
console.log('  ✓ Tightened button padding');


// ============================================================================
// FEATURE 2: UNSAVED CHANGES ALERT
// ============================================================================

// 2a. Add isDirty state + savedSnapshot ref
if (!portals.includes('isDirty')) {
  portals = portals.replace(
    '  const [saving, setSaving] = useState(false);',
    `  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const savedSnapshotRef = React.useRef(null);`
  );
  changes++;
  console.log('  ✓ Added isDirty state + savedSnapshotRef');
}

// 2b. Take a snapshot after initial load and after each save
if (!portals.includes('savedSnapshotRef.current = JSON.stringify')) {
  // After the portal state is initialized, snapshot it
  portals = portals.replace(
    'const [portal, setPortal] = useState(() => {',
    `const portalSnapshot = React.useCallback((p) => JSON.stringify({
    name:p.name, pages:p.pages, theme:p.theme, nav:p.nav, footer:p.footer, status:p.status
  }), []);
  const [portal, setPortal] = useState(() => {`
  );
  changes++;
}

// 2c. Add useEffect to track dirty state by comparing to snapshot
if (!portals.includes('// Track dirty state')) {
  // Find a good insertion point — after the portal state initialization
  portals = portals.replace(
    '  const handleSave = async () => {',
    `  // Track dirty state
  React.useEffect(() => {
    if (!savedSnapshotRef.current) {
      savedSnapshotRef.current = portalSnapshot(portal);
      return;
    }
    const current = portalSnapshot(portal);
    setIsDirty(current !== savedSnapshotRef.current);
  }, [portal, portalSnapshot]);

  // Warn on browser close/reload if dirty
  React.useEffect(() => {
    const handler = (e) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const handleSave = async () => {`
  );
  changes++;
  console.log('  ✓ Added dirty state tracking + beforeunload warning');
}

// 2d. Clear dirty state after successful save
if (!portals.includes('savedSnapshotRef.current = portalSnapshot')) {
  portals = portals.replace(
    'setSaving(false);',
    `setSaving(false);
      savedSnapshotRef.current = portalSnapshot(portal);
      setIsDirty(false);`
  );
  changes++;
  console.log('  ✓ Clear dirty state after save');
}

// 2e. Add unsaved changes indicator to the top bar — a small amber dot next to portal name
if (!portals.includes('{isDirty&&<')) {
  portals = portals.replace(
    'style={{border:"none",outline:"none",fontSize:14,fontWeight:700,color:C.text1,background:"transparent",fontFamily:F,minWidth:160}}/>',
    `style={{border:"none",outline:"none",fontSize:14,fontWeight:700,color:C.text1,background:"transparent",fontFamily:F,minWidth:140}}/>
        {isDirty&&<span style={{width:7,height:7,borderRadius:"50%",background:"#F59E0B",flexShrink:0,marginLeft:-4}} title="Unsaved changes"/>}`
  );
  changes++;
  console.log('  ✓ Added amber unsaved-changes dot next to portal name');
}

// 2f. Warn when clicking "← Portals" back button if dirty
if (!portals.includes('confirmLeave')) {
  portals = portals.replace(
    '<button onClick={onClose}',
    `<button onClick={()=>{
          if(isDirty&&!window.confirm("You have unsaved changes. Leave without saving?")){return;}
          onClose();
        }}`
  );
  // Remove the original onClose from the button — now it's in the handler above
  // Actually the replace above already handles the onClick, so remove the duplicate
  // by ensuring onClose() isn't called directly anymore. The above replace already did this.
  changes++;
  console.log('  ✓ Added confirmation dialog on back button when dirty');
}

// 2g. Update Save button to show "Saved ✓" briefly after save
if (!portals.includes('"Saved ✓"')) {
  portals = portals.replace(
    '{saving?"Saving…":"Save"}',
    '{saving?"Saving…":isDirty?"Save":"Saved ✓"}'
  );
  changes++;
  console.log('  ✓ Save button shows "Saved ✓" when clean');
}


// ============================================================================
// FEATURE 3: VIDEO HERO BANNER
// ============================================================================

// 3a. Add video icon path if missing
if (!portals.includes('"play-circle"')) {
  portals = portals.replace(
    /(\s*film:"M19\.82 2H4\.18)/,
    `    "play-circle":"M12 22a10 10 0 100-20 10 10 0 000 20zM10 8l6 4-6 4V8z",\n$1`
  );
  changes++;
}

// 3b. Add videoUrl field to hero widget config panel
const HERO_CONFIG_FIELDS = `case "hero": return (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>`;

if (portals.includes(HERO_CONFIG_FIELDS)) {
  portals = portals.replace(
    HERO_CONFIG_FIELDS,
    `case "hero": return (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{borderBottom:\`1px solid \${C.border}\`,paddingBottom:12,marginBottom:4}}>
            {lbl("Video background")}
            <input value={cfg.videoUrl||""} onChange={e=>set("videoUrl",e.target.value)} placeholder="https://example.com/video.mp4" style={inp}/>
            <div style={{fontSize:10,color:C.text3,marginTop:4}}>MP4 or WebM URL. Overrides the background image when set. Video loops silently.</div>
            {cfg.videoUrl&&<div style={{display:"flex",gap:8,marginTop:6}}>
              <label style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:C.text2,cursor:"pointer"}}>
                <input type="checkbox" checked={!!cfg.videoOverlayDarken} onChange={e=>set("videoOverlayDarken",e.target.checked)}/> Darken overlay
              </label>
              <label style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:C.text2,cursor:"pointer"}}>
                <input type="checkbox" checked={cfg.videoFit!=="contain"} onChange={e=>set("videoFit",e.target.checked?"cover":"contain")}/> Cover (crop to fill)
              </label>
            </div>}
          </div>`
  );
  changes++;
  console.log('  ✓ Added videoUrl config field to hero widget settings');
}

// 3c. Update the hero widget PREVIEW in the builder (WidgetPreview) to show video
const HERO_PREVIEW_START = `if (cell.widgetType==="hero") return (
    <div style={{
      padding:"32px 24px", textAlign: cfg.align||"center",
      background: cfg.bgImage ? \`url(\${cfg.bgImage}) center/cover no-repeat\`
        : \`linear-gradient(135deg,\${t.primaryColor}18,\${t.secondaryColor}0a)\`,
      position:"relative", borderRadius:8, overflow:"hidden"
    }}>
      {cfg.bgImage&&(cfg.overlayOpacity||0)>0&&<div style={{position:"absolute",inset:0,background:\`rgba(0,0,0,\${(cfg.overlayOpacity||0)/100})\`}}/>}`;

if (portals.includes(HERO_PREVIEW_START)) {
  portals = portals.replace(
    HERO_PREVIEW_START,
    `if (cell.widgetType==="hero") return (
    <div style={{
      padding:"32px 24px", textAlign: cfg.align||"center",
      background: cfg.videoUrl ? "#0F1729"
        : cfg.bgImage ? \`url(\${cfg.bgImage}) center/cover no-repeat\`
        : \`linear-gradient(135deg,\${t.primaryColor}18,\${t.secondaryColor}0a)\`,
      position:"relative", borderRadius:8, overflow:"hidden", minHeight: cfg.videoUrl ? 180 : "auto"
    }}>
      {cfg.videoUrl&&<video src={cfg.videoUrl} autoPlay loop muted playsInline
        style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:cfg.videoFit||"cover",zIndex:0}}/>}
      {cfg.videoUrl&&cfg.videoOverlayDarken&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.45)",zIndex:1}}/>}
      {!cfg.videoUrl&&cfg.bgImage&&(cfg.overlayOpacity||0)>0&&<div style={{position:"absolute",inset:0,background:\`rgba(0,0,0,\${(cfg.overlayOpacity||0)/100})\`}}/>}`
  );
  changes++;
  console.log('  ✓ Updated hero preview to support video background');
}

// 3d. Fix the text z-index in the hero preview to sit above the video
if (portals.includes('<div style={{position:"relative"}}>\n        {cfg.eyebrow')) {
  portals = portals.replace(
    '<div style={{position:"relative"}}>\n        {cfg.eyebrow',
    '<div style={{position:"relative",zIndex:2}}>\n        {cfg.eyebrow'
  );
  changes++;
  console.log('  ✓ Fixed hero text z-index above video');
}

// Fix the text color to be white when video is active
if (portals.includes('color: cfg.bgImage&&(cfg.overlayOpacity||0)>20?"#fff":t.textColor')) {
  portals = portals.replace(
    'color: cfg.bgImage&&(cfg.overlayOpacity||0)>20?"#fff":t.textColor',
    'color: cfg.videoUrl||( cfg.bgImage&&(cfg.overlayOpacity||0)>20)?"#fff":t.textColor'
  );
  // Also fix the subheading
  portals = portals.replace(
    'color: cfg.bgImage&&(cfg.overlayOpacity||0)>20?"rgba(255,255,255,.8)":t.textColor',
    'color: cfg.videoUrl||(cfg.bgImage&&(cfg.overlayOpacity||0)>20)?"rgba(255,255,255,.8)":t.textColor'
  );
  changes++;
  console.log('  ✓ Hero text auto-switches to white when video is active');
}

// ============================================================================
// RENDERER: Update PortalPageRenderer for live video hero
// ============================================================================

// 3e. Update HeroWidget in PortalPageRenderer to support video
const RENDERER_HERO = `const HeroWidget = ({ cfg, theme }) => {`;
if (renderer.includes(RENDERER_HERO)) {
  // Find the existing HeroWidget and add video support
  const heroIdx = renderer.indexOf(RENDERER_HERO);
  const heroEnd = renderer.indexOf('\n};\n', heroIdx) + 4;
  const oldHero = renderer.slice(heroIdx, heroEnd);
  
  const newHero = `const HeroWidget = ({ cfg, theme }) => {
  const t = theme
  const pr = t.primaryColor || '#4361EE'
  const bg = t.bgColor || '#fff'
  const tc = cfg.videoUrl || (cfg.bgImage && (cfg.overlayOpacity||0) > 20) ? '#FFFFFF' : (t.textColor || '#0F1729')
  const tcSub = cfg.videoUrl || (cfg.bgImage && (cfg.overlayOpacity||0) > 20) ? 'rgba(255,255,255,.8)' : (t.textColor || '#0F1729')
  const ff = t.fontFamily || "'Inter', sans-serif"
  const hf = t.headingFont || ff
  const br = t.buttonRadius || '8px'
  const hw = parseInt(t.headingWeight) || 700
  const align = cfg.align || 'center'
  const padding = cfg.videoUrl ? '100px 24px' : (cfg.bgImage ? '80px 24px' : '64px 24px')

  return (
    <div style={{
      padding, textAlign: align, position: 'relative', overflow: 'hidden',
      minHeight: cfg.videoUrl ? 420 : 'auto',
      display: cfg.videoUrl ? 'flex' : 'block',
      alignItems: cfg.videoUrl ? 'center' : undefined,
      justifyContent: cfg.videoUrl ? 'center' : undefined,
      background: cfg.videoUrl ? '#0F1729'
        : cfg.bgImage ? \`url(\${cfg.bgImage}) center/cover no-repeat\`
        : \`linear-gradient(135deg, \${pr}12, \${t.secondaryColor || pr}08)\`,
    }}>
      {cfg.videoUrl && (
        <video autoPlay loop muted playsInline
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit: cfg.videoFit || 'cover', zIndex:0 }}
          src={cfg.videoUrl}/>
      )}
      {cfg.videoUrl && cfg.videoOverlayDarken && (
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1 }}/>
      )}
      {!cfg.videoUrl && cfg.bgImage && (cfg.overlayOpacity||0) > 0 && (
        <div style={{ position:'absolute', inset:0, background:\`rgba(0,0,0,\${(cfg.overlayOpacity||0)/100})\` }}/>
      )}
      <div style={{ position:'relative', zIndex:2, maxWidth: cfg.videoUrl ? '720px' : '800px', margin:'0 auto' }}>
        {cfg.eyebrow && (
          <div style={{ fontSize:13, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color: cfg.videoUrl ? 'rgba(255,255,255,.7)' : pr, marginBottom:12, fontFamily:ff }}>
            {cfg.eyebrow}
          </div>
        )}
        <h2 style={{ fontSize: cfg.videoUrl ? 48 : 36, fontWeight:hw, color:tc, fontFamily:hf, margin:'0 0 16px', lineHeight:1.15 }}>
          {cfg.headline || 'Your Compelling Headline'}
        </h2>
        {cfg.subheading && <p style={{ margin:'0 0 32px', fontSize: cfg.videoUrl ? 20 : 18, color:tcSub, lineHeight:1.6, opacity:0.9 }}>{cfg.subheading}</p>}
        <div style={{ display:'flex', gap:12, justifyContent: align === 'center' ? 'center' : 'flex-start', flexWrap:'wrap' }}>
          {cfg.primaryCta && (
            <a href={cfg.primaryCtaLink||'#'} style={{ display:'inline-block', padding: cfg.videoUrl ? '16px 36px' : '14px 32px', borderRadius:br, background:'#FFFFFF', color:pr, fontWeight:700, fontSize: cfg.videoUrl ? 17 : 16, textDecoration:'none', fontFamily:ff }}>
              {cfg.primaryCta}
            </a>
          )}
          {cfg.secondaryCta && (
            <a href={cfg.secondaryCtaLink||'#'} style={{ display:'inline-block', padding: cfg.videoUrl ? '16px 36px' : '14px 32px', borderRadius:br, background:'transparent', color:tc, fontWeight:700, fontSize: cfg.videoUrl ? 17 : 16, textDecoration:'none', border:\`2px solid \${tc}\`, fontFamily:ff }}>
              {cfg.secondaryCta}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};`;

  renderer = renderer.slice(0, heroIdx) + newHero + renderer.slice(heroEnd);
  changes++;
  console.log('  ✓ Updated PortalPageRenderer HeroWidget with video support');
}

// ============================================================================
// WRITE FILES
// ============================================================================

fs.writeFileSync(PORTALS_PATH, portals);
fs.writeFileSync(RENDERER_PATH, renderer);

console.log(`\n✅ Done — ${changes} changes applied.\n`);
console.log('Features added:');
console.log('  1. Top nav tidy — compact toolbar, page tabs scroll, Brand/Domain/Settings in "⋯" overflow menu');
console.log('  2. Unsaved changes — amber dot indicator, browser close warning, "Leave without saving?" dialog');
console.log('  3. Video hero — videoUrl field in hero settings, autoplay/loop/muted, darken overlay, cover/contain toggle');
console.log('\nRestart the dev server to see changes.');
