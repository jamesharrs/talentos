#!/usr/bin/env node
/**
 * Fix "portalSnapshot is not defined" in Portals.jsx
 * 
 * The unsaved-changes patch partially applied — it added references to
 * portalSnapshot but the definition didn't land. This script either:
 * a) Adds the missing definition, OR
 * b) Removes the broken references if it can't find the right insertion point
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client/src/Portals.jsx');
if (!fs.existsSync(filePath)) {
  console.error('Cannot find client/src/Portals.jsx — run from talentos root.');
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');
let changes = 0;

// Check if portalSnapshot is already properly defined
if (content.includes('const portalSnapshot')) {
  console.log('portalSnapshot is already defined — no fix needed.');
  process.exit(0);
}

// Check if portalSnapshot is referenced anywhere
const refs = (content.match(/portalSnapshot/g) || []).length;
if (refs === 0) {
  console.log('portalSnapshot is not referenced — no fix needed.');
  process.exit(0);
}

console.log(`Found ${refs} reference(s) to portalSnapshot but no definition.\n`);

// Strategy A: Try to add the definition before the portal useState
// Look for the portal state initialization
const portalStatePattern = /const \[portal, setPortal\] = useState\(\(\) => \{/;
const match = content.match(portalStatePattern);

if (match) {
  // Insert portalSnapshot definition just before portal state
  const definition = `const portalSnapshot = React.useCallback((p) => JSON.stringify({
    name:p.name, pages:p.pages, theme:p.theme, nav:p.nav, footer:p.footer, status:p.status
  }), []);
  `;
  
  content = content.replace(
    portalStatePattern,
    definition + match[0]
  );
  changes++;
  console.log('✓ Added portalSnapshot definition before portal state');
} else {
  // Strategy B: Can't find the insertion point — remove all references instead
  console.log('Cannot find portal state pattern. Removing broken references...\n');
  
  // Remove the dirty tracking useEffect if it references portalSnapshot
  // This is a multi-line block — safest to just replace portalSnapshot calls with inline versions
  
  // Replace: savedSnapshotRef.current = portalSnapshot(portal);
  content = content.replace(
    /savedSnapshotRef\.current\s*=\s*portalSnapshot\(portal\);?/g,
    'savedSnapshotRef.current = JSON.stringify({name:portal.name,pages:portal.pages,theme:portal.theme,nav:portal.nav,footer:portal.footer,status:portal.status});'
  );
  
  // Replace: const current = portalSnapshot(portal);
  content = content.replace(
    /const current\s*=\s*portalSnapshot\(portal\);?/g,
    'const current = JSON.stringify({name:portal.name,pages:portal.pages,theme:portal.theme,nav:portal.nav,footer:portal.footer,status:portal.status});'
  );
  
  // Any remaining portalSnapshot references — just inline them
  content = content.replace(
    /portalSnapshot\(portal\)/g,
    'JSON.stringify({name:portal.name,pages:portal.pages,theme:portal.theme})'
  );
  
  // Remove portalSnapshot from useEffect dependencies if present
  content = content.replace(/, portalSnapshot/g, '');
  content = content.replace(/portalSnapshot, /g, '');
  
  changes++;
  console.log('✓ Inlined all portalSnapshot references');
}

// Also check that savedSnapshotRef is defined
if (content.includes('savedSnapshotRef') && !content.includes('const savedSnapshotRef')) {
  // Check for React.useRef version
  if (!content.includes('savedSnapshotRef = React.useRef') && !content.includes('savedSnapshotRef = useRef')) {
    // Add it near isDirty state
    if (content.includes('const [isDirty, setIsDirty]')) {
      content = content.replace(
        'const [isDirty, setIsDirty] = useState(false);',
        'const [isDirty, setIsDirty] = useState(false);\n  const savedSnapshotRef = React.useRef(null);'
      );
      changes++;
      console.log('✓ Added savedSnapshotRef definition');
    }
  }
}

// Check isDirty is defined
if (content.includes('isDirty') && !content.includes('const [isDirty')) {
  // Add isDirty state near saving state
  if (content.includes('const [saving, setSaving] = useState(false)')) {
    content = content.replace(
      'const [saving, setSaving] = useState(false);',
      'const [saving, setSaving] = useState(false);\n  const [isDirty, setIsDirty] = useState(false);\n  const savedSnapshotRef = React.useRef(null);'
    );
    changes++;
    console.log('✓ Added isDirty state + savedSnapshotRef');
  }
}

fs.writeFileSync(filePath, content);
console.log(`\n✅ Done — ${changes} fix(es) applied.`);
console.log('Push: git add -A && git commit -m "fix: portalSnapshot definition" && git push origin main');
