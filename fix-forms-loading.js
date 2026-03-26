/**
 * fix-forms-loading.js  —  node fix-forms-loading.js  (from ~/projects/talentos)
 *
 * Fixes the stuck "Loading..." in Settings > Forms.
 * Root cause: API call fails/returns nothing → setLoading(false) never runs.
 * Fix: wrap fetch in try/catch + always call setLoading(false) in finally.
 * Also adds a proper empty state.
 */

const fs   = require('fs');
const path = require('path');
const fp   = path.join(__dirname, 'client/src/Settings.jsx');
let   src  = fs.readFileSync(fp, 'utf8');

// ── Find FormsList ────────────────────────────────────────────────────────────
const flIdx = src.indexOf('function FormsList(') !== -1
  ? src.indexOf('function FormsList(')
  : src.indexOf('const FormsList =');

if (flIdx === -1) { console.log('❌  FormsList not found'); process.exit(1); }

// Find next top-level declaration to bound the component
let flEnd = src.length;
['\nfunction ', '\nconst ', '\nexport '].forEach(m => {
  const idx = src.indexOf(m, flIdx + 200);
  if (idx !== -1 && idx < flEnd) flEnd = idx;
});

const body = src.slice(flIdx, flEnd);
console.log('ℹ️  FormsList (' + body.length + ' chars). First 600:');
console.log(body.slice(0, 600).replace(/\n/g,'↵'));

// ── Find the useEffect / fetch call ──────────────────────────────────────────
// Look for api.get('/forms') or fetch('/api/forms')
const fetchPatterns = [
  "api.get('/forms",
  'api.get("/forms',
  "api.get(`/forms",
  "fetch('/api/forms",
  'fetch("/api/forms',
];

let fetchFound = false;
for (const pat of fetchPatterns) {
  const idx = body.indexOf(pat);
  if (idx !== -1) {
    console.log('\n✅  Found fetch: ' + pat);
    console.log('  Context: ' + body.slice(Math.max(0, idx-80), idx+200).replace(/\n/g,'↵'));
    fetchFound = true;
    break;
  }
}
if (!fetchFound) {
  console.log('\n⚠️  No fetch found with known patterns. Searching for "forms" fetch:');
  const lines = body.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('forms') && (l.includes('api.') || l.includes('fetch'))) {
      console.log(`  line ${i+1}: ${l.trim()}`);
    }
  });
}

// ── Find setLoading(false) ────────────────────────────────────────────────────
const setLoadingFalse = body.indexOf('setLoading(false)');
console.log('\nsetLoading(false) count in FormsList: ' +
  (body.match(/setLoading\(false\)/g)||[]).length);

if (setLoadingFalse === -1) {
  console.log('⚠️  setLoading(false) NOT found — this is the bug!');
} else {
  console.log('ℹ️  setLoading(false) at offset ' + setLoadingFalse);
  console.log('  Context: ' + body.slice(Math.max(0, setLoadingFalse-100), setLoadingFalse+50).replace(/\n/g,'↵'));
}

// ── Strategy: find the useEffect and rewrite it safely ───────────────────────
// Find the useEffect that does the forms fetch
const ueIdx = body.indexOf('useEffect(');
if (ueIdx !== -1) {
  console.log('\nℹ️  useEffect at offset ' + ueIdx);
  console.log('  ' + body.slice(ueIdx, ueIdx + 400).replace(/\n/g,'↵'));
}

// ── Apply the fix ─────────────────────────────────────────────────────────────
// Strategy 1: if there's a useEffect with a fetch but no try/catch/finally,
// wrap the fetch in try/catch/finally with setLoading(false)

let fixed = false;

// Find pattern: api.get(... forms ...).then(d => { setForms(...); setLoading(false) })
// or: api.get(...).then(...).then(...) with no catch

// Simple targeted fix: ensure setLoading(false) always runs
// Replace: .then(d => { setForms(...) }) 
// With:    .then(d => { setForms(...); setLoading(false); }).catch(() => setLoading(false))
// But more robust: replace the whole useEffect

// Find useEffect block in the full source (not just body slice)
const ueFullIdx = src.indexOf('useEffect(', flIdx);
if (ueFullIdx !== -1 && ueFullIdx < flEnd) {
  // Find the matching closing of this useEffect
  let depth = 0, pos = ueFullIdx + 'useEffect('.length;
  while (pos < src.length) {
    if (src[pos] === '(') depth++;
    if (src[pos] === ')') { if (depth === 0) { pos++; break; } depth--; }
    pos++;
  }
  // pos is now just after the useEffect closing )
  // The semicolon might follow
  if (src[pos] === ';') pos++;

  const ueBlock = src.slice(ueFullIdx, pos);
  console.log('\nℹ️  Full useEffect:\n' + ueBlock.slice(0, 500).replace(/\n/g,'↵'));

  // Check if it already has try/catch or finally
  if (ueBlock.includes('try') || ueBlock.includes('catch') || ueBlock.includes('finally')) {
    console.log('ℹ️  useEffect already has try/catch/finally');
    // Just make sure setLoading(false) is in the finally block
    if (!ueBlock.includes('setLoading(false)')) {
      // Add it
      const patched = ueBlock.replace(
        /finally\s*\{/,
        'finally { setLoading(false);'
      );
      if (patched !== ueBlock) {
        src = src.slice(0, ueFullIdx) + patched + src.slice(pos);
        fs.writeFileSync(fp, src, 'utf8');
        console.log('✅  Added setLoading(false) to existing finally block');
        fixed = true;
      }
    }
  } else {
    // No try/catch — find the fetch call and wrap it
    // Replace: api.get(`...`).then(...)
    // With: try { const d = await api.get(`...`); ... } catch{} finally { setLoading(false); }
    
    // Simpler: just add .catch(() => setLoading(false)) after the chain
    // and ensure setLoading(false) is called in .then too
    
    // Find the end of the .then chain
    const thenEnd = ueBlock.lastIndexOf('.then(');
    if (thenEnd !== -1) {
      // Find the closing of the last .then
      let d2 = 0, p2 = thenEnd + 6;
      while (p2 < ueBlock.length) {
        if (ueBlock[p2] === '(') d2++;
        if (ueBlock[p2] === ')') { if (d2 === 0) { p2++; break; } d2--; }
        p2++;
      }
      const afterThen = ueBlock.slice(0, p2) +
        '\n        .catch(e => { console.error("FormsList fetch error:", e); setLoading(false); })\n        .finally(() => setLoading(false))' +
        ueBlock.slice(p2);
      
      // Also ensure setLoading(false) is inside the .then callback
      src = src.slice(0, ueFullIdx) + afterThen + src.slice(pos);
      fs.writeFileSync(fp, src, 'utf8');
      console.log('✅  Added .catch + .finally(() => setLoading(false)) to fetch chain');
      fixed = true;
    }
  }
}

// ── Add empty state regardless ────────────────────────────────────────────────
// Re-read after possible write
src = fs.readFileSync(fp, 'utf8');
const bodyAfter = src.slice(src.indexOf('function FormsList(') !== -1
  ? src.indexOf('function FormsList(')
  : src.indexOf('const FormsList ='), flEnd > src.length ? src.length : flEnd + 500);

const hasEmpty = bodyAfter.includes('No forms') || bodyAfter.includes('forms.length === 0');
if (!hasEmpty) {
  // Find where forms.map( is and inject before it
  const mapIdx = src.indexOf('forms.map(', src.indexOf('function FormsList(') !== -1
    ? src.indexOf('function FormsList(')
    : src.indexOf('const FormsList ='));
  
  if (mapIdx !== -1 && mapIdx < flEnd + 1000) {
    const lineStart = src.lastIndexOf('\n', mapIdx) + 1;
    const EMPTY = `        {!loading && forms.length === 0 && (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",
            padding:"60px 24px",textAlign:"center"}}>
            <svg width={40} height={40} viewBox="0 0 24 24" fill="none"
              stroke="var(--t-accent,#4361EE)" strokeWidth={1.5} strokeLinecap="round"
              style={{marginBottom:16,opacity:0.4}}>
              <rect x="9" y="2" width="6" height="4" rx="1"/>
              <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
              <path d="M12 11v6M9 14h6"/>
            </svg>
            <div style={{fontSize:16,fontWeight:700,color:"var(--t-text1)",marginBottom:6}}>
              No forms yet
            </div>
            <div style={{fontSize:13,color:"var(--t-text3)",maxWidth:280,lineHeight:1.6,marginBottom:20}}>
              Forms let you collect structured data from candidates, hiring managers and more.
            </div>
            <button onClick={() => setShowCreate && setShowCreate(true)}
              style={{display:"inline-flex",alignItems:"center",gap:6,
                padding:"9px 18px",borderRadius:9,
                background:"var(--t-accent,#4361EE)",color:"white",
                border:"none",cursor:"pointer",fontFamily:"inherit",
                fontSize:13,fontWeight:700}}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={3} strokeLinecap="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Create your first form
            </button>
          </div>
        )}\n`;
    src = src.slice(0, lineStart) + EMPTY + src.slice(lineStart);
    fs.writeFileSync(fp, src, 'utf8');
    console.log('✅  Empty state added before forms.map');
  } else {
    console.log('⚠️  Could not find forms.map to inject empty state');
  }
}

console.log('\nDone. Key issue: setLoading(false) was never called on API error.');
console.log('Now: .finally(() => setLoading(false)) ensures loading always clears.');
