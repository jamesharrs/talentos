#!/usr/bin/env node
/**
 * Fix "React is not defined" — comprehensive scan of ALL .jsx files
 * 
 * Run from talentos root:
 *   node fix_react_all.js
 */
const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  let results = [];
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      if (item === 'node_modules' || item === 'dist' || item === '.git') continue;
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        results = results.concat(walkDir(full));
      } else if (item.endsWith('.jsx') || item.endsWith('.js')) {
        results.push(full);
      }
    }
  } catch {}
  return results;
}

const srcDir = path.join(__dirname, 'client/src');
if (!fs.existsSync(srcDir)) {
  console.error('Cannot find client/src — run this from the talentos project root.');
  process.exit(1);
}

const files = walkDir(srcDir);
let totalFixed = 0;
const fixed = [];
const alreadyOk = [];

for (const filePath of files) {
  const content = fs.readFileSync(filePath, 'utf8');
  const rel = path.relative(__dirname, filePath);
  
  // Check if file uses React. directly (React.Fragment, React.useState, React.useRef, React.createElement, etc.)
  const reactDotUsages = content.match(/\bReact\.\w+/g);
  if (!reactDotUsages || reactDotUsages.length === 0) {
    continue; // No React. usage, skip
  }
  
  // Check if React is already imported as default
  const hasDefaultImport = /import\s+React[\s,{]/.test(content) || /import\s+React\s+from/.test(content);
  
  if (hasDefaultImport) {
    alreadyOk.push(rel);
    continue;
  }
  
  // Needs fixing — add React default import
  let newContent = content;
  
  // Try to add to existing destructured import from "react"
  const importPattern = /import\s*\{([^}]+)\}\s*from\s*["']react["']/;
  const match = newContent.match(importPattern);
  
  if (match) {
    const namedImports = match[1].trim();
    newContent = newContent.replace(
      importPattern,
      `import React, { ${namedImports} } from "react"`
    );
  } else {
    // No destructured import — check for any import from react
    const anyReactImport = /import\s+.*from\s*["']react["']/;
    if (anyReactImport.test(newContent)) {
      // Has some import from react but not destructured — add React, in front
      newContent = newContent.replace(
        anyReactImport,
        (m) => m.replace('import ', 'import React, ')
      );
    } else {
      // No react import at all — add one at the top
      newContent = `import React from "react";\n${newContent}`;
    }
  }
  
  fs.writeFileSync(filePath, newContent);
  fixed.push({ file: rel, usages: [...new Set(reactDotUsages)] });
  totalFixed++;
}

console.log('\n=== React Import Fix — Full Scan ===\n');

if (fixed.length > 0) {
  console.log(`Fixed ${fixed.length} file(s):\n`);
  fixed.forEach(f => {
    console.log(`  ✓ ${f.file}`);
    console.log(`    Uses: ${f.usages.join(', ')}`);
  });
} else {
  console.log('  No files needed fixing.');
}

if (alreadyOk.length > 0) {
  console.log(`\nAlready OK (${alreadyOk.length} files with React. usage + correct import):`);
  alreadyOk.forEach(f => console.log(`  ✓ ${f}`));
}

console.log(`\nScanned ${files.length} files total.\n`);

if (totalFixed > 0) {
  console.log('Now deploy:');
  console.log('  git add -A && git commit -m "fix: React import in all files" && git push origin main');
  console.log('  cd client && vercel --prod --yes');
  console.log('\nThen hard-refresh: Cmd+Shift+R / Ctrl+Shift+R');
}
