#!/usr/bin/env node
// fix-settings-icons.js — Run: cd ~/projects/talentos && node fix-settings-icons.js

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'client/src/Settings.jsx');
if (!fs.existsSync(FILE)) {
  console.error('❌ Cannot find', FILE);
  process.exit(1);
}

let code = fs.readFileSync(FILE, 'utf8');
const original = code;

// ═══════════════════════════════════════════════════════════════════════════════
// 1. COMPREHENSIVE ICON PATHS — every icon referenced anywhere in Settings
// ═══════════════════════════════════════════════════════════════════════════════

const ALL_ICONS = {
  sun:            "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M17 12a5 5 0 11-10 0 5 5 0 0110 0z",
  globe:          "M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z",
  building:       "M3 21V5a2 2 0 012-2h6a2 2 0 012 2v16M13 21V9a2 2 0 012-2h4a2 2 0 012 2v12M3 21h18M7 9h.01M7 13h.01M7 17h.01M17 13h.01M17 17h.01",
  users:          "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 11a4 4 0 100-8 4 4 0 000 8z",
  layers:         "M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  shield:         "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  lock:           "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4",
  activity:       "M22 12h-4l-3 9L9 3l-3 9H2",
  key:            "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.78 7.78 5.5 5.5 0 017.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  database:       "M12 2C6.48 2 2 4.02 2 6.5v11C2 19.98 6.48 22 12 22s10-2.02 10-4.5v-11C22 4.02 17.52 2 12 2zM2 6.5C2 8.98 6.48 11 12 11s10-2.02 10-4.5M2 12c0 2.48 4.48 4.5 10 4.5s10-2.02 10-4.5",
  paperclip:      "M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48",
  form:           "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M8 13h8M8 17h8M8 9h2",
  workflow:       "M22 12h-4l-3 9L9 3l-3 9H2",
  sparkles:       "M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zM5 19l.7 2.1L7.8 22l-2.1.7L5 24.8l-.7-2.1L2.2 22l2.1-.7L5 19z",
  zap:            "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  bot:            "M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7v1H3v-1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zM7.5 13a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM16.5 13a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM3 18h18v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2z",
  "help-circle":  "M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10zM9.1 9a3 3 0 015.8 1c0 2-3 3-3 3M12 17h.01",
  briefcase:      "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2",
  refresh:        "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
  plus:           "M12 5v14M5 12h14",
  settings:       "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  check:          "M20 6L9 17l-5-5",
  x:              "M18 6L6 18M6 6l12 12",
  search:         "M11 17.25a6.25 6.25 0 110-12.5 6.25 6.25 0 010 12.5zM16 16l4.5 4.5",
  edit:           "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  trash:          "M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2",
  clipboard:      "M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M15 2H9a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1z",
  mail:           "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  monitor:        "M20 3H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V5a2 2 0 00-2-2zM8 21h8M12 17v4",
  "bar-chart-2":  "M18 20V10M12 20V4M6 20v-6",
  dollar:         "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  calendar:       "M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18",
  star:           "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  filter:         "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  "git-branch":   "M6 3v12M18 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zM18 9a9 9 0 01-9 9",
  user:           "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  chevD:          "M6 9l6 6 6-6",
  chevR:          "M9 18l6-6-6-6",
  loader:         "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
  "file-text":    "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  link:           "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
  target:         "M12 22a10 10 0 100-20 10 10 0 000 20zM12 18a6 6 0 100-12 6 6 0 000 12zM12 14a2 2 0 100-4 2 2 0 000 4z",
  download:       "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  cpu:            "M18 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2zM9 9h6v6H9z",
  send:           "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  home:           "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  grid:           "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  list:           "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1: Find and replace the PATHS object
// ═══════════════════════════════════════════════════════════════════════════════

const newPathsBlock = 'const PATHS = {\n' +
  Object.entries(ALL_ICONS).map(([k, v]) => `  "${k}":"${v}"`).join(',\n') +
  '\n}';

// Find "const PATHS = {" and replace up to matching "}"
const pathsStart = code.indexOf('const PATHS = {');
if (pathsStart !== -1) {
  let depth = 0, end = -1;
  for (let i = pathsStart; i < code.length; i++) {
    if (code[i] === '{') depth++;
    if (code[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  if (end !== -1) {
    code = code.slice(0, pathsStart) + newPathsBlock + code.slice(end);
    console.log('✅ Replaced PATHS object with', Object.keys(ALL_ICONS).length, 'icons');
  }
} else {
  // Try "paths = {"
  const altStart = code.indexOf('paths = {');
  if (altStart !== -1) {
    let depth = 0, end = -1;
    for (let i = altStart + 8; i < code.length; i++) {
      if (code[i] === '{') depth++;
      if (code[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
    }
    if (end !== -1) {
      const before = code.lastIndexOf('\n', altStart);
      code = code.slice(0, before + 1) + newPathsBlock + ';\n' + code.slice(end);
      console.log('✅ Replaced paths object with', Object.keys(ALL_ICONS).length, 'icons');
    }
  } else {
    // Insert before Ic component
    const icIdx = code.indexOf('function Ic') !== -1 ? code.indexOf('function Ic') : code.indexOf('const Ic');
    if (icIdx !== -1) {
      code = code.slice(0, icIdx) + newPathsBlock + ';\n\n' + code.slice(icIdx);
      console.log('✅ Inserted PATHS before Ic component');
    } else {
      console.log('❌ Cannot find PATHS or Ic component');
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2: Make section headings clearer — bolder, darker, with accent bar
// ═══════════════════════════════════════════════════════════════════════════════

const lines = code.split('\n');
let headingsFixed = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('textTransform') && line.includes('uppercase') &&
      (line.includes('fontSize:10') || line.includes('fontSize: 10') ||
       line.includes('fontSize:11') || line.includes('fontSize: 11'))) {
    lines[i] = lines[i]
      .replace(/fontSize:\s*10/, 'fontSize:11')
      .replace(/fontWeight:\s*600/, 'fontWeight:800')
      .replace(/fontWeight:\s*700/, 'fontWeight:800');
    if (lines[i].includes('C.text3')) {
      lines[i] = lines[i].replace(/C\.text3/, 'C.text2');
    }
    if (!lines[i].includes('borderLeft')) {
      lines[i] = lines[i].replace(
        /paddingLeft:\s*(\d+)/,
        'paddingLeft:10,borderLeft:`3px solid ${C.accent}`,borderRadius:0'
      );
    }
    headingsFixed++;
  }
}

if (headingsFixed > 0) {
  code = lines.join('\n');
  console.log('✅ Updated', headingsFixed, 'section heading(s) — bolder + accent bar');
} else {
  console.log('ℹ️  No uppercase heading patterns found to update');
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3: Check for any icon references that are still missing
// ═══════════════════════════════════════════════════════════════════════════════

const iconRefs = [...code.matchAll(/icon:\s*"([^"]+)"/g)];
const missing = new Set();
for (const m of iconRefs) {
  if (!ALL_ICONS[m[1]]) missing.add(m[1]);
}
if (missing.size > 0) {
  console.log('⚠️  Still missing icon paths for:', [...missing].join(', '));
} else {
  console.log('✅ All referenced icons have paths');
}

// ═══════════════════════════════════════════════════════════════════════════════
// WRITE
// ═══════════════════════════════════════════════════════════════════════════════

if (code !== original) {
  fs.writeFileSync(FILE, code);
  console.log('\n✅ Settings.jsx updated! Vite will hot-reload.\n');
} else {
  console.log('\nℹ️  No changes needed.\n');
}
