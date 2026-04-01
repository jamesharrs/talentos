const express = require('express');
const router = express.Router();
const { query, insert, update, remove, getStore, saveStore } = require('../db/init');
const { v4: uuidv4 } = require('uuid');

const DEFAULT_CATEGORIES = [
  { name: 'New',            color: '#3B82F6', icon: 'inbox',        sort_order: 0,  is_system: true, is_terminal: false, description: 'Candidate has just entered the process — not yet reviewed' },
  { name: 'Screening',      color: '#F59E0B', icon: 'filter',       sort_order: 1,  is_system: true, is_terminal: false, description: 'Initial review of CV, phone pre-screen, or qualification check' },
  { name: 'Assessment',     color: '#8B5CF6', icon: 'clipboard',    sort_order: 2,  is_system: true, is_terminal: false, description: 'Skills tests, psychometric assessments, or technical exercises' },
  { name: 'Interviewing',   color: '#6366F1', icon: 'users',        sort_order: 3,  is_system: true, is_terminal: false, description: 'One or more interview rounds — phone, video, panel, or onsite' },
  { name: 'Reference Check',color: '#0891B2', icon: 'search',       sort_order: 4,  is_system: true, is_terminal: false, description: 'Verifying employment history, references, and background checks' },
  { name: 'Offer',          color: '#06B6D4', icon: 'file-text',    sort_order: 5,  is_system: true, is_terminal: false, description: 'Verbal or written offer made — awaiting candidate response' },
  { name: 'Pre-boarding',   color: '#14B8A6', icon: 'calendar',     sort_order: 6,  is_system: true, is_terminal: false, description: 'Offer accepted — completing compliance, contracts, and onboarding prep' },
  { name: 'Placed',         color: '#10B981', icon: 'check',        sort_order: 7,  is_system: true, is_terminal: true,  description: 'Candidate has started in the role — placement confirmed' },
  { name: 'Not Suitable',   color: '#EF4444', icon: 'x-circle',     sort_order: 8,  is_system: true, is_terminal: true,  description: 'Does not meet the requirements for this role at this time' },
  { name: 'Withdrawn',      color: '#6B7280', icon: 'minus-circle', sort_order: 9,  is_system: true, is_terminal: true,  description: 'Candidate withdrew from the process of their own accord' },
  { name: 'Offer Declined', color: '#F97316', icon: 'x-circle',     sort_order: 10, is_system: true, is_terminal: true,  description: 'Candidate rejected the offer — process closed' },
  { name: 'Talent Pool',    color: '#A855F7', icon: 'users',        sort_order: 11, is_system: true, is_terminal: false, description: 'Strong candidate kept warm for future opportunities' },
  { name: 'On Hold',        color: '#94A3B8', icon: 'pause',        sort_order: 12, is_system: true, is_terminal: false, description: 'Process paused — role on hold or candidate temporarily unavailable' },
];

// Keyword → category name for auto-suggest
const CATEGORY_KEYWORDS = {
  'New':            ['new','applied','application','received','submitted','fresh','enquiry','sourced','register'],
  'Screening':      ['screen','review','cv','resume','phone','call','pre','qualify','longlist','shortlist','initial','first'],
  'Assessment':     ['assess','test','exercise','task','psychometric','aptitude','skills','technical test','homework'],
  'Interviewing':   ['interview','meet','panel','video','zoom','teams','onsite','visit','second','third','final'],
  'Reference Check':['reference','background','check','verify','compliance','right to work','rtw'],
  'Offer':          ['offer','package','salary','negotiate','propose','verbal','written','contract'],
  'Pre-boarding':   ['preboard','pre-board','onboard','start','joining','paperwork','contract signed'],
  'Placed':         ['placed','hired','hire','accepted','started','joined','won'],
  'Not Suitable':   ['reject','declined','failed','unsuccessful','not progressing','drop','remove','no'],
  'Withdrawn':      ['withdrawn','withdrew','pulled out','no longer','cancelled','not interested'],
  'Offer Declined': ['offer declined','declined offer','rejected offer'],
  'Talent Pool':    ['talent pool','pool','future','keep warm','pipeline','nurture'],
  'On Hold':        ['hold','pause','paused','defer','deferred','frozen'],
};

function seedDefaults(environment_id) {
  const existing = query('stage_categories', c => c.environment_id === environment_id);
  if (existing.length > 0) return; // already seeded
  const now = new Date().toISOString();
  DEFAULT_CATEGORIES.forEach(cat => {
    insert('stage_categories', { id: uuidv4(), environment_id, ...cat, created_at: now, updated_at: now });
  });
  saveStore();
}

// Run on server startup — seed any environments that have zero categories,
// and upgrade environments that only have the old 7-category set
function seedAllEnvironments() {
  try {
    const store = getStore();
    const environments = store.environments || [];
    const OLD_NAMES = new Set(['New','Screening','Interviewing','Offering','Hired','Rejected','Withdrawn']);
    let seeded = 0;
    environments.forEach(env => {
      const existing = (store.stage_categories || []).filter(c => c.environment_id === env.id);
      // Seed if empty, or if only the old default 7 exist (upgrade to new set)
      const isOldDefaults = existing.length > 0 && existing.every(c => OLD_NAMES.has(c.name));
      if (existing.length === 0 || isOldDefaults) {
        // Remove old ones if upgrading
        if (isOldDefaults) {
          existing.forEach(c => remove('stage_categories', x => x.id === c.id));
        }
        const now = new Date().toISOString();
        DEFAULT_CATEGORIES.forEach(cat => {
          insert('stage_categories', { id: uuidv4(), environment_id: env.id, ...cat, created_at: now, updated_at: now });
        });
        seeded++;
      }
    });
    if (seeded > 0) {
      saveStore();
      console.log(`[stage-categories] Seeded/upgraded defaults for ${seeded} environment(s)`);
    }
  } catch (e) {
    console.error('[stage-categories] seedAllEnvironments error:', e.message);
  }
}
seedAllEnvironments();

// GET /api/stage-categories?environment_id=
router.get('/', (req, res) => {
  const { environment_id } = req.query;
  if (!environment_id) return res.status(400).json({ error: 'environment_id required' });
  seedDefaults(environment_id);
  const cats = query('stage_categories', c => c.environment_id === environment_id)
    .sort((a, b) => a.sort_order - b.sort_order);
  res.json(cats);
});

// POST /api/stage-categories
router.post('/', (req, res) => {
  const { environment_id, name, color, icon, description } = req.body;
  if (!environment_id || !name) return res.status(400).json({ error: 'environment_id and name required' });
  const existing = query('stage_categories', c => c.environment_id === environment_id);
  const max_order = existing.reduce((m, c) => Math.max(m, c.sort_order ?? 0), -1);
  const now = new Date().toISOString();
  const cat = insert('stage_categories', {
    id: uuidv4(), environment_id, name, color: color || '#6B7280',
    icon: icon || 'circle', description: description || '',
    sort_order: max_order + 1, is_system: false, is_terminal: false,
    created_at: now, updated_at: now,
  });
  saveStore();
  res.status(201).json(cat);
});

// PATCH /api/stage-categories/:id
router.patch('/:id', (req, res) => {
  const cat = query('stage_categories', c => c.id === req.params.id)[0];
  if (!cat) return res.status(404).json({ error: 'Not found' });
  const allowed = ['name','color','icon','description','is_terminal','sort_order'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  updates.updated_at = new Date().toISOString();
  const updated = update('stage_categories', c => c.id === req.params.id, updates);
  saveStore();
  res.json(updated[0]);
});

// DELETE /api/stage-categories/:id
router.delete('/:id', (req, res) => {
  const cat = query('stage_categories', c => c.id === req.params.id)[0];
  if (!cat) return res.status(404).json({ error: 'Not found' });
  if (cat.is_system) return res.status(403).json({ error: 'Cannot delete system categories' });
  remove('stage_categories', c => c.id === req.params.id);
  saveStore();
  res.json({ deleted: true });
});

// POST /api/stage-categories/reorder  { environment_id, ordered_ids: [...] }
router.post('/reorder', (req, res) => {
  const { environment_id, ordered_ids } = req.body;
  if (!environment_id || !Array.isArray(ordered_ids)) return res.status(400).json({ error: 'Invalid' });
  ordered_ids.forEach((id, idx) => {
    update('stage_categories', c => c.id === id, { sort_order: idx, updated_at: new Date().toISOString() });
  });
  saveStore();
  res.json({ ok: true });
});

// GET /api/stage-categories/suggest?name=Phone+Screen&environment_id=
router.get('/suggest', (req, res) => {
  const { name, environment_id } = req.query;
  if (!name || !environment_id) return res.json({ category: null });
  const lower = name.toLowerCase();
  let best = null;
  for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) { best = catName; break; }
  }
  if (!best) return res.json({ category: null });
  seedDefaults(environment_id);
  const cat = query('stage_categories', c => c.environment_id === environment_id && c.name === best)[0];
  res.json({ category: cat || null });
});

module.exports = router;
