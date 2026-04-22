// server/routes/record_context.js
// GET /api/record-context/:recordId?environment_id=
// Aggregates comms, pipeline, offers, interviews, forms, notes, agent runs
// for the copilot system prompt.

const express = require('express');
const router  = express.Router();
const { query, getStore } = require('../db/init');

function relTime(iso) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins <   1) return 'just now';
  if (mins <  60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs  <  24) return `${hrs}h ago`;
  const days = Math.floor(hrs  / 24);
  if (days <  30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

router.get('/:recordId', (req, res) => {
  try {
    const { recordId } = req.params;
    if (!recordId) return res.status(400).json({ error: 'recordId required' });

    const s = getStore();
    const ctx = { record_id: recordId, sections: [] };

    // ── 1. Communications ────────────────────────────────────────────────────
    const comms = (s.communications || [])
      .filter(c => c.record_id === recordId && !c.deleted_at)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (comms.length) {
      const last = comms[0];
      ctx.sections.push({ id: 'comms', label: 'Communications', data: {
        total: comms.length,
        last_contact: relTime(last.created_at),
        last_type: last.type,
        last_direction: last.direction,
        last_subject: last.subject || null,
        breakdown: comms.reduce((acc, c) => { acc[c.type] = (acc[c.type] || 0) + 1; return acc; }, {}),
        recent: comms.slice(0, 5).map(c => ({
          type: c.type, direction: c.direction,
          subject: c.subject || null,
          preview: c.body ? c.body.slice(0, 120) : null,
          when: relTime(c.created_at),
          outcome: c.outcome || null,
        })),
      }});
    } else {
      ctx.sections.push({ id: 'comms', label: 'Communications', data: { total: 0, last_contact: null } });
    }

    // ── 2. Pipeline position ─────────────────────────────────────────────────
    const links = (s.people_links || []).filter(l =>
      (l.record_id === recordId || l.person_id === recordId) && !l.deleted_at
    );
    if (links.length) {
      ctx.sections.push({ id: 'pipeline', label: 'Pipeline / Linked Records', data: links.map(l => {
        const wf = (s.workflows || []).find(w => w.id === l.workflow_id);
        const otherId = l.person_id === recordId ? l.record_id : l.person_id;
        const otherRec = (s.records || []).find(r => r.id === otherId);
        const d = otherRec?.data || {};
        const otherName = [d.first_name, d.last_name].filter(Boolean).join(' ') || d.job_title || d.name || otherId;
        return {
          workflow: wf?.name || 'Unknown workflow',
          linked_record: otherName,
          current_stage: l.current_stage || l.stage_name || 'Unknown',
          updated: relTime(l.updated_at),
        };
      })});
    }

    // ── 3. Offers ────────────────────────────────────────────────────────────
    const offers = (s.offers || []).filter(o =>
      (o.candidate_id === recordId || o.job_id === recordId) && !o.deleted_at
    );
    if (offers.length) {
      ctx.sections.push({ id: 'offers', label: 'Offers', data: offers.map(o => ({
        status: o.status,
        job_title: o.job_title || null,
        candidate: o.candidate_name || null,
        salary: o.base_salary ? `${o.currency || 'AED'} ${Number(o.base_salary).toLocaleString()}` : null,
        expiry: o.expiry_date || null,
        approvers: (o.approvers || []).map(a => `${a.name} (${a.status || 'pending'})`).join(', ') || null,
        created: relTime(o.created_at),
      }))});
    }

    // ── 4. Interviews ────────────────────────────────────────────────────────
    const interviews = (s.interviews || [])
      .filter(i => (i.candidate_id === recordId || i.job_id === recordId) && !i.deleted_at)
      .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
    if (interviews.length) {
      ctx.sections.push({ id: 'interviews', label: 'Scheduled Interviews', data: interviews.slice(0, 8).map(i => ({
        type: i.type || i.format || 'Interview',
        date: i.date || null, time: i.time || null,
        status: i.status || 'scheduled',
        interviewers: Array.isArray(i.interviewers) ? i.interviewers.join(', ') : i.interviewers || null,
        notes: i.notes || null,
        when: relTime(i.created_at),
      }))});
    }

    // ── 5. Form responses ────────────────────────────────────────────────────
    const responses = (s.form_responses || []).filter(r => r.record_id === recordId);
    if (responses.length) {
      const formsMap = {};
      (s.forms || []).forEach(f => { formsMap[f.id] = f.name; });
      ctx.sections.push({ id: 'forms', label: 'Form Responses', data: responses.map(r => ({
        form_name: formsMap[r.form_id] || 'Unknown form',
        submitted: relTime(r.created_at),
        submitted_by: r.submitted_by || null,
        summary: Object.entries(r.answers || {}).slice(0, 10)
          .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${(Array.isArray(v) ? v.join(', ') : String(v)).slice(0, 80)}`),
      }))});
    }

    // ── 6. Notes ─────────────────────────────────────────────────────────────
    const notes = (s.notes || []).filter(n => n.record_id === recordId && !n.deleted_at);
    if (notes.length) {
      ctx.sections.push({ id: 'notes', label: 'Notes', data: {
        count: notes.length,
        recent: notes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 3)
          .map(n => ({ text: n.content?.slice(0, 150), when: relTime(n.created_at), by: n.author || null })),
      }});
    }

    // ── 7. Agent runs ────────────────────────────────────────────────────────
    const agentRuns = (s.agent_runs || [])
      .filter(r => r.record_id === recordId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
    if (agentRuns.length) {
      const agentsMap = {};
      (s.agents || []).forEach(a => { agentsMap[a.id] = a.name; });
      ctx.sections.push({ id: 'agent_runs', label: 'AI Agent Activity', data: agentRuns.map(r => ({
        agent: agentsMap[r.agent_id] || 'Unknown agent',
        status: r.status,
        output: r.ai_output ? r.ai_output.slice(0, 200) : null,
        when: relTime(r.created_at),
      }))});
    }

    res.json(ctx);
  } catch (err) {
    console.error('[record-context]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
