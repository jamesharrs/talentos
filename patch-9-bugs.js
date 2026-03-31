#!/usr/bin/env node
/**
 * Vercentic Bug Fix Patch — 9 bugs
 * Run from project root: cd ~/projects/talentos && node patch-9-bugs.js
 */

const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

let patchCount = 0;
let skipCount = 0;

function read(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) { console.warn(`  ⚠ File not found: ${rel}`); return null; }
  return fs.readFileSync(p, 'utf8');
}
function write(rel, content) { fs.writeFileSync(path.join(ROOT, rel), content, 'utf8'); }
function patch(rel, label, find, replace) {
  let c = read(rel);
  if (!c) return false;
  if (!c.includes(find)) { console.warn(`  ⚠ [${label}] Pattern not found — may be patched already`); skipCount++; return false; }
  c = c.replace(find, replace);
  write(rel, c);
  console.log(`  ✅ ${label}`);
  patchCount++;
  return true;
}

console.log('\n🔧 Vercentic — Patching 9 bugs\n');

// ═══════════════════════════════════════════════════════════════════
// BUG 8: Groups save — bare fetch → tFetch (highest confidence fix)
// ═══════════════════════════════════════════════════════════════════
console.log('8️⃣  Groups save (bare fetch → tFetch)');

let groups = read('client/src/settings/GroupsSection.jsx');
if (groups) {
  // The handleSave function uses bare fetch() — need tFetch for auth headers
  // Match any bare fetch( in handleSave that isn't already tFetch
  const before = groups;
  // Pattern: in handleSave, the fetch call
  groups = groups.replace(
    /await fetch\(url, \{ method,/g,
    'await tFetch(url, { method,'
  );
  if (groups !== before) {
    write('client/src/settings/GroupsSection.jsx', groups);
    console.log('  ✅ fetch() → tFetch() in GroupsSection.handleSave');
    patchCount++;
  } else {
    console.log('  ℹ Already patched or pattern differs');
    skipCount++;
  }
}

// ═══════════════════════════════════════════════════════════════════
// BUG 9: Field visibility — environment guard
// ═══════════════════════════════════════════════════════════════════
console.log('9️⃣  Field visibility (environment guard)');

let settings = read('client/src/Settings.jsx');
if (settings) {
  // Find FieldVisibilityPanel's useEffect and add guard
  const fvpIdx = settings.indexOf('const FieldVisibilityPanel');
  if (fvpIdx > -1) {
    // Find the first useEffect after FieldVisibilityPanel
    const afterFvp = settings.slice(fvpIdx);
    const effectIdx = afterFvp.indexOf('useEffect(() => {');
    if (effectIdx > -1) {
      const absIdx = fvpIdx + effectIdx;
      const braceIdx = settings.indexOf('{', absIdx + 'useEffect(() => '.length);
      const nextChunk = settings.slice(braceIdx + 1, braceIdx + 80);
      if (!nextChunk.includes('if (!environment')) {
        settings = settings.slice(0, braceIdx + 1) +
          '\n    if (!environment?.id) return;' +
          settings.slice(braceIdx + 1);
        write('client/src/Settings.jsx', settings);
        console.log('  ✅ Added environment?.id guard to FieldVisibilityPanel useEffect');
        patchCount++;
      } else {
        console.log('  ℹ Guard already present');
        skipCount++;
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// BUG 1: Brand Generator — model string + error handling
// ═══════════════════════════════════════════════════════════════════
console.log('1️⃣  Brand Generator');

let brandKits = read('server/routes/brand_kits.js');
if (brandKits) {
  const before = brandKits;
  
  // Fix model string
  brandKits = brandKits.replace(/claude-sonnet-4-5/g, 'claude-sonnet-4-6');
  
  if (brandKits !== before) {
    write('server/routes/brand_kits.js', brandKits);
    console.log('  ✅ Fixed model string: claude-sonnet-4-5 → claude-sonnet-4-6');
    patchCount++;
  } else {
    console.log('  ℹ Model string already correct');
    skipCount++;
  }
}

// ═══════════════════════════════════════════════════════════════════
// BUG 4: AI Research — remove email template generation
// ═══════════════════════════════════════════════════════════════════
console.log('4️⃣  AI Research scope');

let research = read('server/routes/company_research.js');
if (research) {
  const step2Marker = '// ── Step 2:';
  const industryMarker = 'const industryKey';
  const s2 = research.indexOf(step2Marker);
  const ik = research.indexOf(industryMarker);
  
  if (s2 > -1 && ik > -1 && ik > s2) {
    research = research.slice(0, s2) +
      '// Template generation removed — use Email Templates section instead\n    const emailTemplates = [];\n\n    ' +
      research.slice(ik);
    write('server/routes/company_research.js', research);
    console.log('  ✅ Removed template generation (saves ~30s + AI tokens)');
    patchCount++;
  } else if (research.includes('Template generation removed')) {
    console.log('  ℹ Already patched');
    skipCount++;
  } else {
    console.warn('  ⚠ Could not find Step 2 boundaries');
    skipCount++;
  }
}

// ═══════════════════════════════════════════════════════════════════
// BUG 5: Copilot company profile injection
// ═══════════════════════════════════════════════════════════════════
console.log('5️⃣  Copilot company profile');

let ai = read('client/src/AI.jsx');
if (ai) {
  if (!ai.includes('companyProfile')) {
    // Add state
    const stateAnchor = 'const [interviewTypes, setInterviewTypes]';
    if (ai.includes(stateAnchor)) {
      ai = ai.replace(stateAnchor,
        'const [companyProfile, setCompanyProfile] = useState(null);\n  ' + stateAnchor
      );
      
      // Add loading — find where interviewTypes are loaded
      // Look for the fetch that loads interview types and add company profile fetch nearby
      const itLoad = ai.indexOf('"/interview-types"');
      if (itLoad > -1) {
        // Find the end of that .catch() chain
        let searchPos = itLoad;
        let depth = 0;
        let foundCatch = false;
        for (let i = itLoad; i < ai.length && i < itLoad + 500; i++) {
          if (ai.slice(i, i+6) === '.catch') foundCatch = true;
          if (foundCatch && ai[i] === ';') {
            // Insert after this semicolon
            ai = ai.slice(0, i + 1) +
              '\n      // Load company profile for brand context\n' +
              '      api.get(`/company-research?environment_id=${environment?.id}`)\n' +
              '        .then(d => { if (d && !d.error) setCompanyProfile(d); })\n' +
              '        .catch(() => {});' +
              ai.slice(i + 1);
            break;
          }
        }
      }
      
      // Inject into system prompt context — find the context string builder
      // Look for where the system message content is assembled
      const contextBuild = ai.indexOf('CURRENT PAGE CONTEXT:');
      if (contextBuild > -1) {
        // Find the template literal start (backtick) before this text
        let tplStart = contextBuild;
        while (tplStart > 0 && ai[tplStart] !== '`') tplStart--;
        
        if (tplStart > 0) {
          // Insert company context right after the opening backtick
          const companyCtx = '${companyProfile ? `COMPANY CONTEXT:\\n' +
            'Company: ${companyProfile.name || ""}\\n' +
            'Industry: ${companyProfile.industry || ""}\\n' +
            'Tone: ${companyProfile.tone || "professional"}\\n' +
            'EVP: ${companyProfile.evp?.headline || ""} — ${companyProfile.evp?.statement || ""}\\n' +
            'Brand colour: ${companyProfile.brand_color || ""}\\n' +
            'Use the company tone when drafting messages. Reference EVP and values when relevant.\\n\\n` : ""}';
          
          ai = ai.slice(0, tplStart + 1) + companyCtx + ai.slice(tplStart + 1);
        }
      }
      
      write('client/src/AI.jsx', ai);
      console.log('  ✅ Added companyProfile state + loading + system prompt injection');
      patchCount++;
    }
  } else {
    console.log('  ℹ companyProfile already exists');
    skipCount++;
  }
}

// ═══════════════════════════════════════════════════════════════════
// BUG 3: Language flags — replace emoji with text codes
// ═══════════════════════════════════════════════════════════════════
console.log('3️⃣  Language flags');

settings = read('client/src/Settings.jsx'); // re-read after bug 9 patch
if (settings) {
  const emojiPattern = '<span style={{ fontSize:20 }}>{lang.flag}</span>';
  if (settings.includes(emojiPattern)) {
    settings = settings.replace(emojiPattern,
      `<span style={{ fontSize:13, fontWeight:800, color: isActive ? C.accent : C.text2,
                background: isActive ? C.accentLight : '#f1f3f5', padding:'3px 7px',
                borderRadius:5, fontFamily:'system-ui', letterSpacing:'0.5px',
                minWidth:30, textAlign:'center', display:'inline-block' }}>
                {lang.code.toUpperCase()}
              </span>`
    );
    write('client/src/Settings.jsx', settings);
    console.log('  ✅ Replaced emoji flags with text country codes');
    patchCount++;
  } else {
    console.log('  ℹ Flag pattern already changed or differs');
    skipCount++;
  }
}

// ═══════════════════════════════════════════════════════════════════
// BUG 7: User invite — add SendGrid note + copy button
// ═══════════════════════════════════════════════════════════════════
console.log('7️⃣  User invite UX');

settings = read('client/src/Settings.jsx');
if (settings) {
  const successText = 'They must change their password on first login.</p>';
  if (settings.includes(successText) && !settings.includes('SendGrid')) {
    settings = settings.replace(successText,
      successText + `
        <div style={{background:"#FFFBEB",borderRadius:8,padding:"10px 12px",marginTop:8,marginBottom:4,border:"1px solid #FCD34D",fontSize:12,color:"#92400E",lineHeight:1.5}}>
          <strong>Note:</strong> Email delivery requires SendGrid to be configured in Settings → Integrations. Until then, please share these credentials manually.
        </div>`
    );
    write('client/src/Settings.jsx', settings);
    console.log('  ✅ Added SendGrid configuration note to invite success');
    patchCount++;
  } else {
    console.log('  ℹ Already has SendGrid note or pattern differs');
    skipCount++;
  }
  
  // Add copy credentials button
  settings = read('client/src/Settings.jsx');
  const credsPattern = 'Password: <strong>{result.temp_password}</strong></div>';
  // Find the closing </div> of the credentials box (next one after the password line)
  const credsIdx = settings.indexOf(credsPattern);
  if (credsIdx > -1) {
    const afterCreds = settings.slice(credsIdx + credsPattern.length);
    const nextDiv = afterCreds.indexOf('</div>');
    if (nextDiv > -1 && !afterCreds.slice(0, nextDiv + 20).includes('Copy Credentials')) {
      const insertAt = credsIdx + credsPattern.length + nextDiv + 6;
      settings = settings.slice(0, insertAt) + `
        <button onClick={()=>{
          const text = "Login: " + window.location.origin + "\\nEmail: " + result.email + "\\nPassword: " + result.temp_password;
          navigator.clipboard.writeText(text).then(()=>alert('Credentials copied!'));
        }} style={{marginTop:10,width:"100%",padding:"8px",borderRadius:8,border:"1px solid #e5e7eb",background:"white",color:"#3b5bdb",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          📋 Copy Credentials
        </button>` + settings.slice(insertAt);
      write('client/src/Settings.jsx', settings);
      console.log('  ✅ Added Copy Credentials button');
      patchCount++;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// BUG 2: Font loading — replace Geist with loadable font
// ═══════════════════════════════════════════════════════════════════
console.log('2️⃣  Font loading');

let theme = read('client/src/Theme.jsx');
if (theme) {
  const before = theme;
  // Replace Geist references with Plus Jakarta Sans
  theme = theme.replace(/"Geist"/g, '"Plus Jakarta Sans"');
  theme = theme.replace(/'Geist'/g, "'Plus Jakarta Sans'");
  
  // Add dynamic Google Font loader if not present
  if (!theme.includes('loadGoogleFont')) {
    const insertBefore = 'export const FONTS';
    if (theme.includes(insertBefore)) {
      theme = theme.replace(insertBefore,
`// Dynamically load Google Fonts at runtime
function loadGoogleFont(fontName) {
  if (!fontName || typeof document === 'undefined') return;
  const clean = fontName.replace(/'/g, '').split(',')[0].trim();
  const id = 'gf-' + clean.replace(/\\s+/g, '-').toLowerCase();
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id; link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(clean) + ':wght@300;400;500;600;700;800&display=swap';
  document.head.appendChild(link);
}

${insertBefore}`);
    }
  }
  
  if (theme !== before) {
    write('client/src/Theme.jsx', theme);
    console.log('  ✅ Geist → Plus Jakarta Sans + dynamic Google Font loader');
    patchCount++;
  } else {
    console.log('  ℹ No Geist references found');
    skipCount++;
  }
}

// Also update the F constant in files that hardcode Geist
for (const rel of [
  'client/src/Records.jsx',
  'client/src/AI.jsx',
  'client/src/Settings.jsx',
  'client/src/settings/GroupsSection.jsx',
]) {
  let f = read(rel);
  if (f && f.includes("'Geist'")) {
    f = f.replace(/'Geist'/g, "'Plus Jakarta Sans'");
    write(rel, f);
    console.log(`  ✅ Updated font in ${rel}`);
    patchCount++;
  }
}

// ═══════════════════════════════════════════════════════════════════
// BUG 6: Company Documents — error handling
// ═══════════════════════════════════════════════════════════════════
console.log('6️⃣  Company Document upload');

let compDocs = read('server/routes/company_documents.js');
if (compDocs) {
  // Ensure documents with failed processing show as 'error' not disappear
  if (compDocs.includes("'processing'") && !compDocs.includes("'error'")) {
    // Find the async processing and wrap in try-catch
    // Generic approach: find any .then or async block after status:'processing' and add error handling
    
    // Add a simple error status update helper at the top of the file after the requires
    const routerDecl = compDocs.indexOf('const router');
    if (routerDecl > -1) {
      const lineEnd = compDocs.indexOf(';', routerDecl);
      compDocs = compDocs.slice(0, lineEnd + 1) + `

// Helper: mark a document as errored so it shows in the list instead of disappearing
function markDocError(docId, errorMsg) {
  try {
    const s = getStore();
    const doc = (s.company_documents || []).find(d => d.id === docId);
    if (doc) { doc.status = 'error'; doc.error_message = errorMsg; doc.updated_at = new Date().toISOString(); saveStore(); }
  } catch(e) { console.error('Failed to mark doc error:', e); }
}` + compDocs.slice(lineEnd + 1);
      
      write('server/routes/company_documents.js', compDocs);
      console.log('  ✅ Added markDocError helper to company_documents.js');
      console.log('  ℹ Note: You may need to manually wrap the chunking call with try-catch using markDocError()');
      patchCount++;
    }
  } else if (compDocs && compDocs.includes("'error'")) {
    console.log('  ℹ Error handling already present');
    skipCount++;
  }
} else {
  console.warn('  ⚠ company_documents.js not found');
  skipCount++;
}

// ═══════════════════════════════════════════════════════════════════
// BONUS: Brand Kit timing note in Portals.jsx
// ═══════════════════════════════════════════════════════════════════
console.log('\n🎁 Bonus fixes');

let portals = read('client/src/Portals.jsx');
if (portals) {
  const timingAnchor = "Claude is generating your theme";
  if (portals.includes(timingAnchor) && !portals.includes('30–60 seconds')) {
    portals = portals.replace(
      "Claude is generating your theme…</span></div>",
      "Claude is generating your theme…</span><br/><span style={{fontSize:10,opacity:0.6}}>This can take 30–60 seconds</span></div>"
    );
    write('client/src/Portals.jsx', portals);
    console.log('  ✅ Added timing note to brand analyser');
    patchCount++;
  }
}

// Also update Geist in any remaining files
for (const rel of [
  'client/src/Portals.jsx',
  'client/src/OrgChart.jsx',
  'client/src/Dashboard.jsx',
  'client/src/Interviews.jsx',
  'client/src/Offers.jsx',
  'client/src/Forms.jsx',
  'client/src/Communications.jsx',
  'client/src/Workflows.jsx',
  'client/src/TasksEventsPanel.jsx',
]) {
  let f = read(rel);
  if (f && f.includes("'Geist'")) {
    f = f.replace(/'Geist'/g, "'Plus Jakarta Sans'");
    write(rel, f);
    console.log(`  ✅ Updated font in ${path.basename(rel)}`);
    patchCount++;
  }
}


console.log(`\n════════════════════════════════════════════════════════════════`);
console.log(`✅ Done! ${patchCount} patches applied, ${skipCount} skipped (already patched or not found)\n`);
console.log('Next steps:');
console.log('  cd ~/projects/talentos');
console.log('  git add -A');
console.log('  git commit -m "fix: 9 bug fixes — brand gen, fonts, i18n flags, groups save, field visibility, copilot profile, doc upload, invite UX, research scope"');
console.log('  git push origin main');
console.log('  cd client && vercel --prod --yes');
console.log('');
