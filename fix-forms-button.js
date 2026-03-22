/**
 * fix-forms-button.js  —  node fix-forms-button.js  (run from ~/projects/talentos)
 *
 * Properly wires the "Add Form" button in the record forms panel.
 * Adds a real form picker modal using state inside RecordDetail.
 */

const fs   = require('fs');
const path = require('path');

const RP = path.join(__dirname, 'client/src/Records.jsx');
let src = fs.readFileSync(RP, 'utf8');

// ── Step 1: Add showFormPicker state to RecordDetail ─────────────────────────
// Find the first useState inside RecordDetail
const rdMarker = 'export const RecordDetail =';
const rdIdx = src.indexOf(rdMarker);
if (rdIdx === -1) { console.log('❌  RecordDetail not found'); process.exit(1); }

const firstState = src.indexOf('useState(', rdIdx);
const firstStateLine = src.lastIndexOf('\n', firstState) + 1;

if (src.includes('showFormPicker')) {
  console.log('ℹ️  showFormPicker already exists');
} else {
  src = src.slice(0, firstStateLine) +
    '  const [showFormPicker, setShowFormPicker] = useState(false);\n' +
    '  const [availableForms, setAvailableForms]  = useState([]);\n' +
    src.slice(firstStateLine);
  console.log('✅  Added showFormPicker state');
}

// ── Step 2: Find the forms panel render (id==="forms") and replace it ─────────
// Find PanelContent and the forms case
const formsCasePatterns = [
  'id==="forms"',
  'id === "forms"',
  "id==='forms'",
];

let fcIdx = -1;
for (const p of formsCasePatterns) {
  fcIdx = src.indexOf(p);
  if (fcIdx !== -1) break;
}

if (fcIdx === -1) {
  console.log('⚠️  forms panel case not found — printing PanelContent area:');
  const pcIdx = src.indexOf('PanelContent');
  if (pcIdx !== -1) {
    console.log(src.slice(pcIdx, pcIdx + 2000).replace(/\n/g, '\n'));
  }
  process.exit(1);
}

// Find the line containing the forms case and what comes after it
const formsLine = src.slice(0, fcIdx).split('\n').length;
console.log(`ℹ️  Forms case at line ${formsLine}`);

// Get the return value for this case — find the JSX returned
// Look ahead for <RecordFormPanel, <FormRenderer, or similar
const formsChunk = src.slice(fcIdx, fcIdx + 800);
console.log('ℹ️  Forms case context:\n' + formsChunk.slice(0, 400));

// The pattern is typically:
//   if (id==="forms") return <RecordFormPanel .../>
//   or
//   if (id==="forms") return (<RecordFormPanel .../>)
// We want to wrap it to include the Add Form button and picker modal

// Find the component being returned
const compMatch = formsChunk.match(/<(RecordFormPanel|FormRenderer|FormPanel)([^>]*)\/>/);
const compMatchMulti = formsChunk.match(/<(RecordFormPanel|FormRenderer|FormPanel)([\s\S]*?)<\/\1>/);

const comp = compMatch || compMatchMulti;

if (!comp) {
  console.log('⚠️  Could not find the forms component JSX. Trying alternate approach...');
  // Try to find any JSX in the forms case
  const anyJSX = formsChunk.match(/<\w+[^>]*(?:\/> ?|>[\s\S]*?<\/\w+>)/);
  if (anyJSX) console.log('ℹ️  Found JSX: ' + anyJSX[0].slice(0, 100));
  
  console.log('\nManual fix needed — see instructions at end of script.');
} else {
  const oldComp = comp[0];
  const compStart = fcIdx + formsChunk.indexOf(oldComp);

  // Build the replacement: wrap with a fragment containing the Add Form button
  const newComp = `<>
          {/* Form picker modal */}
          {showFormPicker && (
            <FormPickerModal
              environment={environment}
              record={record}
              onClose={() => setShowFormPicker(false)}
              onLinked={() => { setShowFormPicker(false); load(); }}
            />
          )}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <span style={{fontSize:11,fontWeight:700,color:"var(--t-text3)",textTransform:"uppercase",letterSpacing:"0.06em"}}>
              Linked Forms
            </span>
            <button
              onClick={async () => {
                setShowFormPicker(true);
              }}
              style={{
                display:"inline-flex",alignItems:"center",gap:4,
                padding:"4px 10px",borderRadius:7,
                background:"var(--t-accentLight,#eef2ff)",
                border:"1px solid var(--t-accent,#4361EE)",
                color:"var(--t-accent,#4361EE)",
                fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
              }}>
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={3} strokeLinecap="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Add Form
            </button>
          </div>
          ${oldComp}
        </>`;

  src = src.slice(0, compStart) + newComp + src.slice(compStart + oldComp.length);
  console.log('✅  Forms panel wrapped with Add Form button');
}

// ── Step 3: Add FormPickerModal component before RecordDetail ─────────────────
const FORM_PICKER_MODAL = `
// ── FormPickerModal — lets user link an existing form to a record ─────────────
const FormPickerModal = ({ environment, record, onClose, onLinked }) => {
  const [forms, setForms]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(null);

  useEffect(() => {
    if (!environment?.id) return;
    api.get(\`/forms?environment_id=\${environment.id}\`)
      .then(d => { setForms(Array.isArray(d) ? d : d?.forms || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [environment?.id]);

  const linkForm = async (formId) => {
    setLinking(formId);
    try {
      await api.post(\`/forms/\${formId}/responses\`, {
        record_id: record?.id,
        environment_id: environment?.id,
        data: {},
      });
      onLinked?.();
    } catch (e) {
      console.error('Link form error:', e);
    }
    setLinking(null);
  };

  return (
    <div style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:2000,
      display:"flex",alignItems:"center",justifyContent:"center",padding:24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background:"var(--t-surface)",borderRadius:14,width:"100%",maxWidth:440,
        boxShadow:"0 16px 48px rgba(0,0,0,0.18)",maxHeight:"80vh",
        display:"flex",flexDirection:"column",overflow:"hidden",
      }}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"16px 20px",borderBottom:"1px solid var(--t-border)"}}>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:"var(--t-text1)"}}>Add Form</div>
            <div style={{fontSize:12,color:"var(--t-text3)",marginTop:2}}>
              Select a form to link to this record
            </div>
          </div>
          <button onClick={onClose}
            style={{background:"none",border:"none",cursor:"pointer",
              padding:4,borderRadius:6,color:"var(--t-text3)",display:"flex"}}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{overflowY:"auto",flex:1,padding:"8px 0"}}>
          {loading && (
            <div style={{padding:"32px",textAlign:"center",color:"var(--t-text3)",fontSize:13}}>
              Loading forms…
            </div>
          )}
          {!loading && forms.length === 0 && (
            <div style={{padding:"32px",textAlign:"center"}}>
              <div style={{fontSize:14,fontWeight:600,color:"var(--t-text1)",marginBottom:6}}>
                No forms available
              </div>
              <div style={{fontSize:12,color:"var(--t-text3)"}}>
                Create forms in Settings → Forms first.
              </div>
            </div>
          )}
          {!loading && forms.map(f => (
            <div key={f.id}
              style={{display:"flex",alignItems:"center",gap:12,
                padding:"10px 20px",borderBottom:"1px solid var(--t-border2)",
                transition:"background .1s"}}
              onMouseEnter={e=>e.currentTarget.style.background="var(--t-surface2)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{
                width:34,height:34,borderRadius:9,flexShrink:0,
                background:"var(--t-accentLight,#eef2ff)",
                display:"flex",alignItems:"center",justifyContent:"center",
              }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
                  stroke="var(--t-accent,#4361EE)" strokeWidth={1.8} strokeLinecap="round">
                  <rect x="9" y="2" width="6" height="4" rx="1"/>
                  <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
                  <path d="M9 12h6M9 16h4"/>
                </svg>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:"var(--t-text1)",
                  overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {f.name}
                </div>
                {f.description && (
                  <div style={{fontSize:11,color:"var(--t-text3)",marginTop:1,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {f.description}
                  </div>
                )}
                <div style={{fontSize:10,color:"var(--t-text3)",marginTop:2}}>
                  {(f.fields||[]).length} fields
                  {f.category ? \` · \${f.category}\` : ""}
                </div>
              </div>
              <button
                onClick={() => linkForm(f.id)}
                disabled={linking === f.id}
                style={{
                  padding:"6px 14px",borderRadius:7,
                  background: linking===f.id ? "var(--t-surface2)" : "var(--t-accent,#4361EE)",
                  color: linking===f.id ? "var(--t-text3)" : "white",
                  border:"none",cursor:linking===f.id?"default":"pointer",
                  fontSize:12,fontWeight:700,fontFamily:"inherit",flexShrink:0,
                  transition:"all .15s",
                }}>
                {linking === f.id ? "Adding…" : "Add"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

`;

// Insert before RecordDetail
const rdPos = src.indexOf('export const RecordDetail =');
if (!src.includes('FormPickerModal')) {
  const rdLineStart = src.lastIndexOf('\n', rdPos) + 1;
  src = src.slice(0, rdLineStart) + FORM_PICKER_MODAL + src.slice(rdLineStart);
  console.log('✅  FormPickerModal component added');
} else {
  console.log('ℹ️  FormPickerModal already exists');
}

// ── Write ─────────────────────────────────────────────────────────────────────
fs.writeFileSync(RP, src, 'utf8');
console.log('\n✅  Records.jsx updated');
console.log('\nHow it works:');
console.log('  • "Add Form" button in the record Forms panel opens a modal');
console.log('  • Modal lists all forms from the environment');
console.log('  • Clicking "Add" creates a form response linked to this record');
console.log('  • Panel refreshes and shows the newly linked form');
console.log('\nRestart Vite (hot-reload should catch it) then test.');
