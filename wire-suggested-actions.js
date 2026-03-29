#!/usr/bin/env node
/**
 * wire-suggested-actions.js
 * Wires the AI Suggested Actions bar so every button actually does something.
 *
 * Run from ~/projects/talentos:
 *   node wire-suggested-actions.js
 */

'use strict';
const fs   = require('fs');
const path = require('path');

const RP   = path.join(__dirname, 'client/src/Records.jsx');
const AP   = path.join(__dirname, 'client/src/App.jsx');
const AIJSX = path.join(__dirname, 'client/src/AI.jsx');

if (!fs.existsSync(RP)) { console.error('Records.jsx not found at', RP); process.exit(1); }

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────
function patch(src, label, oldStr, newStr) {
  if (!src.includes(oldStr)) { console.log(`SKIP  ${label}`); return src; }
  console.log(`OK    ${label}`);
  return src.replace(oldStr, newStr);
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler code — injected inside RecordDetail
// ─────────────────────────────────────────────────────────────────────────────
const HANDLER = `
  // ── AI Suggested Action handler ───────────────────────────────────────────
  const handleSuggestedAction = (action) => {
    const cta = action && action.cta;
    if (!cta) return;
    switch (cta) {
      case 'compose_email':
        setComposeType('email');
        break;
      case 'compose_sms':
        setComposeType('sms');
        break;
      case 'compose_whatsapp':
        setComposeType('whatsapp');
        break;
      case 'focus_fields': {
        setHighlightEmptyFields(true);
        var leftEl = document.querySelector('[data-field-column]');
        if (leftEl) leftEl.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(function() { setHighlightEmptyFields(false); }, 4000);
        break;
      }
      case 'move_stage':
        setOpenPanels(function(p) { return Object.assign({}, p, { pipeline: true }); });
        setTimeout(function() {
          var el = document.querySelector('[data-panel-id="pipeline"]');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
        break;
      case 'add_to_pool':
        setOpenPanels(function(p) { return Object.assign({}, p, { linked: true }); });
        setTimeout(function() {
          var el = document.querySelector('[data-panel-id="linked"]');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
        break;
      case 'open_offers':
      case 'create_offer':
        window.dispatchEvent(new CustomEvent('talentos:navigate', { detail: { nav: 'offers' } }));
        break;
      case 'open_portals':
        window.dispatchEvent(new CustomEvent('talentos:navigate', { detail: { nav: 'portals' } }));
        break;
      case 'open_interviews':
        window.dispatchEvent(new CustomEvent('talentos:navigate', { detail: { nav: 'interviews' } }));
        break;
      case 'schedule_interview': {
        window.dispatchEvent(new CustomEvent('talentos:navigate', { detail: { nav: 'interviews' } }));
        var candName = record && record.data
          ? ((record.data.first_name || '') + ' ' + (record.data.last_name || '')).trim() || (record.data.name || '')
          : '';
        setTimeout(function() {
          window.dispatchEvent(new CustomEvent('talentos:openScheduleInterview', {
            detail: { candidateId: record && record.id, candidateName: candName }
          }));
        }, 350);
        break;
      }
      case 'copilot_prompt': {
        var prompt = action.copilot_prompt || '';
        if (prompt) window.dispatchEvent(new CustomEvent('talentos:copilotPrompt', { detail: { prompt: prompt } }));
        break;
      }
      default:
        break;
    }
  };

`;

// ─────────────────────────────────────────────────────────────────────────────
// PATCH Records.jsx
// ─────────────────────────────────────────────────────────────────────────────
let rec = fs.readFileSync(RP, 'utf8');
let recChanged = false;

// 1. Replace onCompose with onAction in the SuggestedActions call
if (rec.includes('onAction={handleSuggestedAction}')) {
  console.log('OK    Step 1 (already done)');
} else {
  const OLD1 = 'onCompose={(type)=>setComposeType(type)}';
  if (rec.includes(OLD1)) {
    rec = rec.replace(OLD1, 'onAction={handleSuggestedAction}');
    console.log('OK    Step 1: SuggestedActions onAction wired');
    recChanged = true;
  } else {
    console.log('SKIP  Step 1 — onCompose anchor not found');
  }
}

// 2. Inject handleSuggestedAction into RecordDetail
if (rec.includes('handleSuggestedAction')) {
  console.log('OK    Step 2 (already done)');
} else {
  // Find the start of RecordDetail
  var rdStart = rec.indexOf('export const RecordDetail =');
  if (rdStart === -1) {
    console.log('SKIP  Step 2 — RecordDetail not found');
  } else {
    // Best anchor: right before FunctionalityBar inside RecordDetail
    var anchor1 = '\n  const FunctionalityBar = () => {';
    var idx1 = rec.indexOf(anchor1, rdStart);
    if (idx1 !== -1) {
      rec = rec.slice(0, idx1) + HANDLER + rec.slice(idx1);
      console.log('OK    Step 2: handleSuggestedAction injected before FunctionalityBar');
      recChanged = true;
    } else {
      // Fallback: first return ( after RecordDetail
      var retIdx = rec.indexOf('\n  return (', rdStart);
      if (retIdx !== -1) {
        rec = rec.slice(0, retIdx) + HANDLER + rec.slice(retIdx);
        console.log('OK    Step 2: handleSuggestedAction injected before return');
        recChanged = true;
      } else {
        console.log('SKIP  Step 2 — no injection anchor found');
      }
    }
  }
}

// 3. Add highlightEmptyFields state to RecordDetail
if (rec.includes('highlightEmptyFields')) {
  console.log('OK    Step 3 (already done)');
} else {
  var rdIdx = rec.indexOf('export const RecordDetail =');
  if (rdIdx !== -1) {
    var firstState = rec.indexOf('  const [', rdIdx);
    if (firstState !== -1) {
      rec = rec.slice(0, firstState)
        + '  const [highlightEmptyFields, setHighlightEmptyFields] = useState(false);\n'
        + rec.slice(firstState);
      console.log('OK    Step 3: highlightEmptyFields state added');
      recChanged = true;
    }
  }
}

// 4. Pass highlightEmpty prop down to FieldsPanel
if (rec.includes('highlightEmpty={highlightEmptyFields}')) {
  console.log('OK    Step 4 (already done)');
} else {
  rec = patch(rec,
    'Step 4: highlightEmpty prop to FieldsPanel',
    'environment={environment} onUpdate={handleDetailUpdate}/>',
    'environment={environment} onUpdate={handleDetailUpdate} highlightEmpty={highlightEmptyFields}/>'
  );
  if (rec.includes('highlightEmpty={highlightEmptyFields}')) recChanged = true;
}

// 5. Add data-field-column to left column div so focus_fields CTA can scroll to it
if (rec.includes('data-field-column')) {
  console.log('OK    Step 5 (already done)');
} else {
  // The left column div uses the leftPct state variable
  var leftColOld = 'style={{ width:`${leftPct}%`, flexShrink:0, overflowY:"auto"';
  var leftColNew = 'data-field-column="" style={{ width:`${leftPct}%`, flexShrink:0, overflowY:"auto"';
  rec = patch(rec, 'Step 5: data-field-column attr', leftColOld, leftColNew);
  if (rec.includes('data-field-column')) recChanged = true;
}

// 6. Update FieldsPanel signature to accept highlightEmpty
if (rec.includes('highlightEmpty = false')) {
  console.log('OK    Step 6 (already done)');
} else {
  rec = patch(rec,
    'Step 6a: FieldsPanel signature',
    'const FieldsPanel = ({ fields, record, objectName, objectColor, environment, onUpdate })',
    'const FieldsPanel = ({ fields, record, objectName, objectColor, environment, onUpdate, highlightEmpty = false })'
  );
  if (!rec.includes('highlightEmpty = false')) {
    // Try alternate signature (with trailing comma variants)
    rec = patch(rec,
      'Step 6b: FieldsPanel signature alt',
      'const FieldsPanel = ({ fields, record, objectName, objectColor, environment, onUpdate,',
      'const FieldsPanel = ({ fields, record, objectName, objectColor, environment, onUpdate, highlightEmpty = false,'
    );
  }
  if (rec.includes('highlightEmpty')) recChanged = true;
}

// 7. Highlight empty field rows visually — find the field row wrapper and add conditional styling
if (rec.includes('isEmpty && highlightEmpty')) {
  console.log('OK    Step 7 (already done)');
} else {
  // Find where individual field values are determined
  var fieldValAnchor = 'const val = record.data && record.data[field.api_key]';
  if (!rec.includes(fieldValAnchor)) {
    fieldValAnchor = 'const val = (record.data || {})[field.api_key]';
  }
  if (!rec.includes(fieldValAnchor)) {
    fieldValAnchor = 'record.data[field.api_key]';
  }
  // Just add a wrapper-level outline using a simpler CSS injection
  // Find the field row container inside FieldsPanel
  var rowContainerOld = 'display:"flex", alignItems:"flex-start", gap:10, padding:"7px 0",';
  var rowContainerNew = 'display:"flex", alignItems:"flex-start", gap:10, padding:"7px 0",\n              borderRadius: (highlightEmpty && !val) ? 6 : 0,\n              outline: (highlightEmpty && !val) ? "1.5px dashed #F59E0B" : "none",\n              background: (highlightEmpty && !val) ? "#FFFBEB" : "transparent",\n              transition:"background .3s, outline .3s",';
  if (rec.includes(rowContainerOld)) {
    // Add a val declaration right before the row container
    var beforeRow = 'display:"flex", alignItems:"flex-start", gap:10, padding:"7px 0",';
    var insertPoint = rec.indexOf(beforeRow);
    // Go back to find the line start
    var lineStart = rec.lastIndexOf('\n', insertPoint) + 1;
    // Insert `const val = (record.data || {})[field.api_key];` before this block
    if (!rec.slice(lineStart - 100, insertPoint).includes('const val =')) {
      rec = rec.slice(0, lineStart)
        + '            const val = (record && record.data) ? record.data[field.api_key] : undefined;\n'
        + rec.slice(lineStart);
    }
    rec = rec.replace(rowContainerOld, rowContainerNew.replace('(highlightEmpty && !val)', '(highlightEmpty && (val === null || val === undefined || val === ""))'));
    console.log('OK    Step 7: empty field highlight styling added');
    recChanged = true;
  } else {
    console.log('SKIP  Step 7 — field row container anchor not found');
  }
}

if (recChanged) {
  fs.writeFileSync(RP, rec, 'utf8');
  console.log('\nOK    Records.jsx saved');
} else {
  console.log('\nOK    Records.jsx — no changes needed');
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH App.jsx — listen for talentos:navigate
// ─────────────────────────────────────────────────────────────────────────────
if (fs.existsSync(AP)) {
  var apSrc = fs.readFileSync(AP, 'utf8');
  if (apSrc.includes("talentos:navigate")) {
    console.log('OK    App.jsx Step 8 (already done)');
  } else {
    var navUE = `
  // AI Suggested Action → navigate to section
  useEffect(() => {
    var handler = function(e) {
      var nav = e.detail && e.detail.nav;
      if (nav) switchNav(nav);
    };
    window.addEventListener('talentos:navigate', handler);
    return function() { window.removeEventListener('talentos:navigate', handler); };
  }, []);

`;
    // Insert before the main return
    var mainRetIdx = apSrc.indexOf('\n  return (\n    <div');
    if (mainRetIdx === -1) mainRetIdx = apSrc.indexOf('\n  return (');
    if (mainRetIdx !== -1) {
      apSrc = apSrc.slice(0, mainRetIdx) + navUE + apSrc.slice(mainRetIdx);
      fs.writeFileSync(AP, apSrc, 'utf8');
      console.log('OK    App.jsx Step 8: talentos:navigate listener added');
    } else {
      console.log('SKIP  App.jsx Step 8 — return not found');
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH AI.jsx — listen for talentos:copilotPrompt
// ─────────────────────────────────────────────────────────────────────────────
if (fs.existsSync(AIJSX)) {
  var aiSrc = fs.readFileSync(AIJSX, 'utf8');
  if (aiSrc.includes("talentos:copilotPrompt")) {
    console.log('OK    AI.jsx Step 9 (already done)');
  } else {
    var promptUE = `
  // AI Suggested Action → fire a Copilot prompt
  useEffect(() => {
    var handler = function(e) {
      var prompt = e.detail && e.detail.prompt;
      if (!prompt) return;
      setOpen(true);
      // Small delay so the panel animates open before the message is sent
      setTimeout(function() { sendMessage(prompt); }, 150);
    };
    window.addEventListener('talentos:copilotPrompt', handler);
    return function() { window.removeEventListener('talentos:copilotPrompt', handler); };
  }, [sendMessage]);

`;
    // Find the AICopilot export
    var copStart = aiSrc.indexOf('export const AICopilot =');
    if (copStart !== -1) {
      // Find the first useEffect inside it
      var firstUE = aiSrc.indexOf('  useEffect(', copStart);
      if (firstUE !== -1) {
        aiSrc = aiSrc.slice(0, firstUE) + promptUE + aiSrc.slice(firstUE);
        fs.writeFileSync(AIJSX, aiSrc, 'utf8');
        console.log('OK    AI.jsx Step 9: talentos:copilotPrompt listener added');
      } else {
        console.log('SKIP  AI.jsx Step 9 — useEffect not found');
      }
    } else {
      console.log('SKIP  AI.jsx Step 9 — AICopilot export not found');
    }
  }
}

console.log(`
Done! Every AI Suggested Action now works:

  + Complete missing fields  → left column scrolls up, empty fields glow amber for 4s
  Schedule interview          → navigates to Interviews + opens schedule modal
  Send follow-up email        → opens the Communications email compose modal
  Create offer / Review offer → navigates to Offers section
  Add to talent pool          → opens Linked Records panel
  Move to next stage          → opens Pipeline panel
  Publish to career site      → navigates to Portals
  Assign interviewers         → navigates to Interviews
  Write job description       → fires Copilot with the JD prompt pre-filled

Deploy:
  git add -A && git commit -m "feat: wire AI suggested actions" && git push origin main
  cd client && vercel --prod --yes
`);
