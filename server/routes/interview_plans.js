// server/routes/interview_plans.js
const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query, findOne, insert, update, getStore, saveStore } = require('../db/init');

// Wraps async route handlers so unhandled promise rejections flow to Express
// global error handler instead of silently crashing the request.
const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);


const ensure = () => {
  const s = getStore();
  if (!s.interview_plans)       s.interview_plans = [];
  if (!s.interview_plan_stages) s.interview_plan_stages = [];
};

// GET /api/interview-plans?job_id=&environment_id=
router.get('/', (req, res) => {
  ensure();
  const { job_id, environment_id } = req.query;
  let plans = query('interview_plans', () => true);
  if (job_id)         plans = plans.filter(p => p.job_id === job_id);
  if (environment_id) plans = plans.filter(p => p.environment_id === environment_id);
  const result = plans.map(p => ({
    ...p,
    stages: query('interview_plan_stages', s => s.plan_id === p.id).sort((a,b)=>a.order-b.order),
  }));
  res.json(result);
});

// POST /api/interview-plans  — create or return existing (one per job)
router.post('/', (req, res) => {
  ensure();
  const { job_id, environment_id } = req.body;
  if (!job_id || !environment_id) return res.status(400).json({ error:'job_id and environment_id required' });
  const existing = findOne('interview_plans', p => p.job_id===job_id && p.environment_id===environment_id);
  if (existing) return res.json({ ...existing, stages: query('interview_plan_stages',s=>s.plan_id===existing.id).sort((a,b)=>a.order-b.order) });
  const plan = insert('interview_plans', { id:uuidv4(), job_id, environment_id, created_at:new Date().toISOString(), updated_at:new Date().toISOString() });
  res.status(201).json({ ...plan, stages:[] });
});

// PUT /api/interview-plans/:id/stages  — replace all stages atomically
router.put('/:id/stages', (req, res) => {
  ensure();
  const { stages=[] } = req.body;
  const s = getStore();
  s.interview_plan_stages = (s.interview_plan_stages||[]).filter(st=>st.plan_id!==req.params.id);
  const saved = stages.map((st, i) => {
    const row = {
      id:                  st.id && !st.id.startsWith('new_') ? st.id : uuidv4(),
      plan_id:             req.params.id,
      name:                st.name || `Stage ${i+1}`,
      order:               i,
      interview_type_id:   st.interview_type_id || null,
      interview_type_name: st.interview_type_name || '',
      duration:            st.duration || 30,
      format:              st.format || 'Video Call',
      interviewers:        st.interviewers || [],
      pass_criteria:       st.pass_criteria || '',
      created_at:          st.created_at || new Date().toISOString(),
    };
    s.interview_plan_stages.push(row);
    return row;
  });
  const pi = (s.interview_plans||[]).findIndex(p=>p.id===req.params.id);
  if (pi>=0) s.interview_plans[pi].updated_at = new Date().toISOString();
  saveStore();
  res.json(saved);
});

// DELETE /api/interview-plans/:id
router.delete('/:id', (req, res) => {
  ensure();
  const s = getStore();
  s.interview_plans       = (s.interview_plans||[]).filter(p=>p.id!==req.params.id);
  s.interview_plan_stages = (s.interview_plan_stages||[]).filter(st=>st.plan_id!==req.params.id);
  saveStore();
  res.json({ ok:true });
});

module.exports = router;
