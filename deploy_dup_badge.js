#!/usr/bin/env node
// deploy_dup_badge.js
// Run from the talentos ROOT directory:
//   node deploy_dup_badge.js
//
// What it does:
//   1. Adds AvatarWithDupBadge component after Avatar in Records.jsx
//   2. Adds dupMap state inside RecordsView
//   3. Adds background duplicate scan useEffect inside RecordsView
//   4. Swaps Avatar → AvatarWithDupBadge in the table row
//   5. Passes dupMap prop to TableView
//   6. Adds dupMap to TableView's props destructure

'use strict';
const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'client', 'src', 'Records.jsx');

if (!fs.existsSync(FILE)) {
  console.error('❌  Cannot find client/src/Records.jsx');
  console.error('   Run this script from the talentos project root.');
  process.exit(1);
}

let src = fs.readFileSync(FILE, 'utf8');

// ─── Guard: don't apply twice ─────────────────────────────────────────────
if (src.includes('AvatarWithDupBadge')) {
  console.log('✅  AvatarWithDupBadge already present — nothing to do.');
  process.exit(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Insert AvatarWithDupBadge component right after Avatar
// ─────────────────────────────────────────────────────────────────────────────

const AVATAR_WITH_DUP_BADGE = `
/* ─── Avatar with Duplicate Badge ─────────────────────────────────────────── */
const AvatarWithDupBadge = ({ name, color, size = 32, photoUrl, dupInfo }) => {
  const [tip, setTip] = useState(false);

  if (!dupInfo) {
    return <Avatar name={name} color={color} size={size} photoUrl={photoUrl} />;
  }

  const isStrong   = dupInfo.score >= 80;
  const badgeColor = isStrong ? "#EF4444" : "#F59F00";

  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <Avatar name={name} color={color} size={size} photoUrl={photoUrl} />

      {/* Badge dot */}
      <div
        onMouseEnter={() => setTip(true)}
        onMouseLeave={() => setTip(false)}
        style={{
          position:"absolute", bottom:-2, right:-2,
          width:13, height:13, borderRadius:"50%",
          background:badgeColor, border:"1.5px solid white",
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"default", zIndex:20,
        }}
      >
        <svg width="7" height="6" viewBox="0 0 7 6" fill="none">
          <path d="M3.5 0.7L6.2 5.3H0.8L3.5 0.7Z" fill="white"/>
        </svg>

        {tip && (
          <div style={{
            position:"absolute", bottom:18, left:"50%",
            transform:"translateX(-50%)",
            background:"#0F1729", color:"white",
            padding:"9px 12px", borderRadius:10,
            fontSize:11, lineHeight:1.6,
            boxShadow:"0 8px 28px rgba(0,0,0,.28)",
            whiteSpace:"nowrap", zIndex:9999,
            pointerEvents:"none", minWidth:170,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:badgeColor, flexShrink:0 }}/>
              <span style={{ fontWeight:700, fontSize:12, color:isStrong?"#fca5a5":"#fde68a" }}>
                {isStrong ? "Likely duplicate" : "Possible duplicate"} · {dupInfo.score}%
              </span>
            </div>
            {dupInfo.reasons.map((r,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:6, color:"#d1d5db", fontSize:11 }}>
                <span style={{ color:"#6b7280", flexShrink:0 }}>›</span>{r}
              </div>
            ))}
            <div style={{
              position:"absolute", bottom:-5, left:"50%",
              transform:"translateX(-50%)",
              width:0, height:0,
              borderLeft:"5px solid transparent",
              borderRight:"5px solid transparent",
              borderTop:"5px solid #0F1729",
            }}/>
          </div>
        )}
      </div>
    </div>
  );
};

`;

// Find the end of the Avatar component (closing }; ) and insert after it.
// We look for the RecordFormModal comment which always follows Avatar.
const AFTER_AVATAR_MARKER = '/* ─── Create / Edit Record Modal';
if (!src.includes(AFTER_AVATAR_MARKER)) {
  console.error('❌  Cannot find Avatar component boundary. The file may have changed.');
  process.exit(1);
}

src = src.replace(AFTER_AVATAR_MARKER, AVATAR_WITH_DUP_BADGE + AFTER_AVATAR_MARKER);
console.log('✅  Section 1: AvatarWithDupBadge component inserted');


// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Add dupMap state inside RecordsView
// Insert right after the first useState in RecordsView.
// We find `export default function RecordsView` and locate the first useState line.
// ─────────────────────────────────────────────────────────────────────────────

// The duplicate map state + scan effect block
const DUP_STATE_AND_EFFECT = `
  // ── Duplicate detection map ────────────────────────────────────────────────
  const [dupMap, setDupMap] = useState({});

  // Background duplicate scan — only for People objects, runs after records load
  useEffect(() => {
    const isPeople = object?.slug === "people" ||
                     object?.name?.toLowerCase().includes("person");
    if (!isPeople || !environment?.id || !object?.id || records.length < 2) {
      setDupMap({});
      return;
    }
    const timer = setTimeout(() => {
      api.post('/duplicates/scan', {
        environment_id: environment.id,
        object_id:      object.id,
        threshold:      60,
      }).then(result => {
        if (!Array.isArray(result?.pairs)) return;
        const map = {};
        result.pairs.forEach(pair => {
          const add = (id, score, reasons) => {
            if (!map[id] || map[id].score < score) map[id] = { score, reasons };
          };
          add(pair.record_a.id, pair.score, pair.reasons);
          add(pair.record_b.id, pair.score, pair.reasons);
        });
        setDupMap(map);
      }).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records.length, object?.id, environment?.id]);

`;

// Find a reliable anchor inside RecordsView — the visibleFieldIds state
// which is always present and comes after the function signature.
const DUP_ANCHOR = 'const [visibleFieldIds, setVisibleFieldIds]';
if (!src.includes(DUP_ANCHOR)) {
  console.error('❌  Cannot find visibleFieldIds state in RecordsView to anchor Section 2.');
  process.exit(1);
}

// Insert before the visibleFieldIds line so the new state is near the top of the block
src = src.replace(DUP_ANCHOR, DUP_STATE_AND_EFFECT + '  ' + DUP_ANCHOR);
console.log('✅  Section 2: dupMap state + scan useEffect inserted');


// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Pass dupMap to TableView at the call site
// ─────────────────────────────────────────────────────────────────────────────

// Find the TableView render — look for onStageChange prop (always present)
// and add dupMap right before the closing />
const TABLE_VIEW_CALL_MARKER = 'onStatusUpdate=';
const TABLE_VIEW_INSERT       = '\n              dupMap={dupMap}';

if (!src.includes(TABLE_VIEW_CALL_MARKER)) {
  console.warn('⚠️   Could not find TableView call site to inject dupMap prop. Add dupMap={dupMap} manually.');
} else {
  // Insert dupMap just before the first occurrence of onStatusUpdate=
  src = src.replace(TABLE_VIEW_CALL_MARKER, TABLE_VIEW_INSERT + '\n              ' + TABLE_VIEW_CALL_MARKER);
  console.log('✅  Section 3: dupMap={dupMap} added to TableView call');
}


// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Add dupMap to TableView's props destructure
// ─────────────────────────────────────────────────────────────────────────────

// TableView always starts with `const TableView = ({`
// We find `onStageChange,` inside its props list (reliable anchor) and add dupMap after it
const TV_PROPS_ANCHOR = 'onStageChange,';
const TV_PROPS_INSERT = 'dupMap = {},\n  ';

// Only update the FIRST occurrence (inside TableView definition, not a call site)
const tvIdx = src.indexOf('const TableView = (');
if (tvIdx === -1) {
  console.warn('⚠️   Cannot find TableView definition. Add dupMap = {} to its props manually.');
} else {
  const afterDef = src.indexOf(TV_PROPS_ANCHOR, tvIdx);
  if (afterDef !== -1) {
    src = src.slice(0, afterDef) + TV_PROPS_INSERT + src.slice(afterDef);
    console.log('✅  Section 4: dupMap = {} added to TableView props');
  } else {
    console.warn('⚠️   Could not find onStageChange in TableView props. Add dupMap = {} manually.');
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — Swap <Avatar .../> → <AvatarWithDupBadge .../> in the table row
// ─────────────────────────────────────────────────────────────────────────────

// The avatar cell in TableView looks like:
//   <Avatar name={title} color={objectColor} size={28} photoUrl={record.data?.profile_photo ...}/>
// We replace it with AvatarWithDupBadge and add dupInfo prop.

// Use a regex that captures the existing Avatar call in the td cell
const avatarCellRegex = /(<td[^>]*onClick=\{[^}]*onProfile[^}]*\}[^>]*>\s*)<Avatar\s+name=\{title\}\s+color=\{objectColor\}\s+size=\{28\}\s+photoUrl=\{[^}]+\}\/>/;

if (avatarCellRegex.test(src)) {
  src = src.replace(
    avatarCellRegex,
    (_, tdPrefix) =>
      tdPrefix +
      `<AvatarWithDupBadge name={title} color={objectColor} size={28} photoUrl={record.data?.profile_photo || record.data?.photo_url} dupInfo={dupMap?.[record.id]}/>`
  );
  console.log('✅  Section 5: Avatar → AvatarWithDupBadge swapped in table row');
} else {
  console.warn('⚠️   Could not auto-swap Avatar in table row. Find the avatar <td> and replace:');
  console.warn('     <Avatar name={title} color={objectColor} size={28} photoUrl={...}/>');
  console.warn('     with:');
  console.warn('     <AvatarWithDupBadge name={title} color={objectColor} size={28} photoUrl={record.data?.profile_photo||record.data?.photo_url} dupInfo={dupMap?.[record.id]}/>');
}


// ─── Write the patched file back ──────────────────────────────────────────────
const backup = FILE + '.bak';
fs.writeFileSync(backup, fs.readFileSync(FILE));   // safety backup
fs.writeFileSync(FILE, src, 'utf8');

console.log('');
console.log('✅  Records.jsx patched successfully!');
console.log(`   Backup saved to: ${path.basename(backup)}`);
console.log('');
console.log('Next steps:');
console.log('  1. cd client && npm run dev   (check Vite compiles clean)');
console.log('  2. git add -A && git commit -m "feat: duplicate badge on avatar in list view"');
console.log('  3. git push origin main');
console.log('  4. cd client && vercel --prod --yes');
