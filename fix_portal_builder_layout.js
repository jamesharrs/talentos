#!/usr/bin/env node
/**
 * Fix portal builder:
 * 1. More menu dropdown renders behind canvas — z-index fix
 * 2. Portal builder should go full-screen, hiding the app sidebar
 * 
 * Run from talentos root:
 *   node fix_portal_builder_layout.js
 */
const fs = require('fs');
const path = require('path');

const PORTALS = path.join(__dirname, 'client/src/Portals.jsx');
const SETTINGS = path.join(__dirname, 'client/src/Settings.jsx');

let changes = 0;

// ── Fix 1: Portals.jsx — More menu z-index ──────────────────────────────────
if (fs.existsSync(PORTALS)) {
  let p = fs.readFileSync(PORTALS, 'utf8');

  // The More menu dropdown has position:absolute with zIndex:300.
  // The canvas area below it has its own stacking context.
  // Fix: bump the More menu dropdown zIndex to 600+ and ensure the
  // top bar itself creates a stacking context above the canvas.

  // Fix the top bar z-index — it's the parent of the More menu
  // Current: height:48 or height:52, no zIndex
  if (p.includes('background:C.surface,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center"')) {
    // Add zIndex to the top bar div
    if (!p.includes('zIndex:200,') || !p.match(/height:4[28],.*zIndex/)) {
      p = p.replace(
        /height:4[28],background:C\.surface,borderBottom:`1px solid \$\{C\.border\}`,display:"flex",alignItems:"center"/,
        (match) => match.replace('display:"flex"', 'zIndex:200,position:"relative",display:"flex"')
      );
      changes++;
      console.log('  ✓ Added zIndex:200 to portal builder top bar');
    }
  }

  // Fix the More menu dropdown zIndex — bump from 300 to 700
  if (p.includes('zIndex:300,minWidth:160')) {
    p = p.replace('zIndex:300,minWidth:160', 'zIndex:700,minWidth:160');
    changes++;
    console.log('  ✓ Bumped More menu dropdown zIndex to 700');
  }

  // Also fix the backdrop behind the More menu
  if (p.includes('onClick={()=>setShowMoreMenu(false)} style={{position:"fixed",inset:0,zIndex:299'))  {
    p = p.replace('zIndex:299', 'zIndex:699');
    changes++;
    console.log('  ✓ Bumped More menu backdrop zIndex to 699');
  }

  // ── Fix 2: Make PortalBuilder full-screen with position:fixed ──────────────
  // The PortalBuilder component currently renders inside the Settings page
  // content area (with the sidebar still visible). We need it to go full-screen
  // by using position:fixed;inset:0 on its outer wrapper.
  
  // Find the PortalBuilder outer div — it uses fontFamily:F,background:C.bg
  // and is the root return of the PortalBuilder component
  // Pattern: <div style={{...fontFamily:F,background:C.bg}}>
  
  // Look for the PortalBuilder's root div that contains the top bar
  // It should be: display:"flex",flexDirection:"column",height:"100vh"
  if (p.includes('fontFamily:F,background:C.bg}}>\n      {/* Top bar')) {
    p = p.replace(
      'fontFamily:F,background:C.bg}}>\n      {/* Top bar',
      'fontFamily:F,background:C.bg,position:"fixed",inset:0,zIndex:150}}>\n      {/* Top bar'
    );
    changes++;
    console.log('  ✓ Made PortalBuilder full-screen with position:fixed');
  } else {
    // Try alternate pattern — look for the div with height:"100vh" and background:C.bg
    const builderPatterns = [
      // Pattern: display:"flex",flexDirection:"column",height:"100vh",fontFamily:F,background:C.bg
      /display:"flex",flexDirection:"column",height:"100vh",fontFamily:F,background:C\.bg/,
      // Pattern: height:"100vh",fontFamily:F,background:C.bg
      /height:"100vh",fontFamily:F,background:C\.bg/,
      // Pattern: minHeight:"100vh",fontFamily:F,background:C.bg
      /minHeight:"100vh",fontFamily:F,background:C\.bg/,
    ];
    
    let matched = false;
    for (const pattern of builderPatterns) {
      if (pattern.test(p)) {
        p = p.replace(pattern, (m) => {
          // Replace height:"100vh" with position:fixed,inset:0
          return m
            .replace('height:"100vh"', 'height:"100vh",position:"fixed",inset:0,zIndex:150')
            .replace('minHeight:"100vh"', 'minHeight:"100vh",position:"fixed",inset:0,zIndex:150');
        });
        matched = true;
        changes++;
        console.log('  ✓ Made PortalBuilder full-screen (alt pattern)');
        break;
      }
    }
    
    if (!matched) {
      // Last resort — find the PortalBuilder return and wrap it
      console.log('  ⚠ Could not find PortalBuilder root div pattern.');
      console.log('    Manual fix needed: add position:"fixed",inset:0,zIndex:150 to the');
      console.log('    PortalBuilder outer <div> (the one with height:"100vh")');
    }
  }

  fs.writeFileSync(PORTALS, p);
} else {
  console.log('  ⚠ Portals.jsx not found');
}

// ── Fix 3: Settings.jsx — when PortalBuilder is active, hide sidebar ────────
// Actually the position:fixed approach above already handles this —
// the builder renders OVER the sidebar at zIndex:150 which is above
// the sidebar's zIndex:100. So no Settings changes needed.

console.log(`\n✅ Done — ${changes} changes applied.`);
console.log('\nPush:');
console.log('  git add -A && git commit -m "fix: portal builder full-screen + more menu z-index" && git push origin main');
