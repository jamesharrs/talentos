const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query, findOne, insert, update, remove } = require('../db/init');

// Wraps async route handlers so unhandled promise rejections flow to Express
// global error handler instead of silently crashing the request.
const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);


router.get('/', (req, res) => {
  const { record_id, related_record_id } = req.query;
  if (!record_id) return res.status(400).json({ error: 'record_id required' });
  let notes = query('notes', n => n.record_id === record_id);
  if (related_record_id === 'general') {
    notes = notes.filter(n => !n.related_record_id);
  } else if (related_record_id) {
    notes = notes.filter(n => n.related_record_id === related_record_id);
  }
  res.json(notes.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
});

router.post('/', (req, res) => {
  const { record_id, content, author, related_record_id } = req.body;
  if (!record_id || !content) return res.status(400).json({ error: 'record_id and content required' });
  const note = insert('notes', {
    id: uuidv4(), record_id, content,
    author: author || 'Admin',
    related_record_id: related_record_id || null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  });
  // Log to activity
  const rec = findOne('records', r => r.id === record_id);
  if (rec) insert('activity', { id: uuidv4(), record_id, object_id: rec.object_id, environment_id: rec.environment_id, action: 'note_added', actor: author || 'Admin', changes: { preview: content.slice(0, 100) }, created_at: new Date().toISOString() });
  res.status(201).json(note);
});

router.patch('/:id', (req, res) => {
  const n = update('notes', x => x.id === req.params.id, { content: req.body.content });
  n ? res.json(n) : res.status(404).json({ error: 'Not found' });
});

router.delete('/:id', (req, res) => {
  remove('notes', x => x.id === req.params.id);
  res.json({ deleted: true });
});

module.exports = router;
