// server/routes/question_bank.js
const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getStore, saveStore } = require('../db/init');

// Seeding is handled in server/index.js initDB block

// ─── QUESTIONS ───────────────────────────────────────────────────────────────
router.get('/questions', (req, res) => {
  const { type, search } = req.query;
  const store = getStore();
  let qs = store.question_bank_v2 || [];
  if (type)   qs = qs.filter(q=>q.type===type);
  if (search) { const s=search.toLowerCase(); qs=qs.filter(q=>q.text.toLowerCase().includes(s)||(q.competency||'').toLowerCase().includes(s)||(q.tags||[]).some(t=>t.includes(s))); }
  res.json(qs);
});

router.post('/questions', (req, res) => {
  const { text, type, competency, weight, options, pass_value, tags } = req.body;
  if (!text||!type) return res.status(400).json({error:'text and type required'});
  const store = getStore();
  const q = { id:uuidv4(), text, type, competency:competency||type, weight:weight||10, options:options||null, pass_value:pass_value||null, tags:tags||[], is_custom:true, is_system:false, created_at:new Date().toISOString() };
  if (!store.question_bank_v2) store.question_bank_v2=[];
  store.question_bank_v2.push(q);
  saveStore(store);
  res.json(q);
});

router.patch('/questions/:id', (req, res) => {
  const store = getStore();
  const idx = (store.question_bank_v2||[]).findIndex(q=>q.id===req.params.id);
  if (idx===-1) return res.status(404).json({error:'Not found'});
  ['text','type','competency','weight','options','pass_value','tags'].forEach(k=>{if(req.body[k]!==undefined)store.question_bank_v2[idx][k]=req.body[k];});
  store.question_bank_v2[idx].updated_at=new Date().toISOString();
  saveStore(store);
  res.json(store.question_bank_v2[idx]);
});

router.delete('/questions/:id', (req, res) => {
  const store = getStore();
  const idx = (store.question_bank_v2||[]).findIndex(q=>q.id===req.params.id&&!q.is_system);
  if (idx===-1) return res.status(404).json({error:'Custom question not found'});
  store.question_bank_v2.splice(idx,1);
  saveStore(store);
  res.json({deleted:true});
});

// ─── TEMPLATES ────────────────────────────────────────────────────────────────
router.get('/templates', (req, res) => {
  const store = getStore();
  const templates = (store.question_templates||[]).map(tpl=>({...tpl,question_count:(tpl.question_ids||[]).length}));
  res.json(templates);
});

router.get('/templates/:id', (req, res) => {
  const store = getStore();
  const tpl = (store.question_templates||[]).find(t=>t.id===req.params.id);
  if (!tpl) return res.status(404).json({error:'Not found'});
  const questions = (store.question_bank_v2||[]).filter(q=>(tpl.question_ids||[]).includes(q.id));
  res.json({...tpl,questions});
});

router.post('/templates', (req, res) => {
  const { name, description, category, question_ids } = req.body;
  if (!name) return res.status(400).json({error:'name required'});
  const store = getStore();
  const tpl = { id:uuidv4(), name, description:description||'', category:category||'Custom', question_ids:question_ids||[], is_system:false, created_at:new Date().toISOString() };
  if (!store.question_templates) store.question_templates=[];
  store.question_templates.push(tpl);
  saveStore(store);
  res.json(tpl);
});

router.patch('/templates/:id', (req, res) => {
  const store = getStore();
  const idx = (store.question_templates||[]).findIndex(t=>t.id===req.params.id);
  if (idx===-1) return res.status(404).json({error:'Not found'});
  if (store.question_templates[idx].is_system) return res.status(403).json({error:'System templates cannot be edited'});
  ['name','description','category','question_ids'].forEach(k=>{if(req.body[k]!==undefined)store.question_templates[idx][k]=req.body[k];});
  store.question_templates[idx].updated_at=new Date().toISOString();
  saveStore(store);
  res.json(store.question_templates[idx]);
});

router.delete('/templates/:id', (req, res) => {
  const store = getStore();
  const idx = (store.question_templates||[]).findIndex(t=>t.id===req.params.id&&!t.is_system);
  if (idx===-1) return res.status(404).json({error:'Not found or system template'});
  store.question_templates.splice(idx,1);
  saveStore(store);
  res.json({deleted:true});
});

// ─── JOB QUESTIONS ────────────────────────────────────────────────────────────
router.get('/jobs/:job_id', (req, res) => {
  const store = getStore();
  const assignments = (store.job_questions||[]).filter(jq=>jq.job_id===req.params.job_id);
  const qIds = assignments.map(a=>a.question_id);
  const questions = (store.question_bank_v2||[]).filter(q=>qIds.includes(q.id));
  const ordered = assignments.map(a=>({...questions.find(q=>q.id===a.question_id),order:a.order})).filter(Boolean).sort((a,b)=>(a.order||0)-(b.order||0));
  res.json(ordered);
});

router.put('/jobs/:job_id', (req, res) => {
  const { question_ids } = req.body;
  if (!Array.isArray(question_ids)) return res.status(400).json({error:'question_ids array required'});
  const store = getStore();
  if (!store.job_questions) store.job_questions=[];
  store.job_questions = store.job_questions.filter(jq=>jq.job_id!==req.params.job_id);
  question_ids.forEach((qid,i)=>store.job_questions.push({id:uuidv4(),job_id:req.params.job_id,question_id:qid,order:i,created_at:new Date().toISOString()}));
  saveStore(store);
  res.json({job_id:req.params.job_id,question_count:question_ids.length});
});

// AI-generate questions for a job
router.post('/jobs/:job_id/generate', async (req, res) => {
  const { job_id } = req.params;
  const { job_title, department, description, skills, count=8 } = req.body;
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({error:'AI not configured'});

  // Fetch existing questions so Claude avoids duplicates
  const { query } = require('../db/init');
  const existing = query('question_bank_questions', () => true);
  const existingTexts = existing.map(q => q.text).join('\n- ');

  // Also fetch already-assigned questions for this job
  const assignments = query('question_bank_job_assignments', r => r.job_id === job_id);
  const assignedIds = new Set(assignments.map(a => a.question_id));
  const assignedTexts = existing.filter(q => assignedIds.has(q.id)).map(q => q.text).join('\n- ');

  const prompt = `You are an expert recruiter creating interview questions for a ${job_title||'role'} role${department?` in ${department}`:''}.\n${description?`Job description: ${description}\n`:''}${skills?`Required skills: ${Array.isArray(skills)?skills.join(', '):skills}\n`:''}\n\nGenerate exactly ${count} high-quality, ROLE-SPECIFIC interview questions. Aim for:\n- 1-2 knockout/eligibility checks (type: "knockout")\n- 2-3 competency/behavioural questions specific to this role (type: "competency")\n- 1-2 technical questions about the required skills (type: "technical")\n- 1-2 culture fit questions (type: "culture")\n\n${existingTexts ? `IMPORTANT - The following questions already exist in the library. Do NOT generate anything similar or overlapping:\n- ${existingTexts}\n\n` : ''}${assignedTexts ? `These questions are already assigned to this job - do not repeat them:\n- ${assignedTexts}\n\n` : ''}Make every question specific to the role, not generic. Avoid generic questions like "Tell me about yourself" or "What are your strengths".\n\nRespond with valid JSON array only:\n[{"text":"...","type":"knockout|competency|technical|culture","competency":"...","weight":10,"tags":["..."],"options":null,"pass_value":null}]\nFor knockout questions add options like ["Yes","No"] and pass_value.`;
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:2000,messages:[{role:'user',content:prompt}]})});
    const data = await response.json();
    const raw = data.content?.[0]?.text||'[]';
    const cleaned = raw.replace(/```json\n?|\n?```/g,'').trim();
    const generated = JSON.parse(cleaned);

    // Similarity dedup — filter out any question too similar to existing ones
    const normalize = s => s.toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim();
    const existingNorm = existing.map(q => normalize(q.text));
    const deduped = generated.filter(q => {
      const n = normalize(q.text);
      // Reject if >50% word overlap with any existing question
      const words = new Set(n.split(' ').filter(w => w.length > 4));
      return !existingNorm.some(en => {
        const enWords = en.split(' ').filter(w => w.length > 4);
        if (!enWords.length || !words.size) return false;
        const overlap = enWords.filter(w => words.has(w)).length;
        return overlap / Math.min(words.size, enWords.length) > 0.5;
      });
    });

    // Return as preview — don't save yet, let the client decide which to keep
    res.json({ preview: deduped, filtered_count: generated.length - deduped.length });
  } catch(err) { console.error('AI gen error:',err); res.status(500).json({error:'Failed to generate questions'}); }
});

module.exports = router;
