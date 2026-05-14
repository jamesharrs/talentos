'use strict';
const express = require('express');
const router  = express.Router();
const { getStore, saveStore, tenantStorage } = require('../db/init');
const { v4: uuidv4 } = require('uuid');

// ── Helpers — always operate on the MASTER store ──────────────────────────────
// Release notes are global (Vercentic-wide), not per-tenant.
function masterQuery(fn) {
  let result;
  tenantStorage.run('master', () => { result = (getStore().release_notes || []).filter(fn); });
  return result;
}
function masterGet() {
  let result;
  tenantStorage.run('master', () => { result = getStore().release_notes || []; });
  return result;
}
function masterSave(mutateFn) {
  tenantStorage.run('master', () => {
    const s = getStore();
    if (!s.release_notes) s.release_notes = [];
    mutateFn(s);
    saveStore('master');
  });
}

// ── Auto-publish scheduled notes ─────────────────────────────────────────────
function autoPublishScheduled() {
  tenantStorage.run('master', () => {
    const s = getStore();
    if (!s.release_notes) return;
    const now = new Date();
    let changed = false;
    s.release_notes = s.release_notes.map(n => {
      if (!n.published && n.scheduled_at && new Date(n.scheduled_at) <= now) {
        changed = true;
        return { ...n, published: true, published_at: n.scheduled_at, updated_at: now.toISOString() };
      }
      return n;
    });
    if (changed) saveStore('master');
  });
}

// ── Seed default notes ────────────────────────────────────────────────────────
function seedReleaseNotes() {
  tenantStorage.run('master', () => {
    const s = getStore();
    if (!s.release_notes) s.release_notes = [];
    if (s.release_notes.length > 0) return;
    const notes = [
      { id: uuidv4(), version: '1.0.0', title: 'Platform Launch', summary: 'Initial release of the Vercentic platform.', summary_rich: null, category: 'feature', features: ['Dynamic data model with custom objects and fields', 'People, Jobs, and Talent Pools core objects', 'Record list view with search and filtering', 'Settings with user and role management'], published: true, published_at: '2026-03-07T00:00:00.000Z', scheduled_at: null, display_at_login: false, dismissed_by: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: uuidv4(), version: '1.1.0', title: 'AI Copilot & Record Management', summary: 'Introduced the AI Copilot and enhanced record management.', summary_rich: null, category: 'feature', features: ['AI Copilot with natural language record creation', 'People to Job AI matching engine', 'Full record detail page with 2-column layout', 'Communications panel — email, SMS, WhatsApp, call logging', 'Workflow builder with pipeline stages'], published: true, published_at: '2026-03-08T00:00:00.000Z', scheduled_at: null, display_at_login: false, dismissed_by: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: uuidv4(), version: '1.2.0', title: 'Portal Builder & Search', summary: 'External portals for career sites, plus universal search.', summary_rich: null, category: 'feature', features: ['Portal builder with Career Site, HM Portal, Agency Portal types', 'Global search bar with live results across all objects', 'Advanced filter builder with saved lists', 'Dashboard with interactive charts'], published: true, published_at: '2026-03-09T00:00:00.000Z', scheduled_at: null, display_at_login: false, dismissed_by: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: uuidv4(), version: '1.7.0', title: 'Portal Builder v2', summary: 'Major portal builder upgrade with five new capabilities.', summary_rich: null, category: 'feature', features: ['Multi-step Form widget with progress indicator', 'Nav & Footer editors from within the builder', 'Section Library — 15+ pre-built row templates', 'Portal Analytics — page views, clicks, applications', 'Conditional Row Visibility based on URL parameters'], published: true, published_at: '2026-03-22T00:00:00.000Z', scheduled_at: null, display_at_login: false, dismissed_by: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ];
    s.release_notes = notes;
    saveStore('master');
    console.log('Seeded ' + notes.length + ' release notes into master store');
  });
}

// ── GET / ─────────────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    seedReleaseNotes();
    autoPublishScheduled();
    const { published_only, user_id } = req.query;
    let notes = masterGet().sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));
    if (published_only !== 'false') notes = notes.filter(n => n.published);
    if (user_id) {
      notes = notes.map(n => ({ ...n, dismissed: Array.isArray(n.dismissed_by) && n.dismissed_by.includes(user_id) }));
    }
    res.json(notes);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /login-modal ──────────────────────────────────────────────────────────
router.get('/login-modal', (req, res) => {
  try {
    seedReleaseNotes();
    autoPublishScheduled();
    const { user_id } = req.query;
    if (!user_id) return res.json([]);
    const notes = masterQuery(n =>
      n.published && n.display_at_login &&
      !(Array.isArray(n.dismissed_by) && n.dismissed_by.includes(user_id))
    ).sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
    res.json(notes);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /:id/dismiss ─────────────────────────────────────────────────────────
router.post('/:id/dismiss', (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });
    const note = masterQuery(n => n.id === req.params.id)[0];
    if (!note) return res.status(404).json({ error: 'Not found' });
    masterSave(s => {
      s.release_notes = s.release_notes.map(n => {
        if (n.id !== req.params.id) return n;
        const dismissed_by = Array.isArray(n.dismissed_by) ? [...n.dismissed_by] : [];
        if (!dismissed_by.includes(user_id)) dismissed_by.push(user_id);
        return { ...n, dismissed_by, updated_at: new Date().toISOString() };
      });
    });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /:id ──────────────────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const note = masterQuery(n => n.id === req.params.id)[0];
  if (!note) return res.status(404).json({ error: 'Not found' });
  res.json(note);
});

// ── POST / — create ───────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const { version, title, summary = '', summary_rich = null, category = 'feature',
            features = [], published = false, scheduled_at = null, display_at_login = false } = req.body;
    if (!version || !title) return res.status(400).json({ error: 'version and title required' });
    const note = {
      id: uuidv4(), version, title, summary, summary_rich, category,
      features: Array.isArray(features) ? features : [],
      published: !!published,
      published_at: published ? new Date().toISOString() : null,
      scheduled_at: scheduled_at || null,
      display_at_login: !!display_at_login,
      dismissed_by: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    masterSave(s => s.release_notes.push(note));
    res.status(201).json(note);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PATCH /:id ────────────────────────────────────────────────────────────────
router.patch('/:id', (req, res) => {
  try {
    const existing = masterQuery(n => n.id === req.params.id)[0];
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const updates = { ...req.body, updated_at: new Date().toISOString() };
    if (updates.published && !existing.published && !updates.published_at) {
      updates.published_at = new Date().toISOString();
      updates.scheduled_at = null;
    }
    if (updates.published === false) updates.published_at = null;
    if (updates.scheduled_at && !updates.published) { updates.published = false; updates.published_at = null; }
    masterSave(s => { s.release_notes = s.release_notes.map(n => n.id === req.params.id ? { ...n, ...updates } : n); });
    res.json({ ...existing, ...updates });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /:id ───────────────────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    masterSave(s => { s.release_notes = s.release_notes.filter(n => n.id !== req.params.id); });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
