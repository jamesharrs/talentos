const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query, insert, remove } = require('../db/init');

router.get('/', (req, res) => {
  const { record_id } = req.query;
  if (!record_id) return res.status(400).json({ error: 'record_id required' });
  res.json(query('attachments', a => a.record_id === record_id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
});

router.post('/', (req, res) => {
  const { record_id, name, size, type, url, uploaded_by } = req.body;
  if (!record_id || !name) return res.status(400).json({ error: 'record_id and name required' });
  res.status(201).json(insert('attachments', { id: uuidv4(), record_id, name, size: size || 0, type: type || 'application/octet-stream', url: url || '#', uploaded_by: uploaded_by || 'Admin', created_at: new Date().toISOString() }));
});

router.delete('/:id', (req, res) => {
  remove('attachments', x => x.id === req.params.id);
  res.json({ deleted: true });
});

module.exports = router;
