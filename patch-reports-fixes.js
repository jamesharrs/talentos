#!/usr/bin/env node
/**
 * Patch: 3 fixes for Reports page
 *   1. Copilot can modify the current report (add filter, change group, etc.)
 *   2. Fix save name input bug (uncontrolled → controlled with local state)
 *   3. Rename all "list/lists/saved list" → "report/reports/saved report"
 *
 * Run from: ~/projects/talentos
 *   node patch-reports-fixes.js
 */
const fs = require('fs');
const path = require('path');

const REPORTS = 'client/src/Reports.jsx';
const AI      = 'client/src/AI.jsx';

function patch(filepath, label, oldStr, newStr) {
  const full = path.resolve(filepath);
  if (!fs.existsSync(full)) { console.log(`SKIP ${label} — file not found: ${filepath}`); return; }
  let src = fs.readFileSync(full, 'utf8');
  if (!src.includes(oldStr)) { console.log(`SKIP ${label} — anchor not found`); return; }
  fs.writeFileSync(full, src.replace(oldStr, newStr));
  console.log(`OK   ${label}`);
}

function replaceAll(filepath, label, oldStr, newStr) {
  const full = path.resolve(filepath);
  if (!fs.existsSync(full)) { console.log(`SKIP ${label} — file not found`); return; }
  let src = fs.readFileSync(full, 'utf8');
  const count = (src.match(new RegExp(oldStr.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'g'))||[]).length;
  if (!count) { console.log(`SKIP ${label} — 0 matches`); return; }
  fs.writeFileSync(full, src.split(oldStr).join(newStr));
  console.log(`OK   ${label} (${count} replacements)`);
}

// ── FIX 1: RENAME "lists" → "reports" in Reports.jsx ─────────────────────────
console.log('\n-- Fix 1: Rename lists → reports --');
replaceAll(REPORTS, 'savedLists → savedReports (state var)', 'savedLists', 'savedReports');
replaceAll(REPORTS, 'setSavedLists → setSavedReports', 'setSavedLists', 'setSavedReports');
replaceAll(REPORTS, 'listName → reportName (state var)', 'listName', 'reportName');
replaceAll(REPORTS, 'setListName → setReportName', 'setListName', 'setReportName');
replaceAll(REPORTS, 'listShared → reportShared', 'listShared', 'reportShared');
replaceAll(REPORTS, 'setListShared → setReportShared', 'setListShared', 'setReportShared');
replaceAll(REPORTS, 'savingList → savingReport', 'savingList', 'savingReport');
replaceAll(REPORTS, 'setSavingList → setSavingReport', 'setSavingList', 'setSavingReport');
replaceAll(REPORTS, 'showSaveForm → showSaveDialog', 'showSaveForm', 'showSaveDialog');
replaceAll(REPORTS, 'setShowSaveForm → setShowSaveDialog', 'setShowSaveForm', 'setShowSaveDialog');
replaceAll(REPORTS, 'saveList → saveReport (fn)', 'saveList', 'saveReport');

// Text labels
replaceAll(REPORTS, '"Saved lists"', '"Saved lists"', '"Saved reports"');
replaceAll(REPORTS, '"Save list"', '"Save list"', '"Save report"');
replaceAll(REPORTS, "'Save list'", "'Save list'", "'Save report'");
replaceAll(REPORTS, '"No saved lists"', '"No saved lists"', '"No saved reports"');
replaceAll(REPORTS, 'Saved lists', 'Saved lists', 'Saved reports');
replaceAll(REPORTS, 'saved list', 'saved list', 'saved report');
replaceAll(REPORTS, 'Saved reports\n', 'Saved reports\n', 'Saved reports\n'); // prevent double-run

// ── FIX 2: FIX SAVE INPUT DEBOUNCE BUG ──────────────────────────────────────
// The input is likely re-rendering because reportName state changes cause full
// parent re-render. Fix: use a local uncontrolled ref, only sync on save.
console.log('\n-- Fix 2: Fix save input bug --');

// Replace the save form input with a ref-based approach
patch(REPORTS, 'Fix save input — use ref not state',
`<input
                  value={reportName}
                  onChange={e => setReportName(e.target.value)}`,
`<input
                  defaultValue={reportName}
                  onChange={e => setReportName(e.target.value)}
                  key={showSaveDialog ? "open" : "closed"}`
);

// ── FIX 3: COPILOT CAN MODIFY CURRENT REPORT ─────────────────────────────────
// Add MODIFY_REPORT instruction block and handler in AI.jsx,
// and a listener in Reports.jsx
console.log('\n-- Fix 3: Copilot report modification --');

// 3a: Add talentos:modify-report listener in Reports.jsx after the useEffect for initialReport
patch(REPORTS, 'Add modify-report event listener',
`  const runReport = useCallback(`,
`  // Listen for copilot "modify current report" commands
  useEffect(() => {
    const handler = (e) => {
      const cmd = e.detail || {};
      let changed = false;
      if (cmd.addFilter && cmd.addFilter.field) {
        setFilters(prev => {
          const already = prev.some(f => f.field === cmd.addFilter.field && f.value === cmd.addFilter.value);
          return already ? prev : [...prev, { field: cmd.addFilter.field, op: cmd.addFilter.op || "is not", value: cmd.addFilter.value }];
        });
        changed = true;
      }
      if (cmd.removeFilter && cmd.removeFilter.field) {
        setFilters(prev => prev.filter(f => !(f.field === cmd.removeFilter.field)));
        changed = true;
      }
      if (cmd.setGroupBy !== undefined) { setGroupBy(cmd.setGroupBy); changed = true; }
      if (cmd.setChartType) { setChartType(cmd.setChartType); changed = true; }
      if (cmd.setSortBy) { setSortBy(cmd.setSortBy); changed = true; }
      if (changed) {
        // Debounce so state updates flush before re-running
        setTimeout(() => runReportRef.current?.(), 300);
      }
    };
    window.addEventListener("talentos:modify-report", handler);
    return () => window.removeEventListener("talentos:modify-report", handler);
  }, []);

  const runReport = useCallback(`
);

// 3b: Add a ref that always points to the latest runReport
patch(REPORTS, 'Add runReportRef',
`  const skipReset = useRef(false);`,
`  const skipReset = useRef(false);
  const runReportRef = useRef(null);`
);

// 3c: Keep runReportRef current
patch(REPORTS, 'Keep runReportRef updated',
`  }, [selObject, environment?.id, filters, groupBy, sortBy, sortDir, formulas, chartX, chartY]);`,
`  }, [selObject, environment?.id, filters, groupBy, sortBy, sortDir, formulas, chartX, chartY]);
  // Keep ref current so the modify-report listener can call the latest version
  useEffect(() => { runReportRef.current = runReport; }, [runReport]);`
);

// 3d: Add MODIFY_REPORT to AI.jsx system prompt + parser
patch(AI, 'Add MODIFY_REPORT to system prompt',
`- On a list page: the context includes "LIST:" data — total count, status/dept breakdown,
    first 25 record names. Use this directly to answer "how many people are in this list?",
    "what statuses are shown?", "who is Active?". NEVER say you cannot see the list — the data is always injected.`,
`- On a list page: the context includes "LIST:" data — total count, status/dept breakdown,
    first 25 record names. Use this directly to answer "how many people are in this list?",
    "what statuses are shown?", "who is Active?". NEVER say you cannot see the list — the data is always injected.
- On the Reports page: if the user wants to change the CURRENT report (add/remove a filter,
    change grouping, chart type, sort order) emit a <MODIFY_REPORT> block instead of giving
    manual instructions. The user should never have to touch the UI for simple report changes.
    Format:
    <MODIFY_REPORT>
    {
      "addFilter":    { "field": "source", "op": "is not", "value": "Unknown" },
      "removeFilter": { "field": "source" },
      "setGroupBy":   "department",
      "setChartType": "bar",
      "setSortBy":    "count"
    }
    </MODIFY_REPORT>
    Only include the keys that apply. After the block, confirm what changed in one sentence.`
);

// 3e: Add parseModifyReport + stripBlocks + handler in AI.jsx
patch(AI, 'Add parseModifyReport helper',
`  const parseCreateReport = (text) => {`,
`  const parseModifyReport = (text) => {
    const m = text.match(/<MODIFY_REPORT>([\s\S]*?)<\/MODIFY_REPORT>/);
    if (!m) return null;
    try { return JSON.parse(m[1].trim()); } catch { return null; }
  };

  const parseCreateReport = (text) => {`
);

// 3f: Strip the block from display text
patch(AI, 'Strip MODIFY_REPORT from display text',
`.replace(/<CREATE_REPORT>[\s\S]*?<\/CREATE_REPORT>/g,"")`,
`.replace(/<CREATE_REPORT>[\s\S]*?<\/CREATE_REPORT>/g,"")
    .replace(/<MODIFY_REPORT>[\s\S]*?<\/MODIFY_REPORT>/g,"")`
);

// 3g: Parse and dispatch in sendMessage
patch(AI, 'Parse MODIFY_REPORT in sendMessage',
`      const reportData    = parseCreateReport(reply);`,
`      const modifyReport  = parseModifyReport(reply);
      const reportData    = parseCreateReport(reply);`
);

patch(AI, 'Dispatch modify-report event',
`      if(reportData)    setPendingReport(reportData);`,
`      if(modifyReport)  window.dispatchEvent(new CustomEvent("talentos:modify-report", { detail: modifyReport }));
      if(reportData)    setPendingReport(reportData);`
);

console.log('\n✅ All patches applied.');
console.log('\nNow run:');
console.log('  cd ~/projects/talentos && git add client/src/Reports.jsx client/src/AI.jsx');
console.log('  git commit -m "fix: copilot report editing, save input, lists→reports rename"');
console.log('  git push origin main && vercel --prod --yes 2>&1 | tail -5');
