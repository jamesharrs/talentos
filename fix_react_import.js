#!/usr/bin/env node
/**
 * Fix "React is not defined" error
 * 
 * Problem: Several files use React.Fragment, React.useState, React.useRef etc.
 * but only import named exports from "react" — not the default React import.
 * 
 * Run from talentos root:
 *   node fix_react_import.js
 */
const fs = require('fs');
const path = require('path');

const files = [
  'client/src/OrgChart.jsx',
  'client/src/Records.jsx', 
  'client/src/Workflows.jsx',
];

let totalFixes = 0;

files.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`  ⚠ ${filePath} not found, skipping`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let fixes = 0;
  
  // Check if file uses React. directly
  const usesReactDot = /\bReact\.(Fragment|useState|useEffect|useRef|useCallback|useMemo|createElement|memo|createRef)\b/.test(content);
  
  if (!usesReactDot) {
    console.log(`  ✓ ${filePath} — no React. references found`);
    return;
  }
  
  // Check if React is already imported as default
  const hasDefaultImport = /import\s+React[\s,]/.test(content);
  
  if (hasDefaultImport) {
    console.log(`  ✓ ${filePath} — React already imported`);
    return;
  }
  
  // Add React to the existing import from "react"
  // Pattern: import { useState, useEffect, ... } from "react";
  const importPattern = /import\s*\{([^}]+)\}\s*from\s*["']react["']/;
  const match = content.match(importPattern);
  
  if (match) {
    const namedImports = match[1].trim();
    content = content.replace(
      importPattern,
      `import React, { ${namedImports} } from "react"`
    );
    fixes++;
    console.log(`  ✓ ${filePath} — added default React import`);
  } else {
    // No destructured import found, add a standalone import at the top
    content = `import React from "react";\n${content}`;
    fixes++;
    console.log(`  ✓ ${filePath} — added standalone React import`);
  }
  
  fs.writeFileSync(fullPath, content);
  totalFixes += fixes;
});

console.log(`\n✅ Done — ${totalFixes} file(s) fixed.`);
console.log('Commit and push:');
console.log('  git add -A && git commit -m "fix: add missing React default import" && git push origin main');
