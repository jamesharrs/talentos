// server/routes/cohort_messages.js
const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getStore, saveStore } = require('../db/init');

const ensure = () => { const s = getStore(); ['cohort_messages','cohort_threads'].forEach(k => { if (!s[k]) s[k] = []; }); };
const now = () => new Date().toISOString();
const getCohort = (id) => (getStore().cohorts || []).find(c => c.id === id && !c.deleted_at);
const getMember = (id) => (getStore().cohort_members || []).find(m => m.id === id && !m.removed_at);

// GET /api/cohort-messages/:cohortId/group
router.get('/:cohortId/group', (req, res) => {
  ensure();
  const { before, limit = 50 } = req.query;
  const s = getStore();
  let msgs = (s.cohort_messages || []).filter(m => m.cohort_id === req.params.cohortId && m.thread === 'group' && !m.deleted_at);
  if (before) msgs = msgs.filter(m => new Date(m.created_at) < new Date(before));
  msgs = msgs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, Number(limit)).reverse();
  res.json({ messages: msgs, has_more: msgs.length === Number(limit) });
});

// POST /api/cohort-messages/:cohortId/group
router.post('/:cohortId/group', (req, res) => {
  ensure();
  const { sender_member_id, sender_name, sender_type = 'member', body, attachments = [] } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: 'body required' });
  const s = getStore();
  const msg = { id: uuidv4(), cohort_id: req.params.cohortId, thread: 'group',
    sender_member_id: sender_member_id || null, sender_name: sender_name || 'Member',
    sender_type, body: body.trim(), attachments, read_by: [], edited_at: null, deleted_at: null, created_at: now() };
  s.cohort_messages.push(msg);
  saveStore();
  res.status(201).json(msg);
});

// DELETE /api/cohort-messages/:cohortId/group/:msgId
router.delete('/:cohortId/group/:msgId', (req, res) => {
  ensure();
  const s = getStore();
  const idx = (s.cohort_messages || []).findIndex(m => m.id === req.params.msgId && m.cohort_id === req.params.cohortId);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  s.cohort_messages[idx].deleted_at = now();
  saveStore(); res.json({ deleted: true });
});

// GET /api/cohort-messages/:cohortId/dm/threads/:memberId
router.get('/:cohortId/dm/threads/:memberId', (req, res) => {
  ensure();
  const cohort = getCohort(req.params.cohortId);
  if (!cohort) return res.status(404).json({ error: 'Cohort not found' });
  if (!cohort.allow_dm) return res.status(403).json({ error: 'Direct messages not enabled' });
  const s = getStore();
  const myId = req.params.memberId;
  const myMessages = (s.cohort_messages || []).filter(m => m.cohort_id === req.params.cohortId && m.thread !== 'group' && !m.deleted_at && (m.sender_member_id === myId || m.thread.includes(myId)));
  const threadMap = {};
  myMessages.forEach(m => { if (!threadMap[m.thread]) threadMap[m.thread] = { thread_id: m.thread, messages: [] }; threadMap[m.thread].messages.push(m); });
  const threads = Object.values(threadMap).map(t => {
    const sorted = t.messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const last = sorted[0];
    const otherMemberId = t.thread_id.split('__').find(id => id !== myId);
    const otherMember = getMember(otherMemberId);
    const otherRec = otherMember ? (s.records || []).find(r => r.id === otherMember.person_record_id) : null;
    return { thread_id: t.thread_id, other_member_id: otherMemberId,
      other_member_name: otherRec?.data?.first_name ? `${otherRec.data.first_name} ${otherRec.data.last_name || ''}`.trim() : last.sender_name,
      last_message: last.body, last_message_at: last.created_at,
      unread_count: sorted.filter(m => m.sender_member_id !== myId && !(m.read_by || []).includes(myId)).length };
  });
  res.json(threads.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at)));
});

// GET /api/cohort-messages/:cohortId/dm/:threadId
router.get('/:cohortId/dm/:threadId', (req, res) => {
  ensure();
  const cohort = getCohort(req.params.cohortId);
  if (!cohort) return res.status(404).json({ error: 'Cohort not found' });
  if (!cohort.allow_dm) return res.status(403).json({ error: 'Direct messages not enabled' });
  const { before, limit = 50, reader_member_id } = req.query;
  const s = getStore();
  let msgs = (s.cohort_messages || []).filter(m => m.cohort_id === req.params.cohortId && m.thread === req.params.threadId && !m.deleted_at);
  if (before) msgs = msgs.filter(m => new Date(m.created_at) < new Date(before));
  msgs = msgs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, Number(limit)).reverse();
  if (reader_member_id) {
    const s2 = getStore();
    (s2.cohort_messages || []).forEach((m, i) => {
      if (m.thread === req.params.threadId && m.cohort_id === req.params.cohortId && m.sender_member_id !== reader_member_id && !(m.read_by || []).includes(reader_member_id)) {
        s2.cohort_messages[i].read_by = [...(m.read_by || []), reader_member_id];
      }
    });
    saveStore();
  }
  res.json({ messages: msgs, has_more: msgs.length === Number(limit) });
});

// POST /api/cohort-messages/:cohortId/dm
router.post('/:cohortId/dm', (req, res) => {
  ensure();
  const cohort = getCohort(req.params.cohortId);
  if (!cohort) return res.status(404).json({ error: 'Cohort not found' });
  if (!cohort.allow_dm) return res.status(403).json({ error: 'Direct messages not enabled' });
  const { from_member_id, to_member_id, sender_name, body, attachments = [] } = req.body;
  if (!from_member_id || !to_member_id || !body?.trim()) return res.status(400).json({ error: 'from_member_id, to_member_id, body required' });
  if (from_member_id === to_member_id) return res.status(400).json({ error: 'Cannot DM yourself' });
  const thread_id = [from_member_id, to_member_id].sort().join('__');
  const s = getStore();
  const msg = { id: uuidv4(), cohort_id: req.params.cohortId, thread: thread_id,
    sender_member_id: from_member_id, sender_name: sender_name || 'Member', sender_type: 'member',
    body: body.trim(), attachments, read_by: [from_member_id], edited_at: null, deleted_at: null, created_at: now() };
  s.cohort_messages.push(msg);
  saveStore();
  res.status(201).json({ ...msg, thread_id });
});

// DELETE /api/cohort-messages/:cohortId/dm/:msgId
router.delete('/:cohortId/dm/:msgId', (req, res) => {
  ensure();
  const s = getStore();
  const idx = (s.cohort_messages || []).findIndex(m => m.id === req.params.msgId && m.cohort_id === req.params.cohortId);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  s.cohort_messages[idx].deleted_at = now();
  saveStore(); res.json({ deleted: true });
});

// GET /api/cohort-messages/:cohortId/unread/:memberId
router.get('/:cohortId/unread/:memberId', (req, res) => {
  ensure();
  const s = getStore();
  const myId = req.params.memberId;
  const msgs = (s.cohort_messages || []).filter(m => m.cohort_id === req.params.cohortId && !m.deleted_at && m.sender_member_id !== myId && !(m.read_by || []).includes(myId));
  res.json({ group_unread: msgs.filter(m => m.thread === 'group').length, dm_unread: msgs.filter(m => m.thread !== 'group').length, total: msgs.length });
});

module.exports = router;
