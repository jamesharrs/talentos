#!/usr/bin/env node
/**
 * Fix: Reports.jsx was using a bare fetch() api object with no session headers.
 * Replace it with the shared apiClient.js which attaches X-Session-Id automatically.
 *
 * Run from: ~/projects/talentos
 *   node fix_reports_api.js
 */
const fs   = require('fs');
const path = require('path');

const REPORTS = path.join(__dirname, 'client/src/Reports.jsx');

if (!fs.existsSync(REPORTS)) {
  console.error('ERROR: client/src/Reports.jsx not found. Run from ~/projects/talentos');
  process.exit(1);
}

let src = fs.readFileSync(REPORTS, 'utf8');

// 1. Add the apiClient import right after the recharts import block
const RECHARTS_IMPORT = `} from "recharts";`;
if (!src.includes('import apiClient from')) {
  src = src.replace(
    RECHARTS_IMPORT,
    `} from "recharts";\nimport apiClient from "./apiClient.js";`
  );
  console.log('✓  Added apiClient import');
} else {
  console.log('SKIP  apiClient import already present');
}

// 2. Replace the local api object with a thin wrapper around apiClient
//    The local api object starts right after the recharts import and has 4 methods
const OLD_API = `const api = {
  get:    p    => fetch(p).then(r=>r.json()).catch(()=>null),
  post:   (p,b)=> fetch(p,{method:"POST",  headers:{"Content-Type":"application/json"},body:JSON.stringify(b)}).then(r=>r.json()).catch(()=>null),
  patch:  (p,b)=> fetch(p,{method:"PATCH", headers:{"Content-Type":"application/json"},body:JSON.stringify(b)}).then(r=>r.json()).catch(()=>null),
  delete: p    => fetch(p,{method:"DELETE"}).then(r=>r.json()).catch(()=>null),
};`;

const NEW_API = `// Use shared apiClient so session headers (X-Session-Id etc.) are attached
const api = {
  get:    p    => apiClient.get(p).catch(()=>null),
  post:   (p,b)=> apiClient.post(p,b).catch(()=>null),
  patch:  (p,b)=> apiClient.patch(p,b).catch(()=>null),
  delete: p    => apiClient.delete(p).catch(()=>null),
};`;

if (src.includes(OLD_API)) {
  src = src.replace(OLD_API, NEW_API);
  console.log('✓  Replaced local api object with apiClient wrapper');
} else {
  // Try a more flexible match — maybe whitespace differs
  const re = /const api = \{[\s\S]*?get:.*?fetch\(p\)[\s\S]*?delete:.*?fetch\(p[\s\S]*?\};/;
  if (re.test(src)) {
    src = src.replace(re, NEW_API);
    console.log('✓  Replaced local api object (flexible match)');
  } else {
    console.log('SKIP  local api object not found in expected form — checking if already fixed...');
    if (src.includes('apiClient.get')) {
      console.log('      Already using apiClient — no change needed');
    } else {
      console.log('      Could not locate api object. Manual fix required:');
      console.log('      Replace the "const api = {" block near the top of Reports.jsx');
      console.log('      with the NEW_API string in this script.');
    }
  }
}

fs.writeFileSync(REPORTS, src, 'utf8');
console.log('\n✅  Done. Build and deploy:');
console.log('   cd client && npx vite build 2>&1 | grep -E "error|✓"');
console.log('   cd .. && git add -A && git commit -m "fix: reports use apiClient for session auth" && git push origin main\n');
