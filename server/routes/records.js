const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query, findOne, insert, update, remove } = require('../db/init');

router.get('/', (req, res) => {
  const { object_id, environment_id, page=1, limit=50, search, sort_dir='desc' } = req.query;
  if (!object_id||!environment_id) return res.status(400).json({error:'object_id and environment_id required'});
  let records = query('records', r=>r.object_id===object_id&&r.environment_id===environment_id&&!r.deleted_at);
  if (search) records = records.filter(r=>JSON.stringify(r.data).toLowerCase().includes(search.toLowerCase()));
  records.sort((a,b)=>sort_dir==='asc'?new Date(a.created_at)-new Date(b.created_at):new Date(b.created_at)-new Date(a.created_at));
  const total = records.length;
  const start = (parseInt(page)-1)*parseInt(limit);
  res.json({records:records.slice(start,start+parseInt(limit)),pagination:{total,page:parseInt(page),limit:parseInt(limit),pages:Math.ceil(total/parseInt(limit))}});
});

router.get('/:id', (req, res) => {
  const r = findOne('records', r=>r.id===req.params.id&&!r.deleted_at);
  r ? res.json(r) : res.status(404).json({error:'Not found'});
});

router.post('/', (req, res) => {
  const { object_id, environment_id, data={}, created_by } = req.body;
  if (!object_id||!environment_id) return res.status(400).json({error:'object_id and environment_id required'});
  const required = query('fields', f=>f.object_id===object_id&&f.is_required);
  const missing = required.filter(f=>!data[f.api_key]&&data[f.api_key]!==0);
  if (missing.length) return res.status(400).json({error:'Missing required fields',missing:missing.map(f=>f.api_key)});
  const record = insert('records', {id:uuidv4(),object_id,environment_id,data,created_by:created_by||null,created_at:new Date().toISOString(),updated_at:new Date().toISOString(),deleted_at:null});
  insert('activity', {id:uuidv4(),environment_id,record_id:record.id,object_id,action:'created',actor:created_by||null,changes:data,created_at:new Date().toISOString()});
  res.status(201).json(record);
});

router.patch('/:id', (req, res) => {
  const record = findOne('records', r=>r.id===req.params.id&&!r.deleted_at);
  if (!record) return res.status(404).json({error:'Not found'});
  const { data, updated_by } = req.body;
  const updated = update('records', r=>r.id===req.params.id, {data:{...record.data,...data}});
  insert('activity', {id:uuidv4(),environment_id:record.environment_id,record_id:record.id,object_id:record.object_id,action:'updated',actor:updated_by||null,changes:data,created_at:new Date().toISOString()});
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  update('records', r=>r.id===req.params.id, {deleted_at:new Date().toISOString()});
  res.json({deleted:true});
});

router.get('/:id/activity', (req, res) => {
  res.json(query('activity', a=>a.record_id===req.params.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,50));
});

module.exports = router;
