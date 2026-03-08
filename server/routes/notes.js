const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query, findOne, insert, update, remove } = require('../db/init');

router.get('/', (req, res) => {
  const { record_id } = req.query;
  if (!record_id) return res.status(400).json({ error: 'record_id required' });
  res.json(query('notes', n => n.record_id === record_id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
});

router.post('/', (req, res) => {
  const { record_id, content, author } = req.body;
  if (!record_id || !content) return res.status(400).json({ error: 'record_id and content required' });
  res.status(201).json(insert('notes', { id: uuidv4(), record_id, content, author: author || 'Admin', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }));
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
