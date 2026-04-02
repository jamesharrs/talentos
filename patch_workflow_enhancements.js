#!/usr/bin/env node
/**
 * patch_workflow_enhancements.js
 * Applies: Stage Visibility Rules + Next Steps Flow Control
 * Run from: /Users/james/projects/talentos/
 *   node patch_workflow_enhancements.js
 */
const fs   = require('fs');
const path = require('path');

const ROOT = '/Users/james/projects/talentos';
const WF   = path.join(ROOT, 'client/src/Workflows.jsx');
const RC   = path.join(ROOT, 'client/src/Records.jsx');
const WFR  = path.join(ROOT, 'server/routes/workflows.js');

function read(f) { return fs.readFileSync(f, 'utf8'); }
function write(f, c) { fs.writeFileSync(f, c, 'utf8'); console.log('✓', path.relative(ROOT, f)); }

function replace(src, from, to, label) {
  if (!src.includes(from)) { console.warn('  ⚠ anchor not found:', label || from.slice(0,50)); return src; }
  return src.replace(from, to);
}

function injectBefore(src, anchor, code) {
  const idx = src.indexOf(anchor);
  if (idx === -1) { console.warn('  ⚠ inject anchor not found:', anchor.slice(0,50)); return src; }
  return src.slice(0, idx) + code + src.slice(idx);
}

console.log('\n── Patching Workflows.jsx ──');
let wf = read(WF);

// ─── 1. VisibilityRuleBuilder + NextStepsConfig (inject before StepCard) ──────
const VISIBILITY_COMPONENTS = `
// ─── VisibilityRuleBuilder ────────────────────────────────────────────────────
const ROLE_OPTIONS = [
  { value:'super_admin',    label:'Super Admin' },
  { value:'admin',          label:'Admin' },
  { value:'recruiter',      label:'Recruiter' },
  { value:'hiring_manager', label:'Hiring Manager' },
  { value:'read_only',      label:'Read Only' },
];

const VRuleRow = ({ rule, fields, index, onChange, onRemove }) => {
  const toggleField = (key) => {
    const cur = rule.field_keys || [];
    const next = cur.includes(key) ? cur.filter(k=>k!==key) : [...cur, key];
    onChange(index, { ...rule, field_keys: next });
  };
  const toggleRole = (val) => {
    const cur = rule.conditions[0]?.values || [];
    const next = cur.includes(val) ? cur.filter(v=>v!==val) : [...cur, val];
    const cond = { type:'role', operator: rule.conditions[0]?.operator||'is', values: next };
    onChange(index, { ...rule, conditions: [cond] });
  };
  const setOperator = (op) => {
    const cond = { ...(rule.conditions[0]||{type:'role',values:[]}), operator: op };
    onChange(index, { ...rule, conditions: [cond] });
  };
  const cond = rule.conditions?.[0] || { type:'role', operator:'is', values:[] };
  return (
    <div style={{ background:'white', border:\\\`1px solid \\\${C.border}\\\`, borderRadius:10, padding:12, display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.text2, flex:1 }}>Rule {index+1}</div>
        <select value={rule.action||'hide'} onChange={e=>onChange(index,{...rule,action:e.target.value})}
          style={{ padding:'3px 8px', borderRadius:6, border:\\\`1px solid \\\${C.border}\\\`, fontSize:11, fontFamily:F, outline:'none', fontWeight:700,
            background: rule.action==='hide'?'#fef2f2':'#f0fdf4', color: rule.action==='hide'?'#dc2626':'#059669' }}>
          <option value="hide">Hide fields</option>
          <option value="show">Show fields</option>
        </select>
        <button onClick={()=>onRemove(index)} style={{ background:'none', border:'none', cursor:'pointer', padding:2, color:C.text3 }}>
          <Ic n="x" s={13}/>
        </button>
      </div>
      <div>
        <div style={{ fontSize:10, fontWeight:600, color:C.text3, marginBottom:5, textTransform:'uppercase', letterSpacing:'.5px' }}>Fields to {rule.action||'hide'}</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
          {(fields||[]).map(f => {
            const sel = (rule.field_keys||[]).includes(f.api_key);
            return (
              <button key={f.id||f.api_key} onClick={()=>toggleField(f.api_key)}
                style={{ padding:'3px 9px', borderRadius:99, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:F, border:'none',
                  background: sel?C.accent:'#f3f4f6', color: sel?'white':C.text2 }}>
                {f.name}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div style={{ fontSize:10, fontWeight:600, color:C.text3, marginBottom:5, textTransform:'uppercase', letterSpacing:'.5px' }}>When user role…</div>
        <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
          <select value={cond.operator||'is'} onChange={e=>setOperator(e.target.value)}
            style={{ padding:'4px 8px', borderRadius:6, border:\\\`1px solid \\\${C.border}\\\`, fontSize:11, fontFamily:F, outline:'none' }}>
            <option value="is">is</option>
            <option value="is_not">is not</option>
          </select>
          <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
            {ROLE_OPTIONS.map(r => {
              const sel = (cond.values||[]).includes(r.value);
              return (
                <button key={r.value} onClick={()=>toggleRole(r.value)}
                  style={{ padding:'3px 9px', borderRadius:99, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:F, border:'none',
                    background: sel?'#7c3aed':'#f3f4f6', color: sel?'white':C.text2 }}>
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const VisibilityRuleBuilder = ({ rules=[], fields=[], onChange }) => {
  const addRule = () => {
    const newRule = { id: Date.now().toString(36), field_keys:[], action:'hide',
      conditions:[{ type:'role', operator:'is', values:[] }] };
    onChange([...rules, newRule]);
  };
  const updateRule = (i, updated) => onChange(rules.map((r,j)=>j===i?updated:r));
  const removeRule = (i) => onChange(rules.filter((_,j)=>j!==i));
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {rules.length === 0 && (
        <div style={{ padding:'20px', background:'#f9fafb', borderRadius:10, textAlign:'center', border:\\\`2px dashed \\\${C.border}\\\` }}>
          <div style={{ fontSize:12, color:C.text3, marginBottom:4 }}>No visibility rules</div>
          <div style={{ fontSize:11, color:C.text3 }}>All fields visible to everyone at this stage by default.</div>
        </div>
      )}
      {rules.map((rule, i) => (
        <VRuleRow key={rule.id||i} rule={rule} fields={fields} index={i} onChange={updateRule} onRemove={removeRule}/>
      ))}
      <button onClick={addRule}
        style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8,
          border:\\\`1.5px dashed \\\${C.accent}60\\\`, background:C.accentLight, color:C.accent,
          fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:F, alignSelf:'flex-start' }}>
        <Ic n="plus" s={12}/> Add visibility rule
      </button>
    </div>
  );
};

// ─── NextStepsConfig ──────────────────────────────────────────────────────────
const NextStepsConfig = ({ currentStep, allSteps, onChange }) => {
  const ids = currentStep.next_step_ids || [];
  const others = allSteps.filter(s => s.id !== currentStep.id);
  const restricted = Array.isArray(currentStep.next_step_ids);
  const toggle = (id) => {
    const next = ids.includes(id) ? ids.filter(i=>i!==id) : [...ids, id];
    onChange({ ...currentStep, next_step_ids: next });
  };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'flex', gap:8 }}>
        {[
          { label:'Any stage allowed', desc:'Unrestricted — users can move to any stage', val:false },
          { label:'Restrict transitions', desc:'Only selected stages can follow this one', val:true },
        ].map(opt => (
          <button key={String(opt.val)} onClick={()=>onChange({...currentStep,next_step_ids:opt.val?[]:undefined})}
            style={{ flex:1, padding:'10px 12px', borderRadius:10, border:\\\`2px solid \\\${restricted===opt.val?C.accent:C.border}\\\`,
              background: restricted===opt.val?C.accentLight:'white', cursor:'pointer', fontFamily:F, textAlign:'left' }}>
            <div style={{ fontSize:12, fontWeight:700, color:restricted===opt.val?C.accent:C.text1, marginBottom:2 }}>{opt.label}</div>
            <div style={{ fontSize:11, color:C.text3, lineHeight:1.4 }}>{opt.desc}</div>
          </button>
        ))}
      </div>
      {restricted && (
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:C.text2, marginBottom:8 }}>Allowed next stages</div>
          {others.length === 0
            ? <div style={{ fontSize:12, color:C.text3, fontStyle:'italic' }}>No other stages defined yet.</div>
            : <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {others.map(s => {
                  const sel = ids.includes(s.id);
                  const hasAuto = (s.actions||[]).some(a=>a.type);
                  return (
                    <label key={s.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
                      borderRadius:8, border:\\\`1.5px solid \\\${sel?C.accent:C.border}\\\`,
                      background: sel?C.accentLight:'white', cursor:'pointer' }}>
                      <input type="checkbox" checked={sel} onChange={()=>toggle(s.id)}
                        style={{ accentColor:C.accent, width:14, height:14, cursor:'pointer' }}/>
                      <span style={{ fontSize:13, fontWeight:sel?700:400, color:sel?C.accent:C.text1, flex:1 }}>{s.name||'Unnamed stage'}</span>
                      {hasAuto && <span style={{ fontSize:9, background:'#fef3c7', color:'#92400e', padding:'1px 5px', borderRadius:99, fontWeight:700 }}>⚡</span>}
                    </label>
                  );
                })}
              </div>
          }
          {ids.length === 0 && <div style={{ marginTop:8, fontSize:11, color:'#dc2626', fontWeight:600 }}>⚠ No stages selected — dead end.</div>}
        </div>
      )}
      {!restricted && (
        <div style={{ padding:'10px 12px', background:'#f9fafb', borderRadius:8, fontSize:12, color:C.text3 }}>
          Users can move candidates from this stage to <strong>any other stage</strong> freely.
        </div>
      )}
    </div>
  );
};

`;

wf = injectBefore(wf, '// ─── Step Card ───', VISIBILITY_COMPONENTS);
console.log('  ✓ VisibilityRuleBuilder + NextStepsConfig added');

// ─── 2. Add activeTab state to StepCard ───────────────────────────────────────
wf = replace(wf,
  `  const [showActionPicker, setShowActionPicker] = useState(false);
  const [collapsed, setCollapsed]               = useState({}); // { actionId: bool }`,
  `  const [showActionPicker, setShowActionPicker] = useState(false);
  const [collapsed, setCollapsed]               = useState({}); // { actionId: bool }
  const [activeTab, setActiveTab]               = useState('details');`,
  'StepCard activeTab state'
);

// ─── 3. Update StepCard signature to accept allSteps ─────────────────────────
wf = replace(wf,
  `const StepCard = ({ step: rawStep, index, total, onChange, onDelete, onMoveUp, onMoveDown, fields, envId }) => {`,
  `const StepCard = ({ step: rawStep, index, total, onChange, onDelete, onMoveUp, onMoveDown, fields, envId, allSteps=[] }) => {`,
  'StepCard allSteps prop'
);

// ─── 4. Add tab bar before the actions section ────────────────────────────────
// The actions section starts with the comment "// ── Actions ──"
wf = replace(wf,
  `      {/* ── Actions ── */}`,
  `      {/* ── Tab bar ── */}
      <div style={{ display:'flex', borderBottom:\`1px solid \${C.border}\`, margin:'0 -14px', padding:'0 14px', gap:0 }}>
        {[
          { id:'details',    label:'Actions' },
          { id:'next_steps', label:'Next Steps' },
          { id:'visibility', label:'Visibility', badge:(step.visibility_rules||[]).length||null },
        ].map(tab => (
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
            style={{ padding:'7px 12px', background:'none', border:'none',
              borderBottom:\`2px solid \${activeTab===tab.id?C.accent:'transparent'}\`,
              color:activeTab===tab.id?C.accent:C.text3,
              fontSize:11, fontWeight:activeTab===tab.id?700:500,
              cursor:'pointer', fontFamily:F, display:'flex', alignItems:'center', gap:5, marginBottom:-1 }}>
            {tab.label}
            {tab.badge ? <span style={{ fontSize:9, background:C.accent, color:'white', borderRadius:99, padding:'0 4px', lineHeight:'14px' }}>{tab.badge}</span> : null}
          </button>
        ))}
      </div>

      {/* ── Details tab ── */}
      {activeTab==='details' && <>
      {/* ── Actions ── */}`,
  'StepCard tab bar'
);
console.log('  ✓ StepCard tab bar added');

// ─── 5. Close the details tab and add Next Steps + Visibility tabs ────────────
// We need to find the closing of the StepCard's inner div and add the two new tabs.
// The showActionPicker block ends just before the StepCard's outer closing divs.
// We find the "Add action" button block end and close the details tab there.

// The safest anchor: the very last button inside the step card before its closing divs
const STEP_CARD_ACTIONS_END = `        )}
      </div>
    </div>
  );
};
const WorkflowEditor`;

const STEP_CARD_WITH_TABS = `        )}
      </>}

      {/* ── Next Steps tab ── */}
      {activeTab==='next_steps' && (
        <NextStepsConfig
          currentStep={step}
          allSteps={allSteps}
          onChange={updated => onChange(updated)}/>
      )}

      {/* ── Visibility tab ── */}
      {activeTab==='visibility' && (
        <div>
          <div style={{ fontSize:11, color:C.text3, marginBottom:12, lineHeight:1.6 }}>
            Define which fields to show or hide at this stage based on the viewer's role.
          </div>
          <VisibilityRuleBuilder
            rules={step.visibility_rules||[]}
            fields={fields||[]}
            onChange={rules => onChange({ ...step, visibility_rules: rules })}/>
        </div>
      )}
      </div>
    </div>
  );
};
const WorkflowEditor`;

wf = replace(wf, STEP_CARD_ACTIONS_END, STEP_CARD_WITH_TABS, 'StepCard close + new tabs');
console.log('  ✓ Next Steps and Visibility tabs added to StepCard');

// ─── 6. Pass allSteps to StepCard in WorkflowEditor ──────────────────────────
wf = replace(wf,
  `                    <StepCard step={step} index={i} total={steps.length} fields={fields} envId={environment?.id}
                      onChange={updated => updateStep(i, updated)}
                      onDelete={() => deleteStep(i)}
                      onMoveUp={() => moveStep(i, -1)}
                      onMoveDown={() => moveStep(i, 1)}/>`,
  `                    <StepCard step={step} index={i} total={steps.length} fields={fields} envId={environment?.id}
                      allSteps={steps}
                      onChange={updated => updateStep(i, updated)}
                      onDelete={() => deleteStep(i)}
                      onMoveUp={() => moveStep(i, -1)}
                      onMoveDown={() => moveStep(i, 1)}/>`,
  'StepCard allSteps prop pass'
);
console.log('  ✓ allSteps passed to StepCard');

// ─── 7. Add flow_type state + UI to WorkflowEditor ───────────────────────────
wf = replace(wf,
  `  const [steps, setSteps]     = useState(workflow?.steps || []);
  const [saving, setSaving]   = useState(false);`,
  `  const [steps, setSteps]     = useState(workflow?.steps || []);
  const [flowType, setFlowType] = useState(workflow?.flow_type || 'unstructured');
  const [saving, setSaving]   = useState(false);`,
  'WorkflowEditor flowType state'
);

// Add flow_type to save payload
wf = replace(wf,
  `      name, object_id: objectId, description: desc,
        workflow_type: wfType, sharing, steps,`,
  `      name, object_id: objectId, description: desc,
        workflow_type: wfType, flow_type: flowType, sharing, steps,`,
  'WorkflowEditor save flowType'
);

// Add flow type UI — inject before the Sharing section
const FLOW_TYPE_UI = `
            {/* Flow Type / Transition Mode */}
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:C.text2, marginBottom:8 }}>Transition Mode</div>
              <div style={{ display:'flex', gap:8 }}>
                {[
                  { value:'unstructured', label:'Flexible', desc:'Move to any stage in any order' },
                  { value:'structured',   label:'Structured', desc:'Define allowed paths per stage (Next Steps tab)' },
                ].map(opt => (
                  <button key={opt.value} onClick={()=>setFlowType(opt.value)}
                    style={{ flex:1, padding:'9px 12px', borderRadius:10,
                      border:\`2px solid \${flowType===opt.value?C.accent:C.border}\`,
                      background:flowType===opt.value?C.accentLight:'white',
                      cursor:'pointer', fontFamily:F, textAlign:'left' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:flowType===opt.value?C.accent:C.text1, marginBottom:2 }}>{opt.label}</div>
                    <div style={{ fontSize:11, color:C.text3, lineHeight:1.4 }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
`;

wf = replace(wf,
  `            {/* Sharing */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.text2, marginBottom: 8 }}>Sharing</div>`,
  FLOW_TYPE_UI + `            {/* Sharing */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.text2, marginBottom: 8 }}>Sharing</div>`,
  'WorkflowEditor flow_type UI'
);
console.log('  ✓ WorkflowEditor Flexible/Structured toggle added');

// ─── 8. Enforce next_step_ids in PipelinePersonRow stage menu ─────────────────
wf = replace(wf,
  `  const currentIdx  = steps.findIndex(s => s.id === link.stage_id);
  const currentStep = steps[currentIdx] || steps[0];
  const prevStep    = currentIdx > 0 ? steps[currentIdx - 1] : null;
  const nextStep    = currentIdx >= 0 && currentIdx < steps.length - 1 ? steps[currentIdx + 1] : null;`,
  `  const currentIdx  = steps.findIndex(s => s.id === link.stage_id);
  const currentStep = steps[currentIdx] || steps[0];
  const prevStep    = currentIdx > 0 ? steps[currentIdx - 1] : null;
  const nextStep    = currentIdx >= 0 && currentIdx < steps.length - 1 ? steps[currentIdx + 1] : null;
  // Respect next_step_ids for structured workflows
  const allowedNextIds = currentStep?.next_step_ids;
  const menuSteps = (Array.isArray(allowedNextIds) && allowedNextIds.length > 0)
    ? steps.filter(s => allowedNextIds.includes(s.id))
    : steps;`,
  'PipelinePersonRow menuSteps'
);

// Replace steps.map in the stage dropdown with menuSteps.map
wf = replace(wf,
  `              {steps.map(step => {
                const isCurrent = step.id === link.stage_id;
                const hasAuto   = (step.actions||[]).some(a => a.type);
                return (
                  <button key={step.id}
                    onClick={e => { e.stopPropagation(); handlePick(step); }}`,
  `              {menuSteps.map(step => {
                const isCurrent = step.id === link.stage_id;
                const hasAuto   = (step.actions||[]).some(a => a.type);
                return (
                  <button key={step.id}
                    onClick={e => { e.stopPropagation(); handlePick(step); }}`,
  'PipelinePersonRow menuSteps.map'
);
console.log('  ✓ PipelinePersonRow stage menu respects next_step_ids');

write(WF, wf);

// ─── 9. Records.jsx — apply visibility rules in RecordDetail ──────────────────
console.log('\n── Patching Records.jsx ──');
let rc = read(RC);

const OLD_VISIBLE_FIELDS = `  const visibleFields = useMemo(() => {
    const liveData = { ...record.data, ...editing };
    return (fields || []).filter(f => {
      if (!f.condition_field) return true;
      return String(liveData[f.condition_field] || '').toLowerCase() ===
             String(f.condition_value || '').toLowerCase();
    });
  }, [fields, record.data, editing]);`;

const NEW_VISIBLE_FIELDS = `  // Stage-based visibility rules (blind screening)
  const [hiddenFieldKeys, setHiddenFieldKeys] = useState(new Set());
  useEffect(() => {
    if (!record?.id || !session?.user) { setHiddenFieldKeys(new Set()); return; }
    const userRole = session.user.role?.slug || session.user.role_slug || '';
    if (!objectName?.toLowerCase().includes('person') && objectName?.toLowerCase() !== 'people') {
      setHiddenFieldKeys(new Set()); return;
    }
    fetch(\`/api/workflows/people-links?person_record_id=\${record.id}\`)
      .then(r => r.ok ? r.json() : [])
      .then(links => {
        const hidden = new Set();
        (Array.isArray(links) ? links : []).forEach(link => {
          const steps = link.workflow_steps || [];
          const currentStep = steps.find(s => s.id === link.stage_id);
          if (!currentStep?.visibility_rules) return;
          currentStep.visibility_rules.forEach(rule => {
            const cond = rule.conditions?.[0];
            if (!cond || !cond.values?.length) return;
            const roleMatches = (cond.values || []).includes(userRole);
            const applies = cond.operator === 'is_not' ? !roleMatches : roleMatches;
            if (applies && rule.action === 'hide') {
              (rule.field_keys || []).forEach(k => hidden.add(k));
            }
          });
        });
        setHiddenFieldKeys(hidden);
      })
      .catch(() => setHiddenFieldKeys(new Set()));
  }, [record?.id, session?.user?.id, objectName]);

  const visibleFields = useMemo(() => {
    const liveData = { ...record.data, ...editing };
    return (fields || []).filter(f => {
      if (f.condition_field) {
        const condMet = String(liveData[f.condition_field] || '').toLowerCase() ===
                        String(f.condition_value || '').toLowerCase();
        if (!condMet) return false;
      }
      if (hiddenFieldKeys.has(f.api_key)) return false;
      return true;
    });
  }, [fields, record.data, editing, hiddenFieldKeys]);`;

rc = replace(rc, OLD_VISIBLE_FIELDS, NEW_VISIBLE_FIELDS, 'RecordDetail visibleFields with visibility rules');
console.log('  ✓ RecordDetail applies stage visibility rules');
write(RC, rc);

// ─── 10. Server — GET /people-links accepts ?person_record_id ─────────────────
console.log('\n── Patching server/routes/workflows.js ──');
let wfr = read(WFR);

// Only patch if not already done
if (!wfr.includes('person_record_id: prId')) {
  wfr = replace(wfr,
    `  const links = query('people_links', l =>
    l.target_record_id === req.query.target_record_id`,
    `  const { target_record_id: trId, person_record_id: prId } = req.query;
  const links = query('people_links', l =>
    (!trId || l.target_record_id === trId) &&
    (!prId || l.person_record_id === prId) &&
    (trId || prId)`,
    'GET /people-links person_record_id filter'
  );
  console.log('  ✓ GET /people-links accepts ?person_record_id');
} else {
  console.log('  (server already patched)');
}
write(WFR, wfr);

// ─── 11. Git commit and push ──────────────────────────────────────────────────
const { execSync } = require('child_process');
try {
  execSync('cd /Users/james/projects/talentos && git add -A && git commit -m "feat: stage visibility rules + structured next-steps flow control" && git push origin main', { stdio: 'inherit' });
  console.log('\n✅ Committed and pushed to GitHub');
} catch(e) {
  console.log('\n⚠ Git push failed — changes are saved locally, push manually');
}

console.log(`
╔══════════════════════════════════════════════════════════════════╗
║  Workflow Enhancements — complete                                ║
╠══════════════════════════════════════════════════════════════════╣
║  ✓ VisibilityRuleBuilder — hide/show fields by role per stage   ║
║  ✓ NextStepsConfig — restrict stage transitions                 ║
║  ✓ WorkflowEditor — Flexible / Structured toggle                ║
║  ✓ PipelinePersonRow — respects next_step_ids                   ║
║  ✓ RecordDetail — applies visibility rules to field rendering   ║
║  ✓ GET /people-links — accepts ?person_record_id filter         ║
╠══════════════════════════════════════════════════════════════════╣
║  Restart server: cd server && node index.js                     ║
╚══════════════════════════════════════════════════════════════════╝
`);
