/**
 * fix-portals.js
 * Run from project root: node fix-portals.js
 *
 * Fixes two portal issues:
 * 1. Route ordering — /slug/:slug must come before /:id in portals.js
 * 2. Draft portals return 404 — allow authenticated users to preview drafts
 */

const fs = require('fs');
const path = require('path');

const PORTALS_ROUTE = path.join(__dirname, 'server/routes/portals.js');

let src = fs.readFileSync(PORTALS_ROUTE, 'utf8');
let changed = false;

// ── Fix 1: Move /slug/:slug route BEFORE /:id ─────────────────────────────────
// Check if the ordering is wrong (/:id appears before /slug/:slug)
const idIdx   = src.indexOf("router.get('/:id'");
const slugIdx = src.indexOf("router.get('/slug/:slug'");

if (idIdx !== -1 && slugIdx !== -1 && idIdx < slugIdx) {
  console.log('Fixing route ordering...');

  // Extract the entire /slug/:slug route block
  const slugStart = slugIdx;
  // Find the end of the slug route (next router. call or end of route block)
  // We'll find the closing of this route handler
  let depth = 0;
  let inHandler = false;
  let slugEnd = slugStart;
  for (let i = slugStart; i < src.length; i++) {
    if (src[i] === '(' && !inHandler) { inHandler = true; depth = 1; slugEnd = i; continue; }
    if (inHandler) {
      if (src[i] === '(') depth++;
      if (src[i] === ')') { depth--; if (depth === 0) { slugEnd = i + 2; break; } }
    }
  }
  // Find end of slug route including trailing semicolon and newlines
  while (slugEnd < src.length && (src[slugEnd] === ';' || src[slugEnd] === '\n' || src[slugEnd] === '\r')) slugEnd++;

  const slugRoute = src.slice(slugStart, slugEnd);

  // Remove it from its current location
  src = src.slice(0, slugStart) + src.slice(slugEnd);

  // Re-find /:id position (it shifted after removal)
  const idIdxNew = src.indexOf("router.get('/:id'");
  // Insert slug route just before /:id route
  src = src.slice(0, idIdxNew) + slugRoute + '\n' + src.slice(idIdxNew);
  changed = true;
  console.log('✓ Route ordering fixed');
} else if (slugIdx < idIdx) {
  console.log('✓ Route ordering already correct');
} else {
  console.log('⚠ Could not find route markers — skipping route order fix');
}

// ── Fix 2: Allow draft portals for authenticated users ────────────────────────
// Old: p.status === 'published' && !p.deleted_at
// New: (p.status === 'published' || req.currentUser) && !p.deleted_at
const draftFix = src.replace(
  /p\.status === ['"]published['"] && !p\.deleted_at/g,
  "(p.status === 'published' || req.currentUser) && !p.deleted_at"
);

if (draftFix !== src) {
  src = draftFix;
  changed = true;
  console.log('✓ Draft portal preview fix applied');
} else {
  // Try alternate quote style
  const draftFix2 = src.replace(
    /p\.status==="published" && !p\.deleted_at/g,
    '(p.status === "published" || req.currentUser) && !p.deleted_at'
  );
  if (draftFix2 !== src) {
    src = draftFix2;
    changed = true;
    console.log('✓ Draft portal preview fix applied');
  } else {
    console.log('⚠ Draft fix pattern not found — checking manually...');
    // Find and show the actual line
    const lines = src.split('\n');
    lines.forEach((line, i) => {
      if (line.includes('published') && line.includes('deleted_at')) {
        console.log(`  Line ${i+1}: ${line.trim()}`);
      }
    });
  }
}

// ── Fix 3: Better error message for unpublished portals ───────────────────────
// Also add a separate "draft" status response so the client can show a better message
src = src.replace(
  "if (!portal) return res.status(404).json({ error: 'Not found or unpublished' });",
  `// Check if portal exists at all (ignore publish status)
  const anyPortal = (store.portals || []).find(p =>
    (p.slug === slug || p.slug === req.params.slug) && !p.deleted_at
  );
  if (!anyPortal) return res.status(404).json({ error: 'Portal not found' });
  if (!portal) return res.status(403).json({ error: 'Portal is not published', code: 'DRAFT', name: anyPortal.name });`
);

if (src.includes("code: 'DRAFT'")) {
  changed = true;
  console.log('✓ Better draft error message applied');
}

if (changed) {
  fs.writeFileSync(PORTALS_ROUTE, src);
  console.log('\n✅ server/routes/portals.js patched successfully');
} else {
  console.log('\n⚠ No changes were made — check the file manually');
}

// ── Fix 4: Update PortalApp.jsx to show better error for draft portals ─────────
const PORTAL_APP = path.join(__dirname, 'client/src/PortalApp.jsx');
if (fs.existsSync(PORTAL_APP)) {
  let app = fs.readFileSync(PORTAL_APP, 'utf8');

  // Replace the catch handler to distinguish draft vs not found
  const oldCatch = `.catch(() => { setError('This portal is not available.'); setLoading(false); })`;
  const newCatch = `.catch(async (err) => {
        // Try to get a friendlier error message from the response
        try {
          const resp = await fetch(\`/api/portals/slug/\${cleanSlug}\`);
          const body = await resp.json();
          if (body.code === 'DRAFT') {
            setError(\`"\${body.name}" exists but hasn't been published yet. Open the portal builder and click Publish.\`);
          } else {
            setError(body.error || 'This portal is not available.');
          }
        } catch {
          setError('This portal is not available. It may have been unpublished or the URL is incorrect.');
        }
        setLoading(false);
      })`;

  if (app.includes(oldCatch)) {
    app = app.replace(oldCatch, newCatch);
    fs.writeFileSync(PORTAL_APP, app);
    console.log('✓ PortalApp.jsx updated with better error messages');
  } else {
    console.log('⚠ PortalApp.jsx catch pattern not found — may already be updated');
  }
}

console.log('\nNext: restart the server and test a portal URL');
