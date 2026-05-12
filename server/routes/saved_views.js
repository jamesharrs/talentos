const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query, insert, update, remove, getStore, saveStore } = require('../db/init');

// Wraps async route handlers so unhandled promise rejections flow to Express
// global error handler instead of silently crashing the request.
const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);


// Ensure saved_views table exists
function ensureTable() {
  const store = getStore();
  if (!store.saved_views) { store.saved_views = []; saveStore(); }
}

// GET /api/saved-views?object_id=&environment_id=&user_id=
router.get('/', (req, res) => {
  ensureTable();
  const { object_id, environment_id, user_id } = req.query;
  if (!environment_id) return res.status(400).json({ error: 'environment_id required' });
  const views = query('saved_views', v => {
    if (v.deleted_at) return false; // exclude soft-deleted
    if (v.environment_id !== environment_id) return false;
    // If object_id is supplied, filter to that object only
    if (object_id && v.object_id !== object_id) return false;
    if (user_id === 'system') return true; // widget config bypass — show all lists
    if (!user_id) return true; // no user filter — return all
    if (v.created_by === user_id) return true;
    const sh = v.sharing;
    if (!sh) return !!v.is_shared; // legacy
    if (sh.visibility === 'everyone') return true;
    if (sh.visibility === 'specific') {
      if ((sh.user_ids || []).includes(user_id)) return true;
    }
    return false;
  }).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  res.json(views);
});

// GET /api/saved-views/pinned?environment_id=
router.get('/pinned', (req, res) => {
  ensureTable();
  const { environment_id } = req.query;
  if (!environment_id) return res.status(400).json({ error: 'environment_id required' });
  const pinned = query('saved_views', v => v.environment_id === environment_id && v.pinned === true)
    .sort((a, b) => (a.dashboard_position ?? 99) - (b.dashboard_position ?? 99));
  res.json(pinned);
});

// GET /api/saved-views/portal-lists?environment_id= — lists marked portal_visible
router.get('/portal-lists', (req, res) => {
  ensureTable();
  const { environment_id } = req.query;
  if (!environment_id) return res.status(400).json({ error: 'environment_id required' });
  const lists = query('saved_views', v =>
    v.environment_id === environment_id && v.portal_visible === true
  );
  res.json(lists);
});

// GET /api/saved-views/all-reports?environment_id= — saved views usable as report widgets
router.get('/all-reports', (req, res) => {
  ensureTable();
  const { environment_id } = req.query;
  if (!environment_id) return res.status(400).json({ error: 'environment_id required' });
  const reports = query('saved_views', v =>
    v.environment_id === environment_id &&
    !!(v.chart_type || v.group_by || (Array.isArray(v.formulas) && v.formulas.length))
  ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(reports);
});

// GET /api/saved-views/:id
router.get('/:id', (req, res) => {
  ensureTable();
  const view = query('saved_views', v => v.id === req.params.id)[0];
  if (!view) return res.status(404).json({ error: 'View not found' });
  res.json(view);
});

// POST /api/saved-views
router.post('/', (req, res) => {
  ensureTable();
  const { name, object_id, environment_id, created_by, is_shared, filters, filter_chip,
          visible_field_ids, view_mode, pinned, dashboard_position,
          columns, group_by, sort_by, sort_dir, formulas, chart_type, chart_x, chart_y } = req.body;
  if (!name || !object_id || !environment_id) return res.status(400).json({ error: 'name, object_id, environment_id required' });
  const view = insert('saved_views', {
    id: uuidv4(), name, object_id, environment_id,
    created_by: created_by || 'unknown',
    is_shared: !!is_shared,
    sharing: req.body.sharing || { visibility: is_shared ? 'everyone' : 'private', user_ids: [], group_ids: [] },
    filters: filters || [],
    filter_chip: filter_chip || null,
    visible_field_ids: visible_field_ids || [],
    view_mode: view_mode || 'table',
    pinned: !!pinned,
    dashboard_position: dashboard_position ?? null,
    columns: columns || [],
    group_by: group_by || '',
    sort_by: sort_by || '',
    sort_dir: sort_dir || 'desc',
    formulas: formulas || [],
    chart_type: chart_type || 'bar',
    chart_x: chart_x || '',
    chart_y: chart_y || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  res.status(201).json(view);
});

// PATCH /api/saved-views/:id
router.patch('/:id', (req, res) => {
  ensureTable();
  const allowed = ['name','is_shared','filters','visible_field_ids','view_mode','sharing',
                   'pinned','dashboard_position','columns','group_by','sort_by','sort_dir',
                   'formulas','chart_type','chart_x','chart_y','filter_chip',
                   'portal_visible','portal_label','portal_icon'];
  const up = { updated_at: new Date().toISOString() };
  allowed.forEach(k => { if (req.body[k] !== undefined) up[k] = req.body[k]; });
  if (up.is_shared !== undefined) up.is_shared = !!up.is_shared;
  if (up.pinned    !== undefined) up.pinned    = !!up.pinned;
  const updated = update('saved_views', v => v.id === req.params.id, up);
  updated ? res.json(updated) : res.status(404).json({ error: 'Not found' });
});

// DELETE /api/saved-views/:id — soft delete (survives 24h for recovery)
router.delete('/:id', (req, res) => {
  ensureTable();
  const store = getStore();
  const view = (store.saved_views || []).find(v => v.id === req.params.id);
  if (!view) return res.status(404).json({ error: 'Not found' });
  view.deleted_at = new Date().toISOString();
  view.updated_at = new Date().toISOString();
  saveStore();
  res.json({ deleted: true });
});

// POST /api/saved-views/:id/restore — restore a soft-deleted report
router.post('/:id/restore', (req, res) => {
  ensureTable();
  const store = getStore();
  const view = (store.saved_views || []).find(v => v.id === req.params.id);
  if (!view) return res.status(404).json({ error: 'Not found' });
  delete view.deleted_at;
  view.updated_at = new Date().toISOString();
  saveStore();
  res.json(view);
});

// GET /api/saved-views/recently-deleted?environment_id=
router.get('/recently-deleted', (req, res) => {
  ensureTable();
  const { environment_id } = req.query;
  if (!environment_id) return res.status(400).json({ error: 'environment_id required' });
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const deleted = query('saved_views', v =>
    v.environment_id === environment_id &&
    v.deleted_at && v.deleted_at >= cutoff
  ).sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));
  res.json(deleted);
});

module.exports = router;
