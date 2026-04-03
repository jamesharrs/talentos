/**
 * fix-report-library.js
 * Run from ~/projects/talentos:  node server/fix-report-library.js
 *
 * Diagnoses the Reports.jsx panel structure then inserts:
 *   1. Library tab button
 *   2. Library panel JSX
 */
const fs   = require('fs');
const path = require('path');

const REPORTS = path.join(__dirname, '../client/src/Reports.jsx');
let src = fs.readFileSync(REPORTS, 'utf8');
const backup = src;

// ─── 1. Diagnose what panel patterns exist ─────────────────────────────────
console.log('\n── DIAGNOSING Reports.jsx panel structure ──');

// Find all setPanel calls to understand what tabs exist
const setPanelMatches = [...src.matchAll(/setPanel\(['"](\w+)['"]\)/g)];
const panels = [...new Set(setPanelMatches.map(m => m[1]))];
console.log('Panels found:', panels);

// Find all panel=== checks (for the JSX render blocks)
const panelCheckMatches = [...src.matchAll(/panel===?['"](\w+)['"]/g)];
const panelChecks = [...new Set(panelCheckMatches.map(m => m[1]))];
console.log('Panel checks found:', panelChecks);

// Already done?
if (src.includes("'library'") || src.includes('"library"')) {
  console.log('\n✅  Library tab already present — nothing to do.');
  process.exit(0);
}

// ─── 2. Find the tab list anchor ──────────────────────────────────────────
// The tab button list usually sits in a div with all the setPanel calls close together.
// Strategy: find any existing setPanel call that is NOT 'library', grab the button it
// belongs to, and insert a Library button before the FIRST tab button found.

let tabInsertIdx = -1;
let tabInsertBefore = '';

// Try each existing panel name until we find a <button ...setPanel(X)...
for (const p of panels) {
  const pStr   = `setPanel('${p}')`;
  const pStr2  = `setPanel("${p}")`;
  const setter = src.includes(pStr) ? pStr : (src.includes(pStr2) ? pStr2 : null);
  if (!setter) continue;

  const idx      = src.indexOf(setter);
  const btnStart = src.lastIndexOf('<button', idx);
  if (btnStart === -1) continue;

  tabInsertIdx    = btnStart;
  tabInsertBefore = p;
  console.log(`\nFound first tab button anchored on panel '${p}' at char ${btnStart}`);
  break;
}

// ─── 3. Build the Library tab button ──────────────────────────────────────
// Extract the first tab button's full text to mirror its styling exactly
let firstBtnText = '';
if (tabInsertIdx !== -1) {
  const endTag  = src.indexOf('</button>', tabInsertIdx) + 9;
  firstBtnText  = src.slice(tabInsertIdx, endTag);
  console.log('First tab button snippet:\n', firstBtnText.slice(0, 200), '...');
}

// Build library button — mirror the first button's style, swap label + panel name
const buildLibBtn = () => {
  if (!firstBtnText) {
    // Generic fallback
    return `<button onClick={()=>setPanel('library')} style={{padding:'6px 12px',borderRadius:8,border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:12,fontWeight:panel==='library'?700:500,background:panel==='library'?'var(--t-accent,#4361EE)':'transparent',color:panel==='library'?'white':'var(--t-text2,#6b7280)'}}>Library</button>`;
  }
  // Replace the panel name and label in a copy of the first button
  return firstBtnText
    .replace(new RegExp(`setPanel\\(['"]${tabInsertBefore}['"]\\)`, 'g'), "setPanel('library')")
    .replace(new RegExp(`panel===?['"]${tabInsertBefore}['"]`, 'g'),    "panel==='library'")
    .replace(new RegExp(`>\\s*(${tabInsertBefore.charAt(0).toUpperCase() + tabInsertBefore.slice(1)}|${tabInsertBefore})\\s*<`, 'i'), '>Library<')
    .replace(/>\s*(Saved|Templates?|Build|Builder|Formula|Formulas)\s*</i, '>Library<');
};

// ─── 4. Insert Library tab button ─────────────────────────────────────────
if (tabInsertIdx === -1) {
  console.warn('\n⚠️  Could not locate any tab button. Adding Library tab via a different approach.');
} else {
  const libBtn = buildLibBtn();
  src = src.slice(0, tabInsertIdx) + libBtn + '\n          ' + src.slice(tabInsertIdx);
  console.log('\n✅  Library tab button inserted before', tabInsertBefore, 'tab');
}

// ─── 5. Find where to insert the Library panel JSX ────────────────────────
// Strategy: look for the first `{panel==='X' && (` or `{panel==="X" && (`
// and insert our Library panel block just before it.

const PANEL_RENDER_RE = /\{panel===?['"](\w+)['"]\s*&&\s*\(/;
const renderMatch     = PANEL_RENDER_RE.exec(src);

let panelInsertIdx = -1;
if (renderMatch) {
  panelInsertIdx = renderMatch.index;
  console.log(`\nFound first panel render block (panel==='${renderMatch[1]}') at char ${renderMatch.index}`);
}

// ─── 6. Library panel JSX ─────────────────────────────────────────────────
const LIBRARY_PANEL = `
        {/* ─── LIBRARY PANEL ─────────────────────────────────────────── */}
        {panel==='library'&&(
          <div style={{display:'flex',flexDirection:'column',height:'100%',gap:10,overflow:'hidden'}}>
            {/* Search */}
            <input value={libSearch} onChange={e=>setLibSearch(e.target.value)}
              placeholder="Search 25 reports…"
              style={{padding:'7px 10px',borderRadius:8,border:'1.5px solid var(--t-border,#e5e7eb)',
                background:'var(--t-bg,#fff)',color:'var(--t-text1,#111)',fontSize:12,
                fontFamily:'inherit',width:'100%',boxSizing:'border-box'}}/>
            {/* Category pills */}
            <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
              {LIBRARY_CATEGORIES.map(cat=>(
                <button key={cat.id} onClick={()=>setLibCat(cat.id)} style={{
                  padding:'3px 9px',borderRadius:99,fontSize:11,
                  fontWeight:libCat===cat.id?700:500,cursor:'pointer',fontFamily:'inherit',
                  border:'1.5px solid '+(libCat===cat.id?'var(--t-accent,#4361EE)':'var(--t-border,#e5e7eb)'),
                  background:libCat===cat.id?'var(--t-accent,#4361EE)':'transparent',
                  color:libCat===cat.id?'white':'var(--t-text2,#6b7280)',
                }}>{cat.label}</button>
              ))}
            </div>
            {/* Cards */}
            <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:8,paddingRight:2}}>
              {REPORT_LIBRARY
                .filter(r=>libCat==='all'||r.category===libCat)
                .filter(r=>!libSearch||r.title.toLowerCase().includes(libSearch.toLowerCase())||r.description.toLowerCase().includes(libSearch.toLowerCase()))
                .map(r=>(
                  <div key={r.id} style={{background:'var(--t-surface,#fff)',border:'1.5px solid var(--t-border,#e5e7eb)',borderRadius:10,padding:'10px 12px',display:'flex',flexDirection:'column',gap:8}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:8}}>
                      <div style={{width:28,height:28,borderRadius:7,background:'var(--t-accent,#4361EE)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
                          <path d={CHART_ICON_PATHS[r.chartType]||'M18 20V10M12 20V4M6 20v-6'}/>
                        </svg>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:700,color:'var(--t-text1,#111)',lineHeight:1.3,marginBottom:2}}>{r.title}</div>
                        <div style={{fontSize:11,color:'var(--t-text3,#9ca3af)',lineHeight:1.4}}>{r.description}</div>
                      </div>
                      <span style={{padding:'2px 6px',borderRadius:99,fontSize:10,fontWeight:700,flexShrink:0,
                        background:'var(--t-accentLight,#eef2ff)',color:'var(--t-accent,#4361EE)'}}>{r.chartType}</span>
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      <button onClick={()=>loadLibraryReport(r)}
                        style={{flex:2,padding:'6px 0',borderRadius:7,border:'none',
                          background:'var(--t-accent,#4361EE)',color:'white',
                          fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                        Use Report
                      </button>
                      <button onClick={()=>copyLibraryReport(r)}
                        style={{flex:1,padding:'6px 0',borderRadius:7,
                          border:'1.5px solid var(--t-border,#e5e7eb)',background:'transparent',
                          color:'var(--t-text2,#6b7280)',fontSize:11,fontWeight:600,
                          cursor:'pointer',fontFamily:'inherit'}}>
                        Save copy
                      </button>
                    </div>
                  </div>
                ))}
              {REPORT_LIBRARY
                .filter(r=>(libCat==='all'||r.category===libCat)&&(!libSearch||r.title.toLowerCase().includes(libSearch.toLowerCase())))
                .length===0&&(
                <div style={{textAlign:'center',padding:30,color:'var(--t-text3,#9ca3af)',fontSize:12}}>
                  No reports match your search.
                </div>
              )}
            </div>
          </div>
        )}
`;

if (panelInsertIdx !== -1) {
  src = src.slice(0, panelInsertIdx) + LIBRARY_PANEL + '\n        ' + src.slice(panelInsertIdx);
  console.log('✅  Library panel JSX inserted');
} else {
  // Last resort: insert before the final </div> of the right panel column
  // Find the last panel check and insert after its closing block
  const lastPanel = [...src.matchAll(/\{panel===?['"]\w+['"]\s*&&\s*\(/g)].pop();
  if (lastPanel) {
    // Find the end of this panel block — look for matching )} after it
    let depth = 0, i = lastPanel.index, inserted = false;
    while (i < src.length) {
      if (src[i] === '(' || src[i] === '{') depth++;
      else if (src[i] === ')' || src[i] === '}') { depth--; if (depth <= 0) { i++; break; } }
      i++;
    }
    // Insert after this closing
    src = src.slice(0, i) + '\n' + LIBRARY_PANEL + src.slice(i);
    console.log('✅  Library panel JSX inserted (after last panel block)');
  } else {
    console.error('❌  Could not find any panel render block. Manual insertion needed.');
  }
}

// ─── 7. Also add CHART_ICON_PATHS constant if not there ───────────────────
if (!src.includes('CHART_ICON_PATHS')) {
  // Insert just before the default export / main function
  const exportIdx = src.indexOf('export default function');
  if (exportIdx !== -1) {
    src = src.slice(0, exportIdx)
      + `const CHART_ICON_PATHS = {
  bar:  'M18 20V10M12 20V4M6 20v-6',
  pie:  'M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z',
  line: 'M3 3v18h18M3 17l5-5 4 4 5-6',
  area: 'M3 17l5-5 4 4 5-6M3 21h18',
};\n\n`
      + src.slice(exportIdx);
    console.log('✅  Added CHART_ICON_PATHS constant');
  }
}

// ─── 8. Write ──────────────────────────────────────────────────────────────
if (src !== backup) {
  fs.writeFileSync(REPORTS, src, 'utf8');
  console.log('\n✅  Reports.jsx saved successfully\n');
} else {
  console.warn('\n⚠️  No changes written — file unchanged\n');
}

console.log('─────────────────────────────────────────────────────');
console.log('Now run:');
console.log('  git add -A && git commit -m "fix: report library tab + panel" && git push origin main');
console.log('─────────────────────────────────────────────────────\n');
