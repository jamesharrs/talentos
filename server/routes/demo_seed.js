/**
 * Vercentic Demo Data Seeder — v2
 * Targets the canonical object/field model from the local data store.
 * People object: ee66d95d-c20b-4c58-8b17-14151a944d01
 * Jobs  object:  ea9c6169-...  (looked up at runtime by slug)
 */

const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getStore, saveStore, saveStoreNow, storeCache, tenantStorage, listTenants, loadTenantStore } = require('../db/init');

// ── helpers ────────────────────────────────────────────────────────────────
const pick  = arr => arr[Math.floor(Math.random() * arr.length)];
const rand  = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const picks = (arr, n) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
const now   = () => new Date().toISOString();
const daysAgo = n => new Date(Date.now() - n * 86400000).toISOString().split('T')[0];
const daysAhead = n => new Date(Date.now() + n * 86400000).toISOString().split('T')[0];

// ── People seed data ────────────────────────────────────────────────────────
const FIRST_NAMES = ['Sarah','Ahmed','Priya','James','Fatima','Marcus','Aisha','Liam','Nour','David','Emma','Khalid','Sofia','Omar','Yuki','Isabella','Mohammed','Charlotte','Ravi','Amina','Lucas','Zara','Benjamin','Leila','Daniel','Hana','Samuel','Mia','Ali','Clara','Noah','Yasmin','Ethan','Sana','Jack','Layla','Oliver','Nadia','Hugo','Carmen'];
const LAST_NAMES  = ['Al-Rashidi','Chen','Patel','Harrison','Al-Mansouri','Johnson','Ibrahim','Williams','Hassan','Thompson','Kowalski','Al-Farsi','Rodriguez','Kim','Nakamura','Mueller','Singh','Laurent','Okonkwo','Martinez','Andersen','Gupta','Fernandez','Ali','Johansson','Nakashima','Dubois','Svensson','Petrov','Costa'];
const LOCATIONS   = ['Dubai, UAE','Abu Dhabi, UAE','Riyadh, Saudi Arabia','Doha, Qatar','London, UK','New York, USA','Singapore','Mumbai, India','Toronto, Canada','Sydney, Australia','Berlin, Germany','Amsterdam, Netherlands','Paris, France','Cairo, Egypt','Nairobi, Kenya'];
const TITLES      = ['Senior Software Engineer','Product Manager','Data Scientist','UX Designer','Financial Analyst','Marketing Manager','Sales Director','HR Business Partner','DevOps Engineer','Business Development Manager','Customer Success Manager','Legal Counsel','Operations Manager','Brand Manager','Talent Acquisition Specialist','Cloud Architect','AI/ML Engineer','Scrum Master','CFO','Chief of Staff'];
const COMPANIES   = ['Google','Microsoft','Amazon','HSBC','McKinsey & Co','Emirates NBD','Accenture','Deloitte','PwC','KPMG','Salesforce','Meta','Apple','SAP','Oracle','Mastercard','Visa','Goldman Sachs','JP Morgan','Citibank'];
const SKILLS_POOL = ['Python','JavaScript','TypeScript','React','Node.js','SQL','AWS','Azure','GCP','Docker','Kubernetes','Java','Go','C++','Machine Learning','Data Analysis','Project Management','Agile','Scrum','Product Strategy','UX Research','Figma','Adobe Suite','Financial Modelling','CRM','Salesforce','PowerBI','Tableau','Excel','Communication','Leadership','Negotiation','Stakeholder Management','Strategic Planning','Digital Marketing','SEO/SEM','Content Strategy','Risk Management','Compliance','M&A'];
const LANGS       = ['English','Arabic','French','Spanish','German','Mandarin','Hindi','Urdu','Portuguese','Dutch','Japanese','Korean','Italian','Russian'];
const UNIVERSITIES = ['MIT','Stanford University','Harvard University','University of Oxford','University of Cambridge','INSEAD','London Business School','IE Business School','American University of Beirut','University of Dubai','IIT Delhi','National University of Singapore','University of Toronto','University of Sydney','TU Munich'];

// ── Jobs seed data ──────────────────────────────────────────────────────────
const JOB_TEMPLATES = [
  { title:'Senior Software Engineer',        dept:'Engineering',  salary_min:120000, salary_max:180000, exp:5, skills:['Python','JavaScript','AWS','Docker','SQL'],           work_type:'Hybrid',   priority:'High',     reason:'New Role'   },
  { title:'Staff Engineer',                  dept:'Engineering',  salary_min:160000, salary_max:240000, exp:8, skills:['Go','Kubernetes','System Design','AWS','Python'],     work_type:'Hybrid',   priority:'Critical', reason:'New Role'   },
  { title:'Frontend Engineer',               dept:'Engineering',  salary_min:100000, salary_max:150000, exp:3, skills:['React','TypeScript','CSS','Figma','JavaScript'],      work_type:'Remote',   priority:'Medium',   reason:'Backfill'   },
  { title:'Backend Engineer',                dept:'Engineering',  salary_min:110000, salary_max:165000, exp:4, skills:['Python','Java','PostgreSQL','AWS','Docker'],           work_type:'Hybrid',   priority:'High',     reason:'Expansion'  },
  { title:'DevOps Engineer',                 dept:'Engineering',  salary_min:115000, salary_max:170000, exp:4, skills:['AWS','Kubernetes','Terraform','Docker','CI/CD'],       work_type:'Hybrid',   priority:'High',     reason:'New Role'   },
  { title:'AI/ML Engineer',                  dept:'Data',         salary_min:140000, salary_max:210000, exp:5, skills:['Python','Machine Learning','PyTorch','SQL','AWS'],    work_type:'Hybrid',   priority:'Critical', reason:'New Role'   },
  { title:'Data Scientist',                  dept:'Data',         salary_min:110000, salary_max:165000, exp:3, skills:['Python','Machine Learning','SQL','Tableau','R'],      work_type:'Hybrid',   priority:'High',     reason:'New Role'   },
  { title:'Data Engineer',                   dept:'Data',         salary_min:105000, salary_max:155000, exp:3, skills:['Python','SQL','Spark','AWS','Airflow'],                work_type:'Hybrid',   priority:'Medium',   reason:'Expansion'  },
  { title:'Product Manager',                 dept:'Product',      salary_min:120000, salary_max:175000, exp:4, skills:['Product Strategy','Agile','Scrum','Data Analysis','Stakeholder Management'], work_type:'Hybrid', priority:'High', reason:'New Role' },
  { title:'Senior Product Manager',          dept:'Product',      salary_min:150000, salary_max:210000, exp:6, skills:['Product Strategy','Leadership','Agile','UX Research','SQL'], work_type:'Hybrid', priority:'High', reason:'Backfill' },
  { title:'UX Designer',                     dept:'Design',       salary_min:90000,  salary_max:135000, exp:3, skills:['Figma','UX Research','Adobe Suite','Prototyping'],   work_type:'Hybrid',   priority:'Medium',   reason:'New Role'   },
  { title:'Product Designer',                dept:'Design',       salary_min:100000, salary_max:150000, exp:4, skills:['Figma','UX Research','Design Systems','Adobe Suite'],'work_type':'Hybrid', priority:'High',   reason:'New Role'   },
  { title:'Financial Analyst',               dept:'Finance',      salary_min:70000,  salary_max:110000, exp:2, skills:['Financial Modelling','Excel','PowerBI','SQL'],        work_type:'On-site',  priority:'Medium',   reason:'Backfill'   },
  { title:'FP&A Manager',                    dept:'Finance',      salary_min:120000, salary_max:175000, exp:6, skills:['Financial Modelling','Excel','PowerBI','Leadership'], work_type:'Hybrid',   priority:'High',     reason:'New Role'   },
  { title:'VP of Finance',                   dept:'Finance',      salary_min:200000, salary_max:300000, exp:10,skills:['M&A','Financial Modelling','Leadership','Strategic Planning'], work_type:'Hybrid', priority:'Critical', reason:'New Role' },
  { title:'Sales Director',                  dept:'Sales',        salary_min:150000, salary_max:230000, exp:8, skills:['Salesforce','CRM','Negotiation','Leadership'],       work_type:'Hybrid',   priority:'High',     reason:'New Role'   },
  { title:'Account Executive',               dept:'Sales',        salary_min:80000,  salary_max:130000, exp:3, skills:['CRM','Salesforce','Negotiation','Communication'],    work_type:'Hybrid',   priority:'Medium',   reason:'Expansion'  },
  { title:'Business Development Manager',    dept:'Sales',        salary_min:100000, salary_max:160000, exp:5, skills:['Negotiation','Strategic Planning','CRM','Communication'], work_type:'Hybrid', priority:'High', reason:'New Role' },
  { title:'Marketing Manager',               dept:'Marketing',    salary_min:90000,  salary_max:140000, exp:4, skills:['Digital Marketing','SEO/SEM','Content Strategy','Salesforce'], work_type:'Hybrid', priority:'Medium', reason:'Backfill' },
  { title:'Head of Talent Acquisition',      dept:'HR',           salary_min:120000, salary_max:180000, exp:6, skills:['Talent Acquisition Specialist','Leadership','Stakeholder Management','Communication'], work_type:'Hybrid', priority:'High', reason:'New Role' },
  { title:'HR Business Partner',             dept:'HR',           salary_min:90000,  salary_max:135000, exp:4, skills:['Communication','Stakeholder Management','Leadership'], work_type:'Hybrid', priority:'Medium', reason:'Replacement' },
  { title:'Engineering Manager',             dept:'Engineering',  salary_min:160000, salary_max:230000, exp:7, skills:['Leadership','Python','Agile','System Design','Stakeholder Management'], work_type:'Hybrid', priority:'High', reason:'New Role' },
  { title:'Chief of Staff',                  dept:'Operations',   salary_min:140000, salary_max:200000, exp:6, skills:['Strategic Planning','Communication','Leadership','Project Management'], work_type:'Hybrid', priority:'High', reason:'New Role' },
  { title:'Customer Success Manager',        dept:'Customer Success', salary_min:80000, salary_max:125000, exp:3, skills:['CRM','Communication','Salesforce'],              work_type:'Hybrid',   priority:'Medium',   reason:'Expansion'  },
  { title:'Legal Counsel',                   dept:'Legal',        salary_min:130000, salary_max:200000, exp:5, skills:['Compliance','Risk Management','Communication'],     work_type:'On-site',  priority:'High',     reason:'New Role'   },
];

const BENEFITS = ['Health Insurance','Dental & Vision','Annual Bonus','Stock Options','Remote Work','Flexible Hours','Learning Budget','Gym Membership','Life Insurance','Pension/401k','Travel Allowance','Parental Leave'];
const JOB_BOARDS = ['LinkedIn','Indeed','Glassdoor','Bayt','Naukrigulf','Monster','Reed'];

// ── Core seed logic ─────────────────────────────────────────────────────────
async function runSeed({ environmentId, clearFirst = false, progressCb = () => {} }) {
  const s = getStore();

  // Resolve People and Jobs objects
  const peopleObj = s.objects?.find(o => o.slug === 'people' && o.environment_id === environmentId);
  const jobsObj   = s.objects?.find(o => o.slug === 'jobs'   && o.environment_id === environmentId);
  if (!peopleObj || !jobsObj) throw new Error(`Objects not found for environment ${environmentId}. Found: ${s.objects?.map(o=>o.slug).join(',')}`);

  const PEOPLE_OBJ = peopleObj.id;
  const JOBS_OBJ   = jobsObj.id;

  // Get People fields
  const peopleFields = (s.fields || []).filter(f => f.object_id === PEOPLE_OBJ);
  const jobFields    = (s.fields || []).filter(f => f.object_id === JOBS_OBJ);

  const fieldOptions = (objectId, apiKey) => {
    const fields = objectId === PEOPLE_OBJ ? peopleFields : jobFields;
    const f = fields.find(f => f.api_key === apiKey);
    return f?.options || [];
  };

  // Remove existing demo/incomplete records
  const before = (s.records || []).length;
  s.records = (s.records || []).filter(r => {
    if (r.environment_id !== environmentId) return true;
    if (r._demo) return false; // previously seeded demo record
    // Remove records clearly incomplete (no first_name AND no job_title)
    if (r.object_id === PEOPLE_OBJ) {
      const d = r.data || {};
      if (!d.first_name && !d.last_name) return false;
    }
    if (r.object_id === JOBS_OBJ) {
      const d = r.data || {};
      if (!d.job_title) return false;
    }
    return !clearFirst || r.environment_id !== environmentId;
  });
  const removed = before - (s.records || []).length;
  progressCb({ step:'clear', removed });

  const created_at = now();
  const results = { people: 0, jobs: 0, pools: 0 };

  // ── Seed 30 People ──────────────────────────────────────────────────────
  progressCb({ step:'people', message:'Seeding candidates and professionals…' });

  const STATUSES_P  = fieldOptions(PEOPLE_OBJ, 'status')  || ['Active','Passive','Placed'];
  const SOURCES_P   = fieldOptions(PEOPLE_OBJ, 'source')   || ['LinkedIn','Referral','Job Board'];
  const NOTICES     = fieldOptions(PEOPLE_OBJ, 'notice_period') || ['1 month','2 months','3 months'];
  const WORK_AUTH   = fieldOptions(PEOPLE_OBJ, 'work_authorisation') || ['Citizen','Work Visa'];
  const WORK_TYPES  = fieldOptions(PEOPLE_OBJ, 'work_type_preference') || ['Hybrid','Remote'];
  const GENDERS     = fieldOptions(PEOPLE_OBJ, 'gender') || ['Male','Female'];

  for (let i = 0; i < 30; i++) {
    const firstName = pick(FIRST_NAMES);
    const lastName  = pick(LAST_NAMES);
    const title     = pick(TITLES);
    const company   = pick(COMPANIES);
    const location  = pick(LOCATIONS);
    const yrsExp    = rand(1, 18);
    const skills    = picks(SKILLS_POOL, rand(4, 9)); // plain strings — renderer expects string array
    const langs     = picks(LANGS, rand(1, 3));
    const salaryExp = rand(60, 350) * 1000;

    const person = {
      id: uuidv4(), object_id: PEOPLE_OBJ, environment_id: environmentId,
      _demo: true, created_at, updated_at: created_at,
      data: {
        first_name:      firstName,
        last_name:       lastName,
        email:           `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z]/g,'').replace(/\s/g,'')}.${rand(10,99)}@example.com`,
        phone:           `+971 5${rand(0,9)} ${rand(100,999)} ${rand(1000,9999)}`,
        location,
        current_title:   title,
        current_company: company,
        status:          pick(STATUSES_P),
        source:          pick(SOURCES_P),
        rating:          rand(2, 5),
        years_experience: yrsExp,
        skills,
        languages:       langs,
        notice_period:   pick(NOTICES),
        salary_expectation: salaryExp,
        work_type_preference: picks(WORK_TYPES, rand(1,2)),
        work_authorisation:   pick(WORK_AUTH),
        summary:         `${firstName} is an experienced ${title} with ${yrsExp} years in ${title.split(' ').pop()}. Based in ${location}, they bring a strong track record at ${company} and beyond.`,
        linkedin_url:    `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase().replace(/[^a-z]/g,'')}`,
        source_detail:   `Sourced via ${pick(['LinkedIn Recruiter','Employee referral','Direct application','Agency submission'])}`,
        gdpr_consent:    true,
        gdpr_consent_date: daysAgo(rand(1, 60)),
        gender:          pick(GENDERS),
        country:         location.split(', ').pop(),
        education: [
          { degree: pick(['B.Sc','M.Sc','MBA','BEng','LLB','PhD']), field: pick(['Computer Science','Business Administration','Engineering','Finance','Marketing','Law','Data Science']), institution: pick(UNIVERSITIES), year: String(rand(2000, 2020)) }
        ],
        work_history: [
          { company, title, from: daysAgo(rand(365, 2190)), to: '', current: true, description: `Leading ${title.split(' ').pop()} initiatives and cross-functional collaboration.` },
          { company: pick(COMPANIES), title: pick(TITLES), from: daysAgo(rand(2200, 4000)), to: daysAgo(rand(400, 730)), current: false, description: 'Delivered key projects and managed stakeholder relationships.' }
        ],
        person_type: 'Candidate',
      }
    };
    s.records = s.records || [];
    s.records.push(person);
    results.people++;
  }

  progressCb({ step:'people_done', count: results.people });

  // ── Seed 20 Jobs ───────────────────────────────────────────────────────
  progressCb({ step:'jobs', message:'Seeding job openings…' });

  const STATUSES_J = fieldOptions(JOBS_OBJ, 'status')  || ['Open','Draft','On Hold','Filled'];
  const CURRENCIES = fieldOptions(JOBS_OBJ, 'salary_currency') || ['AED','USD','GBP'];
  const APPR_STATUS = fieldOptions(JOBS_OBJ, 'approval_status') || ['Approved','Pending'];
  const POSTING_STATUS = fieldOptions(JOBS_OBJ, 'posting_status') || ['Live','Not Posted','Draft'];
  const ED_LEVELS  = fieldOptions(JOBS_OBJ, 'education_level') || ['Degree','Masters','Any'];

  const jobSubset = picks(JOB_TEMPLATES, Math.min(20, JOB_TEMPLATES.length));

  for (const tmpl of jobSubset) {
    const openDays = rand(5, 120);
    const currency = pick(CURRENCIES);
    const multiplier = currency === 'AED' ? 3.67 : currency === 'GBP' ? 0.79 : 1;
    const status = pick([...STATUSES_J.slice(0,2), ...STATUSES_J.slice(0,2), 'On Hold']); // bias Open/Draft
    const benefits = picks(BENEFITS, rand(4, 8));

    const job = {
      id: uuidv4(), object_id: JOBS_OBJ, environment_id: environmentId,
      _demo: true, created_at, updated_at: created_at,
      data: {
        job_title:       tmpl.title,
        department:      tmpl.dept,
        location:        pick(LOCATIONS),
        work_type:       tmpl.work_type,
        employment_type: 'Full-time',
        status,
        priority:        tmpl.priority,
        salary_currency: currency,
        salary_min:      Math.round(tmpl.salary_min * multiplier / 1000) * 1000,
        salary_max:      Math.round(tmpl.salary_max * multiplier / 1000) * 1000,
        pay_frequency:   'Annual',
        bonus_percent:   pick([0, 0, 5, 10, 15, 20]),
        equity:          Math.random() > 0.6,
        visa_sponsorship: Math.random() > 0.5,
        benefits,
        reason_for_hire: tmpl.reason,
        headcount:       rand(1, 3),
        experience_min_years: tmpl.exp,
        education_level:      pick(ED_LEVELS),
        required_skills: tmpl.skills, // plain strings
        nice_to_have_skills:  picks(['Agile','Scrum','Leadership','Communication','Strategic Planning'], rand(1,3)),
        posting_status:  pick(POSTING_STATUS),
        career_site_visible: Math.random() > 0.3,
        internal_only:   Math.random() > 0.8,
        job_boards:      picks(JOB_BOARDS, rand(2, 4)),
        approval_status: pick(APPR_STATUS),
        open_date:       daysAgo(openDays),
        target_close_date: daysAhead(rand(14, 90)),
        posted_date:     daysAgo(openDays - rand(1, 5)),
        time_to_fill_target: rand(20, 60),
        cost_centre:     `CC-${rand(1000,9999)}`,
      }
    };
    s.records.push(job);
    results.jobs++;
  }

  progressCb({ step:'jobs_done', count: results.jobs });

  // ── Seed 5 Talent Pools ────────────────────────────────────────────────
  progressCb({ step:'pools', message:'Seeding talent pools…' });

  const poolObj = s.objects?.find(o => o.slug === 'talent-pools' && o.environment_id === environmentId);
  if (poolObj) {
    const POOLS = [
      { name:'Senior Engineers — MENA',   category:'Passive Talent', desc:'Senior engineers in the MENA region with 5+ years experience. Actively monitored for open roles.' },
      { name:'Product Leaders',            category:'Executive',      desc:'Director-level and above product leaders across all geographies.' },
      { name:'Finance Talent — Global',    category:'Passive Talent', desc:'CFA and finance professionals across key markets.' },
      { name:'Design Talent',              category:'Pipeline',       desc:'UX and Product Designers with strong portfolios. Building pipeline for Q3 growth.' },
      { name:'Sales — Enterprise',         category:'Active Talent',  desc:'Enterprise sales professionals with SaaS backgrounds, pre-qualified.' },
    ];
    const poolFields = (s.fields || []).filter(f => f.object_id === poolObj.id);
    const poolCats   = poolFields.find(f => f.api_key === 'category')?.options || ['Pipeline','Active Talent','Passive Talent','Executive'];

    for (const p of POOLS) {
      s.records.push({
        id: uuidv4(), object_id: poolObj.id, environment_id: environmentId,
        _demo: true, created_at, updated_at: created_at,
        data: { pool_name: p.name, description: p.desc, category: poolCats.includes(p.category) ? p.category : poolCats[0], status: 'Active', tags: picks(['Tech','Finance','Product','Sales','MENA','Global','Senior','Leadership'], 2) }
      });
      results.pools++;
    }
  }

  saveStoreNow();
  progressCb({ step:'complete', results });
  return results;
}

// ── Helper: find which tenant owns an environment ──────────────────────────
function findTenantForEnv(environmentId) {
  try {
    const tenants = listTenants ? listTenants() : [];
    for (const slug of tenants) {
      try {
        const ts = loadTenantStore(slug);
        if (ts?.environments?.some(e => e.id === environmentId)) return slug;
      } catch {}
    }
  } catch {}
  return null;
}

// ── API routes ──────────────────────────────────────────────────────────────
router.get('/environments', (req, res) => {
  const s = getStore();
  res.json((s.environments || []).map(e => ({ id: e.id, name: e.name, slug: e.slug })));
});

router.get('/status', (req, res) => {
  const s = getStore();
  const records = s.records || [];
  const demo = records.filter(r => r._demo);
  res.json({ total: records.length, demo: demo.length });
});

router.post('/seed', async (req, res) => {
  const { environment_id, clear_first = false } = req.body;
  if (!environment_id) return res.status(400).json({ error: 'environment_id required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const send = data => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const tenantSlug = findTenantForEnv(environment_id);
    const contextKey = tenantSlug || 'master';
    await tenantStorage.run(contextKey, async () => {
      const results = await runSeed({ environmentId: environment_id, clearFirst: clear_first, progressCb: send });
      send({ step: 'complete', results });
    });
  } catch (err) {
    send({ step: 'error', message: err.message });
  }
  res.end();
});

router.delete('/clear', (req, res) => {
  const { environment_id } = req.body;
  if (!environment_id) return res.status(400).json({ error: 'environment_id required' });
  const tenantSlug = findTenantForEnv(environment_id);
  const s = tenantSlug ? loadTenantStore(tenantSlug) : getStore();
  const before = (s.records || []).length;
  s.records = (s.records || []).filter(r => !(r._demo && r.environment_id === environment_id));
  const removed = before - (s.records || []).length;
  saveStore(tenantSlug);
  res.json({ removed });
});

module.exports = router;
module.exports.runSeed = runSeed;
module.exports.findTenantForEnv = findTenantForEnv;
