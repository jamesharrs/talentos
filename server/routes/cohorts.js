// server/routes/cohorts.js
const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getStore, saveStore } = require('../db/init');

const ensure = () => {
  const s = getStore();
  ['cohorts','cohort_members','cohort_posts','cohort_reactions',
   'cohort_tasks','cohort_task_completions','cohort_resources'].forEach(k => { if (!s[k]) s[k] = []; });
};
const now = () => new Date().toISOString();

// GET /api/cohorts?environment_id=
router.get('/', (req, res) => {
  ensure();
  const { environment_id } = req.query;
  const s = getStore();
  let cohorts = (s.cohorts || []).filter(c => !c.deleted_at);
  if (environment_id) cohorts = cohorts.filter(c => c.environment_id === environment_id);
  const members = s.cohort_members || [];
  cohorts = cohorts.map(c => ({ ...c, member_count: members.filter(m => m.cohort_id === c.id && !m.removed_at).length }));
  res.json(cohorts);
});

// GET /api/cohorts/:id
router.get('/:id', (req, res) => {
  ensure();
  const s = getStore();
  const cohort = (s.cohorts || []).find(c => c.id === req.params.id && !c.deleted_at);
  if (!cohort) return res.status(404).json({ error: 'Not found' });
  const members = (s.cohort_members || []).filter(m => m.cohort_id === cohort.id && !m.removed_at);
  res.json({ ...cohort, member_count: members.length });
});

// POST /api/cohorts
router.post('/', (req, res) => {
  ensure();
  const { environment_id, name, description, programme_type, cohort_year, start_date, intake_size,
    auth_mode = 'magic_link', allow_dm = true, allow_member_posts = true,
    show_member_directory = true, tasks_enabled = true, primary_color = '#8B7EC8', status = 'draft' } = req.body;
  if (!environment_id || !name) return res.status(400).json({ error: 'environment_id and name required' });
  const s = getStore();
  const cohort = {
    id: uuidv4(), environment_id, name,
    description: description || '', programme_type: programme_type || '',
    cohort_year: cohort_year || new Date().getFullYear(),
    start_date: start_date || null, intake_size: intake_size || null,
    auth_mode, allow_dm, allow_member_posts, show_member_directory, tasks_enabled,
    primary_color, status, portal_token: uuidv4(),
    created_at: now(), updated_at: now(), deleted_at: null,
  };
  s.cohorts.push(cohort);
  saveStore();
  res.status(201).json(cohort);
});

// PATCH /api/cohorts/:id
router.patch('/:id', (req, res) => {
  ensure();
  const s = getStore();
  const idx = (s.cohorts || []).findIndex(c => c.id === req.params.id && !c.deleted_at);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const allowed = ['name','description','programme_type','cohort_year','start_date','intake_size',
    'auth_mode','allow_dm','allow_member_posts','show_member_directory','tasks_enabled','primary_color','status'];
  const updates = { updated_at: now() };
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  s.cohorts[idx] = { ...s.cohorts[idx], ...updates };
  saveStore();
  res.json(s.cohorts[idx]);
});

// DELETE /api/cohorts/:id
router.delete('/:id', (req, res) => {
  ensure();
  const s = getStore();
  const idx = (s.cohorts || []).findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  s.cohorts[idx].deleted_at = now();
  saveStore();
  res.json({ deleted: true });
});

// GET /api/cohorts/:id/members
router.get('/:id/members', (req, res) => {
  ensure();
  const s = getStore();
  const members = (s.cohort_members || []).filter(m => m.cohort_id === req.params.id && !m.removed_at);
  const records = s.records || [];
  const enriched = members.map(m => ({ ...m, person_data: records.find(r => r.id === m.person_record_id)?.data || {} }));
  res.json(enriched);
});

// POST /api/cohorts/:id/members
router.post('/:id/members', (req, res) => {
  ensure();
  const s = getStore();
  const cohort = (s.cohorts || []).find(c => c.id === req.params.id && !c.deleted_at);
  if (!cohort) return res.status(404).json({ error: 'Cohort not found' });
  const { person_record_ids = [], person_record_id } = req.body;
  const ids = person_record_id ? [person_record_id] : person_record_ids;
  if (!ids.length) return res.status(400).json({ error: 'person_record_id(s) required' });
  const existing = (s.cohort_members || []).filter(m => m.cohort_id === req.params.id && !m.removed_at).map(m => m.person_record_id);
  const added = [];
  ids.forEach(pid => {
    if (existing.includes(pid)) return;
    const member = { id: uuidv4(), cohort_id: req.params.id, person_record_id: pid, role: 'member',
      auth_mode: cohort.auth_mode, magic_token: uuidv4(), magic_token_expires: null, magic_token_used: false,
      password_hash: null, last_seen: null, intro_posted: false, joined_at: now(), removed_at: null };
    s.cohort_members.push(member);
    added.push(member);
  });
  saveStore();
  res.status(201).json({ added: added.length, members: added });
});

// DELETE /api/cohorts/:id/members/:memberId
router.delete('/:id/members/:memberId', (req, res) => {
  ensure();
  const s = getStore();
  const idx = (s.cohort_members || []).findIndex(m => m.id === req.params.memberId && m.cohort_id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  s.cohort_members[idx].removed_at = now();
  saveStore();
  res.json({ removed: true });
});

// PATCH /api/cohorts/:id/members/:memberId
router.patch('/:id/members/:memberId', (req, res) => {
  ensure();
  const s = getStore();
  const idx = (s.cohort_members || []).findIndex(m => m.id === req.params.memberId && m.cohort_id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  if (req.body.role) s.cohort_members[idx].role = req.body.role;
  s.cohort_members[idx].updated_at = now();
  saveStore();
  res.json(s.cohort_members[idx]);
});

// GET /api/cohorts/:id/posts
router.get('/:id/posts', (req, res) => {
  ensure();
  const s = getStore();
  const { page = 1, limit = 20, type } = req.query;
  let posts = (s.cohort_posts || []).filter(p => p.cohort_id === req.params.id && !p.deleted_at);
  if (type && type !== 'all') posts = posts.filter(p => p.post_type === type);
  posts = posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const reactions = s.cohort_reactions || [];
  const enriched = posts.map(p => ({ ...p, reactions: reactions.filter(r => r.post_id === p.id), reply_count: posts.filter(c => c.parent_id === p.id).length }));
  const total = enriched.filter(p => !p.parent_id).length;
  const top_level = enriched.filter(p => !p.parent_id).slice((page - 1) * limit, page * limit);
  res.json({ posts: top_level, total, page: Number(page), limit: Number(limit) });
});

// POST /api/cohorts/:id/posts
router.post('/:id/posts', (req, res) => {
  ensure();
  const s = getStore();
  const { author_member_id, author_name, author_type, body, post_type = 'post', parent_id, pinned = false, attachments = [] } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: 'body required' });
  const post = { id: uuidv4(), cohort_id: req.params.id, author_member_id: author_member_id || null,
    author_name: author_name || 'Admin', author_type: author_type || 'admin', body: body.trim(),
    post_type, parent_id: parent_id || null, pinned: !!pinned, attachments, edited_at: null,
    deleted_at: null, created_at: now(), updated_at: now() };
  s.cohort_posts.push(post);
  saveStore();
  res.status(201).json(post);
});

// PATCH /api/cohorts/:id/posts/:postId
router.patch('/:id/posts/:postId', (req, res) => {
  ensure();
  const s = getStore();
  const idx = (s.cohort_posts || []).findIndex(p => p.id === req.params.postId && p.cohort_id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  if (req.body.body !== undefined) { s.cohort_posts[idx].body = req.body.body; s.cohort_posts[idx].edited_at = now(); }
  if (req.body.pinned !== undefined) s.cohort_posts[idx].pinned = req.body.pinned;
  s.cohort_posts[idx].updated_at = now();
  saveStore();
  res.json(s.cohort_posts[idx]);
});

// DELETE /api/cohorts/:id/posts/:postId
router.delete('/:id/posts/:postId', (req, res) => {
  ensure();
  const s = getStore();
  const idx = (s.cohort_posts || []).findIndex(p => p.id === req.params.postId && p.cohort_id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  s.cohort_posts[idx].deleted_at = now();
  saveStore();
  res.json({ deleted: true });
});

// POST /api/cohorts/:id/posts/:postId/react
router.post('/:id/posts/:postId/react', (req, res) => {
  ensure();
  const s = getStore();
  const { member_id, emoji = '👍' } = req.body;
  const existing = (s.cohort_reactions || []).findIndex(r => r.post_id === req.params.postId && r.member_id === member_id && r.emoji === emoji);
  if (existing !== -1) { s.cohort_reactions.splice(existing, 1); saveStore(); return res.json({ action: 'removed' }); }
  s.cohort_reactions.push({ id: uuidv4(), post_id: req.params.postId, cohort_id: req.params.id, member_id, emoji, created_at: now() });
  saveStore();
  res.json({ action: 'added' });
});

// GET /api/cohorts/:id/tasks
router.get('/:id/tasks', (req, res) => {
  ensure();
  const s = getStore();
  const tasks = (s.cohort_tasks || []).filter(t => t.cohort_id === req.params.id && !t.deleted_at).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const completions = s.cohort_task_completions || [];
  res.json(tasks.map(t => ({ ...t, completion_count: completions.filter(c => c.task_id === t.id).length })));
});

// GET /api/cohorts/:id/tasks/member/:memberId
router.get('/:id/tasks/member/:memberId', (req, res) => {
  ensure();
  const s = getStore();
  const tasks = (s.cohort_tasks || []).filter(t => t.cohort_id === req.params.id && !t.deleted_at).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const completions = (s.cohort_task_completions || []).filter(c => c.member_id === req.params.memberId);
  res.json(tasks.map(t => ({ ...t, completed: completions.some(c => c.task_id === t.id), completed_at: completions.find(c => c.task_id === t.id)?.completed_at || null })));
});

// POST /api/cohorts/:id/tasks
router.post('/:id/tasks', (req, res) => {
  ensure();
  const s = getStore();
  const { title, description, task_type = 'checkbox', due_days, required = false, sort_order } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const existing = (s.cohort_tasks || []).filter(t => t.cohort_id === req.params.id);
  const task = { id: uuidv4(), cohort_id: req.params.id, title, description: description || '',
    task_type, due_days: due_days || null, required: !!required, sort_order: sort_order ?? existing.length,
    deleted_at: null, created_at: now() };
  s.cohort_tasks.push(task);
  saveStore();
  res.status(201).json(task);
});

// PATCH /api/cohorts/:id/tasks/:taskId
router.patch('/:id/tasks/:taskId', (req, res) => {
  ensure();
  const s = getStore();
  const idx = (s.cohort_tasks || []).findIndex(t => t.id === req.params.taskId);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  ['title','description','task_type','due_days','required','sort_order'].forEach(f => { if (req.body[f] !== undefined) s.cohort_tasks[idx][f] = req.body[f]; });
  saveStore(); res.json(s.cohort_tasks[idx]);
});

// DELETE /api/cohorts/:id/tasks/:taskId
router.delete('/:id/tasks/:taskId', (req, res) => {
  ensure();
  const s = getStore();
  const idx = (s.cohort_tasks || []).findIndex(t => t.id === req.params.taskId);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  s.cohort_tasks[idx].deleted_at = now();
  saveStore(); res.json({ deleted: true });
});

// POST /api/cohorts/:id/tasks/:taskId/complete
router.post('/:id/tasks/:taskId/complete', (req, res) => {
  ensure();
  const s = getStore();
  const { member_id } = req.body;
  if (!member_id) return res.status(400).json({ error: 'member_id required' });
  const already = (s.cohort_task_completions || []).find(c => c.task_id === req.params.taskId && c.member_id === member_id);
  if (already) return res.json({ already: true, completion: already });
  const comp = { id: uuidv4(), task_id: req.params.taskId, cohort_id: req.params.id, member_id, completed_at: now() };
  s.cohort_task_completions.push(comp);
  saveStore(); res.status(201).json(comp);
});

// DELETE /api/cohorts/:id/tasks/:taskId/complete
router.delete('/:id/tasks/:taskId/complete', (req, res) => {
  ensure();
  const { member_id } = req.body;
  const s = getStore();
  const idx = (s.cohort_task_completions || []).findIndex(c => c.task_id === req.params.taskId && c.member_id === member_id);
  if (idx !== -1) { s.cohort_task_completions.splice(idx, 1); saveStore(); }
  res.json({ removed: true });
});

// GET /api/cohorts/:id/resources
router.get('/:id/resources', (req, res) => {
  ensure();
  const s = getStore();
  res.json((s.cohort_resources || []).filter(r => r.cohort_id === req.params.id && !r.deleted_at).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
});

// POST /api/cohorts/:id/resources
router.post('/:id/resources', (req, res) => {
  ensure();
  const s = getStore();
  const { title, description, resource_type = 'link', url, file_name, category } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const existing = (s.cohort_resources || []).filter(r => r.cohort_id === req.params.id);
  const resource = { id: uuidv4(), cohort_id: req.params.id, title, description: description || '',
    resource_type, url: url || '', file_name: file_name || '', category: category || 'General',
    sort_order: existing.length, deleted_at: null, created_at: now() };
  s.cohort_resources.push(resource);
  saveStore(); res.status(201).json(resource);
});

// PATCH /api/cohorts/:id/resources/:resourceId
router.patch('/:id/resources/:resourceId', (req, res) => {
  ensure();
  const s = getStore();
  const idx = (s.cohort_resources || []).findIndex(r => r.id === req.params.resourceId);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  ['title','description','resource_type','url','file_name','category','sort_order'].forEach(f => { if (req.body[f] !== undefined) s.cohort_resources[idx][f] = req.body[f]; });
  saveStore(); res.json(s.cohort_resources[idx]);
});

// DELETE /api/cohorts/:id/resources/:resourceId
router.delete('/:id/resources/:resourceId', (req, res) => {
  ensure();
  const s = getStore();
  const idx = (s.cohort_resources || []).findIndex(r => r.id === req.params.resourceId);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  s.cohort_resources[idx].deleted_at = now();
  saveStore(); res.json({ deleted: true });
});

// GET /api/cohorts/:id/stats
router.get('/:id/stats', (req, res) => {
  ensure();
  const s = getStore();
  const cohortId = req.params.id;
  const members = (s.cohort_members || []).filter(m => m.cohort_id === cohortId && !m.removed_at);
  const posts = (s.cohort_posts || []).filter(p => p.cohort_id === cohortId && !p.deleted_at);
  const tasks = (s.cohort_tasks || []).filter(t => t.cohort_id === cohortId && !t.deleted_at);
  const completions = s.cohort_task_completions || [];
  const active_today = members.filter(m => m.last_seen && new Date(m.last_seen) > new Date(Date.now() - 86400000)).length;
  const total_completions = completions.filter(c => tasks.some(t => t.id === c.task_id)).length;
  const total_possible = tasks.filter(t => t.required).length * members.length;
  res.json({
    member_count: members.length, active_today, post_count: posts.filter(p => !p.parent_id).length,
    intros_posted: members.filter(m => m.intro_posted).length,
    tasks_required: tasks.filter(t => t.required).length,
    task_completion_pct: total_possible > 0 ? Math.round((total_completions / total_possible) * 100) : 0,
    never_logged_in: members.filter(m => !m.last_seen).length,
  });
});

module.exports = router;
