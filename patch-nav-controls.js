#!/usr/bin/env node
/**
 * patch-nav-controls.js
 * Run from the repo root: node patch-nav-controls.js
 *
 * Adds to the portal nav editor (both inline popover + side drawer):
 *   - Logo height slider (20–80 px)
 *   - Logo max-width slider (60–300 px)
 *   - Nav bar height slider (44–120 px)
 *   - Border bottom toggle + colour picker
 *   - Shadow strength select (none / subtle / medium / strong)
 *   - Logo alignment toggle (left / centre)
 *   - Link font-size slider (12–18 px)
 *   - Per-link "CTA button" flag
 *
 * Updates PortalNav in PortalPageRenderer.jsx to read all new values.
 */

const fs = require('fs');
const path = require('path');

const PORTALS  = path.join(__dirname, 'client/src/Portals.jsx');
const RENDERER = path.join(__dirname, 'client/src/portals/PortalPageRenderer.jsx');

if (!fs.existsSync(PORTALS))  { console.error('ERROR: ' + PORTALS  + ' not found'); process.exit(1); }
if (!fs.existsSync(RENDERER)) { console.error('ERROR: ' + RENDERER + ' not found'); process.exit(1); }

let portals  = fs.readFileSync(PORTALS,  'utf8');
let renderer = fs.readFileSync(RENDERER, 'utf8');

// ─── Guard — don't apply twice ───────────────────────────────────────────────
if (portals.includes('nav.logoHeight')) {
  console.log('Already patched — skipping Portals.jsx');
} else {

  // ── 1. Extend defaultNav to include new fields ─────────────────────────────
  portals = portals.replace(
    /const defaultNav = \(\) => \(\{([^}]+)\}\)/,
    `const defaultNav = () => ({$1, logoHeight:36, logoMaxWidth:160, navHeight:64,
  borderBottom:true, borderColor:'', shadow:'subtle',
  logoAlign:'left', linkFontSize:14 })`
  );
  // Fallback if the above didn't match (single-line version):
  if (!portals.includes('logoHeight')) {
    portals = portals.replace(
      `const defaultNav = () => ({ logoText:'', logoUrl:'', bgColor:'', textColor:'', sticky:true,`,
      `const defaultNav = () => ({ logoText:'', logoUrl:'', bgColor:'', textColor:'', sticky:true, logoHeight:36, logoMaxWidth:160, navHeight:64, borderBottom:true, borderColor:'', shadow:'subtle', logoAlign:'left', linkFontSize:14,`
    );
  }
  console.log('defaultNav extended');

  // ── 2. Enhance the InlineNav popover editor ────────────────────────────────
  //    The popover currently has a 2-col grid with Logo URL + Logo text, then colours.
  //    We insert new controls after the colour pickers and before the links section.
  const OLD_POPOVER_COLOURS = `<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>{lbl("Logo URL")}<input value={nav.logoUrl||""} onChange={e=>set("logoUrl",e.target.value)} placeholder="https://…/logo.svg" style={inp}/></div>
            <div>{lbl("Logo text (fallback)")}<input value={nav.logoText||""} onChange={e=>set("logoText",e.target.value)} placeholder="Company" style={inp}/></d`;

  // We replace only the opening of that grid — we'll insert new sections after it.
  // Since the popover is complex, instead insert a NEW block just before the links section.
  // Find the "Nav links" heading inside the popover to insert before it.
  const POPOVER_LINKS_ANCHOR = `{lbl("Links")}<`;  // label just before the links list inside popover

  const NEW_POPOVER_CONTROLS = `{/* ── Logo sizing ── */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              {lbl("Logo height (px)")}
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <input type="range" min={20} max={80} value={nav.logoHeight||36}
                  onChange={e=>set("logoHeight",+e.target.value)}
                  style={{flex:1,accentColor:C.accent}}/>
                <span style={{fontSize:12,color:C.text2,minWidth:28}}>{nav.logoHeight||36}</span>
              </div>
            </div>
            <div>
              {lbl("Logo max-width (px)")}
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <input type="range" min={60} max={300} value={nav.logoMaxWidth||160}
                  onChange={e=>set("logoMaxWidth",+e.target.value)}
                  style={{flex:1,accentColor:C.accent}}/>
                <span style={{fontSize:12,color:C.text2,minWidth:32}}>{nav.logoMaxWidth||160}</span>
              </div>
            </div>
          </div>
          {/* ── Nav bar height ── */}
          <div>
            {lbl("Nav bar height (px)")}
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <input type="range" min={44} max={120} value={nav.navHeight||64}
                onChange={e=>set("navHeight",+e.target.value)}
                style={{flex:1,accentColor:C.accent}}/>
              <span style={{fontSize:12,color:C.text2,minWidth:28}}>{nav.navHeight||64}</span>
            </div>
          </div>
          {/* ── Shadow + border ── */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              {lbl("Shadow")}
              <select value={nav.shadow||"subtle"} onChange={e=>set("shadow",e.target.value)} style={{...inp,padding:"6px 8px"}}>
                <option value="none">None</option>
                <option value="subtle">Subtle</option>
                <option value="medium">Medium</option>
                <option value="strong">Strong</option>
              </select>
            </div>
            <div>
              {lbl("Border bottom")}
              <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
                <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:12,color:C.text2}}>
                  <input type="checkbox" checked={nav.borderBottom!==false}
                    onChange={e=>set("borderBottom",e.target.checked)}/>
                  Show
                </label>
                {nav.borderBottom!==false&&
                  <input type="color" value={nav.borderColor||"#e5e7eb"}
                    onChange={e=>set("borderColor",e.target.value)}
                    style={{width:28,height:24,borderRadius:5,border:`1px solid ${C.border}`,cursor:"pointer",padding:1}}/>
                }
              </div>
            </div>
          </div>
          {/* ── Logo alignment + link font size ── */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              {lbl("Logo position")}
              <div style={{display:"flex",gap:6,marginTop:4}}>
                {["left","center"].map(v=>(
                  <button key={v} onClick={()=>set("logoAlign",v)}
                    style={{flex:1,padding:"5px 8px",borderRadius:7,border:`1.5px solid ${nav.logoAlign===v?C.accent:C.border}`,
                      background:nav.logoAlign===v?`${C.accent}12`:"transparent",
                      color:nav.logoAlign===v?C.accent:C.text3,
                      fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:F,textTransform:"capitalize"}}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div>
              {lbl("Link font size (px)")}
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <input type="range" min={12} max={18} value={nav.linkFontSize||14}
                  onChange={e=>set("linkFontSize",+e.target.value)}
                  style={{flex:1,accentColor:C.accent}}/>
                <span style={{fontSize:12,color:C.text2,minWidth:24}}>{nav.linkFontSize||14}</span>
              </div>
            </div>
          </div>
          `;

  // Insert before the "Links" section in the popover
  if (portals.includes(POPOVER_LINKS_ANCHOR)) {
    portals = portals.replace(
      POPOVER_LINKS_ANCHOR,
      NEW_POPOVER_CONTROLS + POPOVER_LINKS_ANCHOR
    );
    console.log('Popover: new controls inserted');
  } else {
    console.warn('WARN: Could not find Links anchor in popover — skipping popover update');
  }

  // ── 3. Enhance per-link CTA flag in the popover link editor ───────────────
  // Each link row has label + href inputs. Add a CTA toggle after href.
  // The link row pattern is: updateLink(i,{href:…})
  const OLD_LINK_ROW_CLOSE = `updateLink(i,{href:e.target.value})} placeholder="/" style={{...inp,flex:1}}/>
                  <button onClick={()=>removeLink(i)}`;
  const NEW_LINK_ROW_CLOSE = `updateLink(i,{href:e.target.value})} placeholder="/" style={{...inp,flex:1}}/>
                  <label title="Show as CTA button" style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer",flexShrink:0}}>
                    <input type="checkbox" checked={!!lnk.isCta} onChange={e=>updateLink(i,{isCta:e.target.checked})}/>
                    <span style={{fontSize:10,color:C.text3,fontWeight:700}}>CTA</span>
                  </label>
                  <button onClick={()=>removeLink(i)}`;
  if (portals.includes(OLD_LINK_ROW_CLOSE)) {
    portals = portals.replace(OLD_LINK_ROW_CLOSE, NEW_LINK_ROW_CLOSE);
    console.log('Per-link CTA flag added in popover');
  } else {
    console.warn('WARN: Could not find link row close pattern — skipping CTA flag');
  }

  // ── 4. Enhance the NavEditor side drawer (full panel) ─────────────────────
  // The drawer currently ends with sticky toggle then a close button row.
  // We insert the new controls just before the links section in the drawer.
  const DRAWER_STICKY_END = `{lbl("Nav links")}`;
  const NEW_DRAWER_CONTROLS = `
          {/* ── Logo sizing ── */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              {lbl("Logo height (px)")}
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <input type="range" min={20} max={80} value={nav.logoHeight||36}
                  onChange={e=>set("logoHeight",+e.target.value)}
                  style={{flex:1,accentColor:C.accent}}/>
                <span style={{fontSize:12,color:C.text2,minWidth:28}}>{nav.logoHeight||36}</span>
              </div>
            </div>
            <div>
              {lbl("Logo max-width (px)")}
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <input type="range" min={60} max={300} value={nav.logoMaxWidth||160}
                  onChange={e=>set("logoMaxWidth",+e.target.value)}
                  style={{flex:1,accentColor:C.accent}}/>
                <span style={{fontSize:12,color:C.text2,minWidth:32}}>{nav.logoMaxWidth||160}</span>
              </div>
            </div>
          </div>
          <div>
            {lbl("Nav bar height (px)")}
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <input type="range" min={44} max={120} value={nav.navHeight||64}
                onChange={e=>set("navHeight",+e.target.value)}
                style={{flex:1,accentColor:C.accent}}/>
              <span style={{fontSize:12,color:C.text2,minWidth:28}}>{nav.navHeight||64}</span>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              {lbl("Shadow")}
              <select value={nav.shadow||"subtle"} onChange={e=>set("shadow",e.target.value)} style={{...inp,padding:"6px 8px"}}>
                <option value="none">None</option>
                <option value="subtle">Subtle</option>
                <option value="medium">Medium</option>
                <option value="strong">Strong</option>
              </select>
            </div>
            <div>
              {lbl("Logo position")}
              <div style={{display:"flex",gap:6,marginTop:2}}>
                {["left","center"].map(v=>(
                  <button key={v} onClick={()=>set("logoAlign",v)}
                    style={{flex:1,padding:"5px 8px",borderRadius:7,border:`1.5px solid ${nav.logoAlign===v?C.accent:C.border}`,
                      background:nav.logoAlign===v?`${C.accent}12`:"transparent",
                      color:nav.logoAlign===v?C.accent:C.text3,
                      fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:F,textTransform:"capitalize"}}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              {lbl("Border bottom")}
              <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
                <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:12,color:C.text2}}>
                  <input type="checkbox" checked={nav.borderBottom!==false}
                    onChange={e=>set("borderBottom",e.target.checked)}/>
                  Visible
                </label>
                {nav.borderBottom!==false&&
                  <input type="color" value={nav.borderColor||"#e5e7eb"}
                    onChange={e=>set("borderColor",e.target.value)}
                    title="Border colour"
                    style={{width:32,height:26,borderRadius:5,border:`1px solid ${C.border}`,cursor:"pointer",padding:2}}/>
                }
              </div>
            </div>
            <div>
              {lbl("Link font size (px)")}
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <input type="range" min={12} max={18} value={nav.linkFontSize||14}
                  onChange={e=>set("linkFontSize",+e.target.value)}
                  style={{flex:1,accentColor:C.accent}}/>
                <span style={{fontSize:12,color:C.text2,minWidth:24}}>{nav.linkFontSize||14}</span>
              </div>
            </div>
          </div>
          `;

  // Insert before "Nav links" label in the drawer
  if (portals.includes(DRAWER_STICKY_END)) {
    // Replace only the FIRST occurrence (drawer) not any subsequent ones
    const idx = portals.indexOf(DRAWER_STICKY_END);
    portals = portals.slice(0, idx) + NEW_DRAWER_CONTROLS + portals.slice(idx);
    console.log('Drawer: new controls inserted');
  } else {
    console.warn('WARN: Could not find "Nav links" label in drawer — skipping drawer update');
  }

  fs.writeFileSync(PORTALS, portals, 'utf8');
  console.log('Portals.jsx written');
}

// ─── Update PortalPageRenderer.jsx ──────────────────────────────────────────
if (renderer.includes('nav.logoHeight')) {
  console.log('PortalPageRenderer.jsx already patched — skipping');
} else {
  // Shadow lookup helper
  const SHADOW_MAP = `const NAV_SHADOW = {
  none:   'none',
  subtle: '0 1px 8px rgba(0,0,0,.06)',
  medium: '0 4px 20px rgba(0,0,0,.12)',
  strong: '0 8px 32px rgba(0,0,0,.22)',
};`;

  // Insert shadow map before PortalNav
  const NAV_ANCHOR = 'const PortalNav = (';
  if (renderer.includes(NAV_ANCHOR)) {
    renderer = renderer.replace(NAV_ANCHOR, SHADOW_MAP + '\n\n' + NAV_ANCHOR);
  }

  // Replace the PortalNav component with an enhanced version
  // Find the old nav component body — the key inner div that controls height:64
  const OLD_NAV_HEIGHT = `display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>
        {nav.logoUrl
          ? <img src={nav.logoUrl} alt={nav.logoText||portal.name} style={{ height:36, objectFit:'contain' }}/>`;

  const NEW_NAV_HEIGHT = `display:'flex', alignItems:'center',
        justifyContent: nav.logoAlign === 'center' ? 'center' : 'space-between',
        height: nav.navHeight || 64, position: 'relative' }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center',
          position: nav.logoAlign === 'center' ? 'absolute' : 'static',
          left: nav.logoAlign === 'center' ? '50%' : undefined,
          transform: nav.logoAlign === 'center' ? 'translateX(-50%)' : undefined }}>
          {nav.logoUrl
            ? <img src={nav.logoUrl} alt={nav.logoText||portal.name}
                style={{ height: nav.logoHeight || 36, maxWidth: nav.logoMaxWidth || 160, objectFit:'contain' }}
                onError={e=>e.target.style.display='none'}/>`;

  if (renderer.includes(OLD_NAV_HEIGHT)) {
    renderer = renderer.replace(OLD_NAV_HEIGHT, NEW_NAV_HEIGHT);
    console.log('PortalNav: logo sizing updated');
  } else {
    console.warn('WARN: Could not find height:64 block — trying fallback');
    // Fallback: just update the img height
    renderer = renderer.replace(
      `style={{ height:36, objectFit:'contain' }}`,
      `style={{ height: nav.logoHeight || 36, maxWidth: nav.logoMaxWidth || 160, objectFit:'contain' }}`
    );
  }

  // Update the nav element itself: height, shadow, border
  const OLD_NAV_STYLE = `background:bg, borderBottom:\`1px solid \${theme.primaryColor}18\`, boxShadow:'0 1px 8px rgba(0,0,0,.06)'`;
  const NEW_NAV_STYLE = `background:bg,
      borderBottom: nav.borderBottom === false ? 'none' : \`1px solid \${nav.borderColor || theme.primaryColor + '20'}\`,
      boxShadow: NAV_SHADOW[nav.shadow || 'subtle'] || NAV_SHADOW.subtle`;

  if (renderer.includes(OLD_NAV_STYLE)) {
    renderer = renderer.replace(OLD_NAV_STYLE, NEW_NAV_STYLE);
    console.log('PortalNav: shadow + border updated');
  } else {
    console.warn('WARN: Could not find nav style anchor — shadow/border not updated');
  }

  // Update link font size
  const OLD_LINK_FONT = `fontSize:14, fontWeight:500,`;
  const NEW_LINK_FONT = `fontSize: nav.linkFontSize || 14, fontWeight:500,`;
  renderer = renderer.replace(OLD_LINK_FONT, NEW_LINK_FONT);

  // Add CTA link styling — links with isCta get an accent-coloured button style
  // Find the navLinks.map() anchor in the renderer
  const OLD_NAVLINK_STYLE = `style={{ padding:'6px 12px', borderRadius:8, fontSize:14, fontWeight:500,
                    color:fg, textDecoration:'none', fontFamily:theme.fontFamily }}>
                  {lnk.label}`;
  const NEW_NAVLINK_STYLE = `style={lnk.isCta ? {
                    padding:'6px 16px', borderRadius:8, fontSize: nav.linkFontSize || 14, fontWeight:700,
                    color:'white', textDecoration:'none', fontFamily:theme.fontFamily,
                    background:theme.primaryColor, boxShadow:`0 2px 8px ${theme.primaryColor}40`,
                    transition:'opacity .15s'
                  } : {
                    padding:'6px 12px', borderRadius:8, fontSize: nav.linkFontSize || 14, fontWeight:500,
                    color:fg, textDecoration:'none', fontFamily:theme.fontFamily
                  }}>
                  {lnk.label}`;

  if (renderer.includes(OLD_NAVLINK_STYLE)) {
    renderer = renderer.replace(OLD_NAVLINK_STYLE, NEW_NAVLINK_STYLE);
    console.log('PortalNav: CTA link styling added');
  } else {
    // Try with single-line version
    renderer = renderer.replace(
      `color:fg, textDecoration:'none', fontFamily:theme.fontFamily }}>`,
      `color: lnk.isCta ? 'white' : fg, background: lnk.isCta ? theme.primaryColor : 'transparent',
                    textDecoration:'none', fontFamily:theme.fontFamily, borderRadius:8,
                    fontWeight: lnk.isCta ? 700 : 500, padding: lnk.isCta ? '6px 16px' : '6px 12px' }}>`
    );
    console.log('PortalNav: CTA styling (fallback)');
  }

  // Close the logo div we opened
  const OLD_LOGO_CLOSE = `: <div style={{ fontSize:18, fontWeight:800, color:theme.primaryColor, fontFamily:theme.headingFont||theme.fontFamily }}>
              {nav.logoText || portal.branding?.company_name || portal.name}
            </div>
        }`;
  const NEW_LOGO_CLOSE = `: <div style={{ fontSize:18, fontWeight:800, color:theme.primaryColor, fontFamily:theme.headingFont||theme.fontFamily }}>
              {nav.logoText || portal.branding?.company_name || portal.name}
            </div>
          }
        </div>`;

  if (renderer.includes(OLD_LOGO_CLOSE)) {
    renderer = renderer.replace(OLD_LOGO_CLOSE, NEW_LOGO_CLOSE);
    console.log('PortalNav: logo wrapper closed');
  }

  fs.writeFileSync(RENDERER, renderer, 'utf8');
  console.log('PortalPageRenderer.jsx written');
}

console.log('\n✅ Done. Run: cd client && npx vite build 2>&1 | grep -E "error:|✓ built" | head -5');
console.log('Then: git add -A && git commit -m "feat: extended nav controls — logo size, bar height, shadow, border, CTA links" && git push origin main');
