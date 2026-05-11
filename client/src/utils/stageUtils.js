/**
 * stageUtils.js
 * Shared stage-name → category resolution used by dashboards and pipeline views.
 * Keeps CAT_KEYWORDS in sync with Workflows.jsx.
 */

export const CAT_KEYWORDS = {
  'New':            ['new','applied','application','received','submitted','sourced','register','enquir','identif'],
  'Screening':      ['screen','review','cv','resume','phone','call','pre','qualify','longlist','shortlist','long list','short list','initial','first contact'],
  'Assessment':     ['assess','test','exercise','task','psychometric','aptitude','technical test','homework'],
  'Interviewing':   ['interview','meet','panel','video','zoom','teams','onsite','visit','second','third','final','culture fit','culture'],
  'Reference Check':['reference','background','check','verify','compliance','right to work','rtw'],
  'Offer':          ['offer','package','salary','negotiate','verbal','written','contract'],
  'Pre-boarding':   ['preboard','pre-board','onboard','joining','paperwork','contract signed'],
  'Placed':         ['placed','hired','hire','accepted','started','joined','won'],
  'Not Suitable':   ['reject','declined','failed','unsuccessful','not suitable','drop','remove'],
  'Withdrawn':      ['withdrawn','withdrew','not interested'],
  'Offer Declined': ['offer declined','declined offer'],
  'Talent Pool':    ['talent pool','pool','future','keep warm','nurture'],
  'On Hold':        ['hold','pause','paused','defer','frozen'],
};

/**
 * Guess the stage category name from a workflow step name.
 * e.g. "CV Review" → "Screening", "Final Interview" → "Interviewing"
 */
export function guessCatName(stepName) {
  const lower = (stepName || '').toLowerCase();
  for (const [name, kws] of Object.entries(CAT_KEYWORDS)) {
    if (kws.some(kw => lower.includes(kw))) return name;
  }
  return null;
}

/**
 * Build a lookup: stage/step name (lower) → category name.
 * Merges explicit stage_categories from the API with keyword-guessed fallbacks.
 *
 * @param {Array} stageCategories  - from GET /api/stage-categories
 * @param {Array} workflowSteps    - from workflow steps (optional, for keyword fallback)
 * @returns {Function} resolveCat(stageName) → category name string or null
 */
export function buildCategoryResolver(stageCategories = [], workflowSteps = []) {
  // Map: lowercase stage name → category name (from API categories)
  const explicitMap = new Map();
  stageCategories.forEach(cat => {
    const catName = cat.name || '';
    // The category name itself resolves to itself
    explicitMap.set(catName.toLowerCase(), catName);
    // Any explicitly listed stages (if the category stores them)
    (cat.stages || cat.stage_names || []).forEach(s => {
      if (s) explicitMap.set(String(s).toLowerCase(), catName);
    });
  });

  // Also map each workflow step name via keyword guessing
  const stepMap = new Map();
  workflowSteps.forEach(s => {
    const catName = guessCatName(s.name);
    if (catName) stepMap.set((s.name || '').toLowerCase(), catName);
  });

  return (stageName) => {
    if (!stageName) return null;
    const lower = stageName.toLowerCase();
    // 1. Explicit API mapping
    if (explicitMap.has(lower)) return explicitMap.get(lower);
    // 2. Keyword guess
    return guessCatName(stageName);
  };
}

/**
 * Build sets of stage names that belong to each category bucket.
 * Used by dashboards to check: "is this candidate in screening?"
 *
 * @param {Array} stageCategories  - from GET /api/stage-categories
 * @param {Array} workflowSteps    - all workflow steps for this environment
 * @returns {Object} { Screening: Set<string>, Interviewing: Set<string>, ... }
 */
export function buildCategoryStepSets(stageCategories = [], workflowSteps = []) {
  const sets = {};
  Object.keys(CAT_KEYWORDS).forEach(cat => { sets[cat] = new Set(); });

  // Add category names themselves (e.g. "Screening" → Screening bucket)
  stageCategories.forEach(cat => {
    const name = cat.name || '';
    if (sets[name]) sets[name].add(name.toLowerCase());
  });

  // Add workflow step names via keyword resolution
  workflowSteps.forEach(step => {
    const catName = guessCatName(step.name);
    if (catName && sets[catName]) {
      sets[catName].add((step.name || '').toLowerCase());
    }
  });

  // Always ensure the category name itself matches (for status field comparisons)
  Object.keys(sets).forEach(cat => sets[cat].add(cat.toLowerCase()));

  return sets;
}

/** Convenience: get all step names that map to a given category */
export function getStepsForCategory(categoryName, workflowSteps) {
  return workflowSteps.filter(s => guessCatName(s.name) === categoryName);
}
