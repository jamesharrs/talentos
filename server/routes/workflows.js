const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query, findOne, insert, update, remove, getStore, saveStore } = require('../db/init');

// Ensure tables exist
const ensureTables = () => {
  const store = getStore();
  if (!store.workflows)      store.workflows = [];
  if (!store.workflow_steps) store.workflow_steps = [];
  if (!store.workflow_runs)  store.workflow_runs = [];
};

// GET /api/workflows?environment_id=&object_id=
router.get('/', (req, res) => {
  ensureTables();
  const { environment_id, object_id } = req.query;
  let wfs = query('workflows', w => !w.deleted_at);
  if (environment_id) wfs = wfs.filter(w => w.environment_id === environment_id);
  if (object_id)      wfs = wfs.filter(w => w.object_id === object_id);
  // Attach steps
  const result = wfs.map(w => ({
    ...w,
    steps: query('workflow_steps', s => s.workflow_id === w.id).sort((a,b) => a.order - b.order)
  }));
  res.json(result);
});

// POST /api/workflows
router.post('/', (req, res) => {
  ensureTables();
  const { name, object_id, environment_id, description } = req.body;
  const wf = insert('workflows', { id: uuidv4(), name, object_id, environment_id, description: description||'', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  res.json({ ...wf, steps: [] });
});

// PATCH /api/workflows/:id
router.patch('/:id', (req, res) => {
  ensureTables();
  const wf = update('workflows', w => w.id === req.params.id, req.body);
  if (!wf) return res.status(404).json({ error: 'Not found' });
  const steps = query('workflow_steps', s => s.workflow_id === wf.id).sort((a,b) => a.order - b.order);
  res.json({ ...wf, steps });
});

// DELETE /api/workflows/:id
router.delete('/:id', (req, res) => {
  ensureTables();
  update('workflows', w => w.id === req.params.id, { deleted_at: new Date().toISOString() });
  res.json({ ok: true });
});

// PUT /api/workflows/:id/steps  — replace all steps
router.put('/:id/steps', (req, res) => {
  ensureTables();
  const { steps } = req.body;
  const store = getStore();
  // Remove old steps
  store.workflow_steps = store.workflow_steps.filter(s => s.workflow_id !== req.params.id);
  // Insert new ones
  const saved = (steps || []).map((s, i) => {
    const step = { id: s.id || uuidv4(), workflow_id: req.params.id, order: i, type: s.type, config: s.config || {}, created_at: new Date().toISOString() };
    store.workflow_steps.push(step);
    return step;
  });
  require('../db/init').saveStore();
  res.json(saved);
});

// POST /api/workflows/:id/run  — run workflow against a record
router.post('/:id/run', async (req, res) => {
  ensureTables();
  const { record_id } = req.body;
  const wf = findOne('workflows', w => w.id === req.params.id);
  if (!wf) return res.status(404).json({ error: 'Workflow not found' });
  const record = findOne('records', r => r.id === record_id);
  if (!record) return res.status(404).json({ error: 'Record not found' });

  const steps = query('workflow_steps', s => s.workflow_id === wf.id).sort((a,b) => a.order - b.order);
  const runId = uuidv4();
  const runLog = [];

  for (const step of steps) {
    const stepResult = { step_id: step.id, type: step.automation_type || 'placeholder', name: step.name || '', status: 'pending', output: null, error: null };
    try {
      // Placeholder — no automation, just log passage
      if (!step.automation_type) {
        stepResult.output = step.name ? `Passed through: ${step.name}` : 'Stage passed';
        stepResult.status = 'done';

      } else if (step.automation_type === 'stage_change') {
        const newData = { ...record.data, status: step.config.to_stage };
        update('records', r => r.id === record_id, { data: newData });
        record.data = newData;
        stepResult.output = `Stage changed to: ${step.config.to_stage}`;
        stepResult.status = 'done';

      } else if (step.automation_type === 'update_field') {
        const newData = { ...record.data, [step.config.field]: step.config.value };
        update('records', r => r.id === record_id, { data: newData });
        record.data = newData;
        stepResult.output = `Field "${step.config.field}" set to "${step.config.value}"`;
        stepResult.status = 'done';

      } else if (step.automation_type === 'ai_prompt') {
        // Call the Anthropic API
        const prompt = (step.config.prompt || '').replace(/\{\{(\w+)\}\}/g, (_, key) => record.data?.[key] ?? `{{${key}}}`);
        const fullPrompt = `Record data:\n${JSON.stringify(record.data, null, 2)}\n\n${prompt}`;
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 500, messages: [{ role: 'user', content: fullPrompt }] })
        });
        const data = await response.json();
        const aiOutput = data.content?.[0]?.text || 'No output';
        // Optionally write result to a field
        if (step.config.output_field) {
          const newData = { ...record.data, [step.config.output_field]: aiOutput };
          update('records', r => r.id === record_id, { data: newData });
          record.data = newData;
        }
        stepResult.output = aiOutput;
        stepResult.status = 'done';

      } else if (step.automation_type === 'send_email') {
        stepResult.output = `[Demo] Email would be sent to ${record.data?.email || 'unknown'}: "${step.config.subject}"`;
        stepResult.status = 'done';

      } else if (step.automation_type === 'webhook') {
        stepResult.output = `[Demo] POST to ${step.config.url}`;
        stepResult.status = 'done';

      } else {
        stepResult.status = 'skipped';
        stepResult.output = 'Unknown step type';
      }
    } catch (err) {
      stepResult.status = 'error';
      stepResult.error = err.message;
    }
    runLog.push(stepResult);
    insert('workflow_runs', { id: uuidv4(), workflow_id: wf.id, record_id, step_id: step.id, type: step.type, status: stepResult.status, output: stepResult.output, error: stepResult.error, created_at: new Date().toISOString() });
  }

  res.json({ run_id: runId, workflow_id: wf.id, record_id, steps: runLog });
});

// GET /api/workflows/runs?record_id=&workflow_id=
router.get('/runs', (req, res) => {
  ensureTables();
  const { record_id, workflow_id } = req.query;
  let runs = query('workflow_runs', () => true);
  if (record_id)   runs = runs.filter(r => r.record_id === record_id);
  if (workflow_id) runs = runs.filter(r => r.workflow_id === workflow_id);
  res.json(runs.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 100));
});

module.exports = router;
