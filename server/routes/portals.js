const express = require('express');
const router = express.Router();
const { getStore, saveStore } = require('../db/init');
const crypto = require('crypto');

const uid = () => crypto.randomUUID();
const token = () => crypto.randomBytes(24).toString('hex');

// GET /api/portals — list all portals (optionally filter by environment)
router.get('/', (req, res) => {
  const store = getStore();
  let portals = store.portals || [];
  if (req.query.environment_id) portals = portals.filter(p => p.environment_id === req.query.environment_id);
  res.json(portals);
});

// GET /api/portals/:id
router.get('/:id', (req, res) => {
  const store = getStore();
  const portal = (store.portals || []).find(p => p.id === req.params.id);
  if (!portal) return res.status(404).json({ error: 'Not found' });
  res.json(portal);
});

// GET /api/portals/token/:token — public lookup by access token
router.get('/token/:token', (req, res) => {
  const store = getStore();
  const portal = (store.portals || []).find(p => p.access_token === req.params.token && p.status === 'published');
  if (!portal) return res.status(404).json({ error: 'Portal not found or unpublished' });
  res.json(portal);
});

// POST /api/portals — create portal
router.post('/', (req, res) => {
  const store = getStore();
  if (!store.portals) store.portals = [];
  const { name, type, environment_id, branding, config, pages } = req.body;
  if (!name || !type || !environment_id) return res.status(400).json({ error: 'name, type, environment_id required' });
  const portal = {
    id: uid(),
    name,
    type,              // 'career_site' | 'hm_portal' | 'agency_portal' | 'onboarding'
    environment_id,
    status: 'draft',   // 'draft' | 'published'
    access_token: token(),
    branding: branding || {
      logo_url: '', primary_color: '#4361EE', bg_color: '#F8FAFF',
      font: 'DM Sans', company_name: '', tagline: ''
    },
    config: config || {
      allowed_objects: [],   // which object slugs to expose
      require_auth: false,   // candidates must log in
      show_apply_button: true,
      jobs_filter: {},       // e.g. { department: 'Engineering' }
    },
    pages: pages || [],      // array of page configs
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  store.portals.push(portal);
  saveStore(store);
  res.status(201).json(portal);
});

// PUT /api/portals/:id — update portal
router.put('/:id', (req, res) => {
  const store = getStore();
  const idx = (store.portals || []).findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  store.portals[idx] = { ...store.portals[idx], ...req.body, id: req.params.id, updated_at: new Date().toISOString() };
  saveStore(store);
  res.json(store.portals[idx]);
});

// POST /api/portals/:id/publish — toggle publish status
router.post('/:id/publish', (req, res) => {
  const store = getStore();
  const idx = (store.portals || []).findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  store.portals[idx].status = store.portals[idx].status === 'published' ? 'draft' : 'published';
  store.portals[idx].updated_at = new Date().toISOString();
  saveStore(store);
  res.json(store.portals[idx]);
});

// POST /api/portals/:id/regenerate-token
router.post('/:id/regenerate-token', (req, res) => {
  const store = getStore();
  const idx = (store.portals || []).findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  store.portals[idx].access_token = token();
  store.portals[idx].updated_at = new Date().toISOString();
  saveStore(store);
  res.json(store.portals[idx]);
});

// DELETE /api/portals/:id
router.delete('/:id', (req, res) => {
  const store = getStore();
  store.portals = (store.portals || []).filter(p => p.id !== req.params.id);
  saveStore(store);
  res.json({ ok: true });
});

module.exports = router;
