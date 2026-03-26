#!/usr/bin/env node
/**
 * insert-filter-state.js — run from ~/projects/talentos
 * Inserts editingFilter useState + 4 handlers inside RecordsView.
 */
const fs = require('fs');
const os = require('os');

const FILE = os.homedir() + '/projects/talentos/client/src/Records.jsx';
let src = fs.readFileSync(FILE, 'utf8');

// Verify useState is NOT already declared for editingFilter
if (src.includes('[editingFilter, setEditingFilter]')) {
  console.log('useState already declared — nothing to do');
  process.exit(0);
}

// ── Find a reliable anchor inside RecordsView ─────────────────────────────────
// handleSort is always inside RecordsView and stable
const ANCHOR = `  // Sort handler
  const handleSort = (key) => {`;

if (!src.includes(ANCHOR)) {
  // Try alternate
  const alt = `  const handleSort = (key) => {`;
  if (!src.includes(alt)) {
    console.error('Cannot find handleSort — check file');
    process.exit(1);
  }
}

const anchor = src.includes(ANCHOR) ? ANCHOR : `  const handleSort = (key) => {`;

const NEW_BLOCK = `  // ── Column filter popover state ─────────────────────────────────────────────
  const [editingFilter, setEditingFilter] = useState(null);
  // { fieldId, filterId|null, op, value, rect }

  const handleColumnFilter = (field, rect) => {
    const existing = activeFilters.find(f => f.fieldId === field.id);
    setEditingFilter({
      fieldId:  field.id,
      filterId: existing?.id ?? null,
      op:       existing?.op    ?? getOpsForField(field)[0],
      value:    existing?.value ?? "",
      rect,
    });
  };

  const handleEditFilter = (filt, rect) => {
    setEditingFilter({ fieldId: filt.fieldId, filterId: filt.id, op: filt.op, value: filt.value, rect });
  };

  const handleApplyFilter = (op, value) => {
    if (!editingFilter) return;
    const { fieldId, filterId } = editingFilter;
    setActiveFilters(prev =>
      filterId
        ? prev.map(f => f.id === filterId ? { ...f, op, value } : f)
        : [...prev, { id: Date.now() + "", fieldId, op, value }]
    );
    setEditingFilter(null);
  };

  const handleClearFilter = () => {
    if (editingFilter?.filterId) setActiveFilters(prev => prev.filter(f => f.id !== editingFilter.filterId));
    setEditingFilter(null);
  };

  `;

src = src.replace(anchor, NEW_BLOCK + anchor);
console.log('✓ Inserted editingFilter useState + 4 handlers before handleSort');

// ── Remove any old single-arg handleColumnFilter that may still be there ──────
const OLD_COL_FILTER = `  // Column filter handler — clicking the filter icon on a header opens the filter bar for that field
  const handleColumnFilter = (field) => {
    // Just add a sensible default filter for this field so the user can see and edit it
    setActiveFilters(prev => {
      // Don't add a duplicate for the same field
      if (prev.some(f => f.fieldId === field.id)) return prev;
      const defaultOp = ["select","multi_select","boolean"].includes(field.field_type) ? "is" : "contains";
      return [...prev, { id: Date.now()+"", fieldId: field.id, op: defaultOp, value: "" }];
    });
  };`;

if (src.includes(OLD_COL_FILTER)) {
  src = src.replace(OLD_COL_FILTER, '');
  console.log('✓ Removed old single-arg handleColumnFilter');
} else {
  console.log('  (old handleColumnFilter not found — skipping removal)');
}

// ── Also ensure activeFilters is passed to TableView ─────────────────────────
if (!src.includes('activeFilters={activeFilters}')) {
  src = src.replace(
    /onColumnFilter=\{handleColumnFilter\}\n(\s*)colWidths=/,
    'activeFilters={activeFilters}\n$1onColumnFilter={handleColumnFilter}\n$1colWidths='
  );
  console.log('✓ activeFilters passed to TableView');
} else {
  console.log('✓ activeFilters already in TableView — skipped');
}

fs.writeFileSync(FILE, src);
console.log('\n✅ Done — Vite will hot-reload');
