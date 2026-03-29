const express = require('express');
const router = express.Router();
const { query, getStore } = require('../db/init');
const { v4: uid } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  }
});

function getPortal(portalId) {
  const store = getStore();
  return (store.portals || []).find(p => p.id === portalId && p.status === 'published' && !p.deleted_at);
}

function getOpenJobs(environmentId) {
  const store = getStore();
  const jobsObj = (store.objects || []).find(o => o.environment_id === environmentId && o.slug === 'jobs');
  if (!jobsObj) return [];
  return (store.records || [])
    .filter(r => r.object_id === jobsObj.id && !r.deleted_at)
    .filter(r => { const s = (r.data?.status || '').toLowerCase(); return s === 'open' || s === 'active' || !s; })
    .map(r => ({
      id: r.id,
      title: r.data?.job_title || r.data?.name || 'Untitled',
      department: r.data?.department || '',
      location: r.data?.location || '',
      work_type: r.data?.work_type || '',
      employment_type: r.data?.employment_type || '',
      salary_min: r.data?.salary_min,
      salary_max: r.data?.salary_max,
      summary: r.data?.summary || r.data?.description || '',
      skills: r.data?.skills || r.data?.required_skills || [],
    }));
}

function getCompanyInfo(portal) {
  const br = portal.theme || portal.branding || {};
  return {
    company_name: br.company_name || 'Our company',
    tagline: br.tagline || '',
    description: br.description || '',
  };
}

router.post('/chat', async (req, res) => {
  const { portal_id, messages, session_id } = req.body;
  if (!portal_id || !messages || !Array.isArray(messages))
    return res.status(400).json({ error: 'portal_id and messages[] required' });

  const portal = getPortal(portal_id);
  if (!portal) return res.status(404).json({ error: 'Portal not found or not published' });

  const copilotConfig = portal.copilot || {};
  if (!copilotConfig.enabled) return res.status(403).json({ error: 'Copilot not enabled on this portal' });

  const company = getCompanyInfo(portal);
  const jobs = getOpenJobs(portal.environment_id);
  const copilotName = copilotConfig.name || (company.company_name ? `${company.company_name} Assistant` : 'Career Assistant');

  const jobsList = jobs.length > 0
    ? jobs.map((j, i) => {
        let line = `${i + 1}. ${j.title}`;
        if (j.department) line += ` | Dept: ${j.department}`;
        if (j.location) line += ` | Location: ${j.location}`;
        if (j.work_type) line += ` | ${j.work_type}`;
        if (j.employment_type) line += ` | ${j.employment_type}`;
        if (j.salary_min && j.salary_max) line += ` | Salary: ${j.salary_min}-${j.salary_max}`;
        if (j.summary) line += `\n   ${j.summary.slice(0, 200)}`;
        if (Array.isArray(j.skills) && j.skills.length) line += `\n   Skills: ${j.skills.join(', ')}`;
        return line;
      }).join('\n')
    : 'No open positions at this time.';

  const systemPrompt = `You are ${copilotName}, a friendly and professional recruitment assistant on ${company.company_name}'s career site.
Your name is "${copilotName}" — always introduce yourself by this name if asked.
${company.tagline ? `Company tagline: "${company.tagline}"` : ''}
${company.description ? `About the company: ${company.description}` : ''}
${copilotConfig.welcome_context || ''}

YOUR ROLE:
- Help candidates explore open positions and answer questions about roles
- Guide candidates through the application process
- Be warm, encouraging, and professional — you represent ${company.company_name}
- Never reveal internal information, salaries beyond what's listed, or details about other candidates

OPEN POSITIONS (${jobs.length} total):
${jobsList}

CAPABILITIES:
1. SEARCH/RECOMMEND JOBS: When a candidate asks about roles, recommend matching ones from the list above.
   Output job recommendations as:
   <JOB_CARDS>[{"id":"...","title":"...","department":"...","location":"...","work_type":"...","employment_type":"...","summary":"first 200 chars","skills":["skill1"],"salary_min":null,"salary_max":null}]</JOB_CARDS>
   Include ALL available fields. Show up to 5 relevant jobs. Always include JOB_CARDS when recommending jobs.
   The candidate will see two buttons: "View details" and "Apply now".

2. DESCRIBE A JOB: When asked for details about a role, give a rich description including responsibilities, requirements, team info.
   Highlight listed skills and salary. End with encouragement and remind them they can apply directly.

3. START APPLICATION: When a candidate wants to apply, collect: full name, email, phone (optional), brief message of interest.
   Ask if they want to upload a CV. Once you have name + email, output:
   <APPLICATION>{"job_id":"...","job_title":"...","first_name":"...","last_name":"...","email":"...","phone":"...","cover_note":"..."}</APPLICATION>

4. ANSWER QUESTIONS: Answer general questions about company, culture, benefits, application process. Be honest if unsure.

5. DOCUMENT UPLOAD: When a candidate mentions uploading a CV, tell them to use the attachment button next to the input.

RULES:
- Never invent jobs not in the list above
- Never share other candidates' information
- Never discuss salary unless listed
- Keep responses concise — 2-3 short paragraphs max
- Use the candidate's first name once they share it`;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'AI service not configured' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1024, system: systemPrompt, messages: messages.slice(-20) }),
    });
    if (!response.ok) { console.error('[portal-copilot] API error:', response.status); return res.status(500).json({ error: 'AI service temporarily unavailable' }); }
    const data = await response.json();
    const text = (data.content || []).map(c => c.text || '').join('');
    res.json({ reply: text, session_id: session_id || uid() });
  } catch (e) {
    console.error('[portal-copilot] Error:', e.message);
    res.status(500).json({ error: 'AI service error' });
  }
});

// Submit application from copilot
router.post('/apply', upload.single('cv'), async (req, res) => {
  try {
    const { portal_id, job_id, job_title, first_name, last_name, email, phone, cover_note } = req.body;
    if (!portal_id || !email || !first_name)
      return res.status(400).json({ error: 'portal_id, first_name, and email required' });
    const portal = getPortal(portal_id);
    if (!portal) return res.status(404).json({ error: 'Portal not found' });
    const store = getStore();
    const { saveStore } = require('../db/init');

    const peopleObj = (store.objects || []).find(o => o.environment_id === portal.environment_id && o.slug === 'people');
    if (!peopleObj) return res.status(400).json({ error: 'People object not configured' });

    let personRecord = (store.records || []).find(r => r.object_id === peopleObj.id && r.data?.email === email && !r.deleted_at);
    if (!personRecord) {
      personRecord = {
        id: uid(), object_id: peopleObj.id, environment_id: portal.environment_id,
        data: { first_name, last_name: last_name || '', email, phone: phone || '', status: 'Active', source: 'Career Site Copilot', person_type: 'Candidate' },
        created_by: 'portal-copilot', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      if (!store.records) store.records = [];
      store.records.push(personRecord);
    }

    if (req.file) {
      if (!store.attachments) store.attachments = [];
      store.attachments.push({
        id: uid(), record_id: personRecord.id, object_id: peopleObj.id, environment_id: portal.environment_id,
        file_name: req.file.originalname, file_path: req.file.path, file_size: req.file.size,
        mime_type: req.file.mimetype, file_type_name: 'CV / Resume',
        uploaded_by: 'portal-copilot', created_at: new Date().toISOString(),
      });
    }

    if (!store.activity) store.activity = [];
    store.activity.push({
      id: uid(), record_id: personRecord.id, object_id: peopleObj.id, environment_id: portal.environment_id,
      action: 'applied_via_copilot', actor: 'portal-copilot',
      details: { job_id, job_title, portal_id, portal_name: portal.name, cover_note, has_cv: !!req.file },
      created_at: new Date().toISOString(),
    });

    if (cover_note) {
      if (!store.notes) store.notes = [];
      store.notes.push({
        id: uid(), record_id: personRecord.id,
        content: `Applied via ${portal.name || 'career site'} copilot${job_title ? ` for ${job_title}` : ''}: ${cover_note}`,
        created_by: 'portal-copilot', created_at: new Date().toISOString(),
      });
    }

    saveStore();
    res.json({ success: true, person_id: personRecord.id, message: 'Application submitted successfully' });
  } catch (e) {
    console.error('[portal-copilot] Apply error:', e.message);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Upload a document during copilot conversation
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ file_id: uid(), file_name: req.file.originalname, file_size: req.file.size, file_path: req.file.path, mime_type: req.file.mimetype });
});

// Public job listing for copilot
router.get('/jobs', (req, res) => {
  const { portal_id } = req.query;
  if (!portal_id) return res.status(400).json({ error: 'portal_id required' });
  const portal = getPortal(portal_id);
  if (!portal) return res.status(404).json({ error: 'Portal not found' });
  res.json(getOpenJobs(portal.environment_id));
});

module.exports = router;
