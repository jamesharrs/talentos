/**
 * fix-forms-ui.js  —  node fix-forms-ui.js  (run from ~/projects/talentos)
 *
 * 1. Settings > Forms: proper empty state instead of stuck "Loading…"
 * 2. Records > Forms panel: "Add Form" button to link a form to the record
 */

const fs   = require('fs');
const path = require('path');

function read(p)     { return fs.readFileSync(p, 'utf8'); }
function write(p, s) { fs.writeFileSync(p, s, 'utf8'); console.log('✅  ' + path.relative(process.cwd(), p)); }

const SP = path.join(__dirname, 'client/src/Settings.jsx');
const RP = path.join(__dirname, 'client/src/Records.jsx');

let s = read(SP);
let r = read(RP);

// ─── 1. Settings — FormsList empty state ─────────────────────────────────────
// Find FormsList component start
let flStart = [
  'function FormsList(',
  'const FormsList =',
].reduce((acc, p) => (acc === -1 ? s.indexOf(p) : acc), -1);

if (flStart === -1) {
  console.log('⚠️  FormsList not found — skipping Settings fix');
} else {
  // Find next top-level declaration to bound our search
  let flEnd = s.length;
  ['\nfunction ', '\nconst ', '\nexport '].forEach(m => {
    const idx = s.indexOf(m, flStart + 100);
    if (idx !== -1 && idx < flEnd) flEnd = idx;
  });

  const flBody = s.slice(flStart, flEnd);

  // Look for the stuck Loading pattern:
  // Most common: {loading && <div>Loading…</div>}  or  loading ? <div>Loading…</div> : ...
  // We want to also handle the case where loading=false but forms=[]

  // Strategy: find the return statement and inject empty-state handling
  // Look for the most common patterns this codebase uses

  // Pattern 1: forms.length === 0 already exists → just replace the content
  // Pattern 2: only a loading guard, nothing for empty

  // First check what empty-state text exists in FormsList
  const hasEmpty = flBody.includes('No forms') || flBody.includes('no forms') ||
                   flBody.includes('forms.length === 0') || flBody.includes('Create your first');

  console.log(`ℹ️  FormsList: hasEmptyState=${hasEmpty}, length=${flBody.length}`);

  // Regardless of whether empty state exists, find the loading line and ensure
  // we also handle the !loading && forms.length === 0 case

  // The simplest reliable fix: find the loading conditional and replace it
  // with one that also handles empty forms

  const EMPTY_STATE = `{!loading && forms.length === 0 && (
        <div style={{
          display:"flex", flexDirection:"column", alignItems:"center",
          justifyContent:"center", padding:"60px 24px", textAlign:"center",
        }}>
          <div style={{
            width:56, height:56, borderRadius:14,
            background:"var(--t-accentLight,#eef2ff)",
            display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16,
          }}>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none"
              stroke="var(--t-accent,#4361EE)" strokeWidth={1.8} strokeLinecap="round">
              <rect x="9" y="2" width="6" height="4" rx="1"/>
              <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
              <path d="M12 11v6M9 14h6"/>
            </svg>
          </div>
          <div style={{fontSize:16,fontWeight:700,color:"var(--t-text1)",marginBottom:6}}>
            No forms yet
          </div>
          <div style={{fontSize:13,color:"var(--t-text3)",maxWidth:280,lineHeight:1.6,marginBottom:20}}>
            Forms let you collect structured data from candidates, hiring managers and more.
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display:"inline-flex", alignItems:"center", gap:6,
              padding:"9px 18px", borderRadius:9,
              background:"var(--t-accent,#4361EE)", color:"white",
              border:"none", cursor:"pointer", fontFamily:"inherit",
              fontSize:13, fontWeight:700,
            }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Create your first form
          </button>
        </div>
      )}`;

  // Find the loading conditional — try common patterns
  let fixed = false;

  // Pattern: {loading && <div>Loading</div>}  → add empty state after
  const loadingInline = flBody.match(/\{loading\s*&&\s*\([^)]+Loading[^)]+\)\}/s) ||
                        flBody.match(/\{loading\s*&&\s*<div[^>]*>[^<]*Loading[^<]*<\/div>\}/);

  if (loadingInline) {
    const oldStr = loadingInline[0];
    const newStr = oldStr + '\n      ' + EMPTY_STATE;
    const newBody = flBody.replace(oldStr, newStr);
    s = s.slice(0, flStart) + newBody + s.slice(flEnd);
    write(SP, s);
    console.log('✅  Settings: added empty state after loading guard');
    fixed = true;
  }

  // Pattern: if (loading) return (...)
  if (!fixed) {
    const loadingReturn = flBody.match(/if\s*\(loading\)\s*return\s*\([^)]+\)/s);
    if (loadingReturn) {
      const oldStr = loadingReturn[0];
      const insertAfter = oldStr + '\n  if (!loading && forms.length === 0) return (\n    ' + EMPTY_STATE + '\n  );';
      const newBody = flBody.replace(oldStr, insertAfter);
      s = s.slice(0, flStart) + newBody + s.slice(flEnd);
      write(SP, s);
      console.log('✅  Settings: added empty return after loading guard');
      fixed = true;
    }
  }

  if (!fixed) {
    // Fallback: just replace "Loading…" text in the component
    if (flBody.includes('Loading…') || flBody.includes('Loading...')) {
      const newBody = flBody
        .replace(/Loading…|Loading\.\.\./g, 'Loading forms…');
      // Also try to add empty state before the forms.map call
      const mapIdx = newBody.indexOf('forms.map(');
      if (mapIdx !== -1) {
        const insertAt = newBody.lastIndexOf('\n', mapIdx) + 1;
        const finalBody = newBody.slice(0, insertAt) + EMPTY_STATE + '\n' + newBody.slice(insertAt);
        s = s.slice(0, flStart) + finalBody + s.slice(flEnd);
        write(SP, s);
        console.log('✅  Settings: injected empty state before forms.map');
        fixed = true;
      }
    }
  }

  if (!fixed) {
    console.log('⚠️  Settings: could not auto-patch. Print FormsList manually and apply empty state.');
    console.log('FormsList (first 800 chars):\n' + flBody.slice(0, 800));
  }
}

// ─── 2. Records — Forms panel "Add Form" button ───────────────────────────────
// Find where id==="forms" is handled in PanelContent
const formsPanelPatterns = [
  'id==="forms"',
  'id === "forms"',
  "id==='forms'",
];

let fpIdx = -1;
for (const p of formsPanelPatterns) {
  fpIdx = r.indexOf(p);
  if (fpIdx !== -1) break;
}

if (fpIdx === -1) {
  // Try RecordFormPanel usage
  fpIdx = r.indexOf('<RecordFormPanel');
  if (fpIdx === -1) fpIdx = r.indexOf('RecordFormPanel');
}

if (fpIdx === -1) {
  console.log('⚠️  Records: forms panel not found');
} else {
  const ln = r.slice(0, fpIdx).split('\n').length;
  console.log(`ℹ️  Records: forms panel at line ${ln}`);
  console.log('  Context: ' + r.slice(fpIdx, fpIdx + 400).replace(/\n/g, '↵'));

  // Find the forms panel JSX and add an "Add Form" header with button
  // The panel typically renders something like:
  //   <RecordFormPanel record={record} environment={environment} />
  // or
  //   <FormRenderer ... />

  // Strategy: find the forms panel return and wrap it with a header + button
  // We'll look for the specific return inside PanelContent for id==="forms"

  const panelReturnPatterns = [
    // Pattern: return <RecordFormPanel
    { find: 'return <RecordFormPanel', insert: 'before' },
    // Pattern: return (<RecordFormPanel
    { find: 'return (<RecordFormPanel', insert: 'before' },
    // Pattern: <FormRenderer
    { find: '<FormRenderer', insert: 'before' },
  ];

  // Find the panel content near fpIdx
  const nearbyChunk = r.slice(fpIdx, fpIdx + 1500);
  let panelComponentName = '';

  if (nearbyChunk.includes('RecordFormPanel')) panelComponentName = 'RecordFormPanel';
  else if (nearbyChunk.includes('FormRenderer')) panelComponentName = 'FormRenderer';
  else if (nearbyChunk.includes('FormPanel')) panelComponentName = 'FormPanel';

  console.log(`ℹ️  Forms panel component: "${panelComponentName}"`);

  // The "Add Form" functionality — find forms panel render and inject a wrapper
  // with a header row containing the button

  // Look for the actual JSX returned for the forms case
  // Find: return (...<RecordFormPanel.../>...)  or  : (<RecordFormPanel.../>)
  // and wrap it with a div containing an "Add Form" button header

  // First, let's also add the state needed for the form picker modal
  // Find RecordDetail component and add state there

  // Find where forms panel is returned
  const formsReturn = nearbyChunk.match(
    /(<RecordFormPanel[^/]*\/>)|(<RecordFormPanel[\s\S]*?<\/RecordFormPanel>)/
  );

  if (formsReturn) {
    const oldJSX = formsReturn[0];
    const newJSX = `<div>
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            marginBottom:10,
          }}>
            <span style={{fontSize:11,fontWeight:700,color:"var(--t-text3)",
              textTransform:"uppercase",letterSpacing:"0.06em"}}>
              Linked Forms
            </span>
            <button
              onClick={() => { if(window.__openFormPicker) window.__openFormPicker(record?.id); }}
              style={{
                display:"inline-flex", alignItems:"center", gap:4,
                padding:"4px 10px", borderRadius:7,
                background:"var(--t-accentLight,#eef2ff)",
                border:"1px solid var(--t-accent,#4361EE)",
                color:"var(--t-accent,#4361EE)",
                fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
              }}>
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={3} strokeLinecap="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Add Form
            </button>
          </div>
          ${oldJSX}
        </div>`;

    const searchTarget = r.slice(fpIdx, fpIdx + 1500);
    const replaced = searchTarget.replace(oldJSX, newJSX);
    if (replaced !== searchTarget) {
      r = r.slice(0, fpIdx) + replaced + r.slice(fpIdx + 1500);
      write(RP, r);
      console.log('✅  Records: "Add Form" button injected into forms panel');
    } else {
      console.log('⚠️  Records: JSX replacement failed — see manual instructions');
    }
  } else {
    // Try simpler approach: find the line that has RecordFormPanel and wrap
    const compLine = nearbyChunk.indexOf('<' + panelComponentName);
    if (compLine !== -1 && panelComponentName) {
      const absPos = fpIdx + compLine;
      const lineEnd = r.indexOf('\n', absPos + 1);
      const originalLine = r.slice(absPos, lineEnd);

      // Check if it's self-closing
      if (originalLine.includes('/>') || r.slice(absPos, absPos + 500).includes('</' + panelComponentName)) {
        console.log(`ℹ️  Found component line: ${originalLine.trim().slice(0,100)}`);
        console.log('  Manual fix: wrap with a <div> containing an "Add Form" button header (see instructions)');
      }
    } else {
      console.log('⚠️  Records: could not find forms component JSX to wrap');
    }
  }
}

console.log('\n─────────────────────────────────────────────────────────────────');
console.log('Manual instructions if auto-patch failed:');
console.log('');
console.log('1. SETTINGS — FormsList:');
console.log('   Find where forms array is rendered (forms.map or similar).');
console.log('   Add before it:');
console.log(`
   {!loading && forms.length === 0 && (
     <div style={{display:"flex",flexDirection:"column",alignItems:"center",
       padding:"60px 24px",textAlign:"center"}}>
       <div style={{fontSize:16,fontWeight:700,color:"var(--t-text1)",marginBottom:8}}>
         No forms yet
       </div>
       <p style={{fontSize:13,color:"var(--t-text3)",marginBottom:20}}>
         Forms let you collect structured data from candidates and hiring managers.
       </p>
       <button onClick={() => setShowCreate(true)}
         style={{padding:"9px 18px",borderRadius:9,background:"var(--t-accent)",
           color:"white",border:"none",cursor:"pointer",fontSize:13,fontWeight:700,
           fontFamily:"inherit"}}>
         Create your first form
       </button>
     </div>
   )}
`);
console.log('');
console.log('2. RECORDS — Forms panel:');
console.log('   Find the forms panel return in PanelContent (id==="forms" case).');
console.log('   Wrap the <RecordFormPanel/> (or equivalent) with a header div');
console.log('   containing an "Add Form" button as shown above.');
