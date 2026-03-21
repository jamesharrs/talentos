// helpContent.js — structured help content for the in-app Help Centre and AI Copilot

export const HELP_SECTIONS = [
  { id: 'getting-started', label: 'Getting Started',   icon: 'home',         color: '#3B5BDB' },
  { id: 'records',         label: 'Records',            icon: 'list',         color: '#0CA678' },
  { id: 'people',          label: 'People',             icon: 'users',        color: '#7950F2' },
  { id: 'jobs',            label: 'Jobs',               icon: 'briefcase',    color: '#F59F00' },
  { id: 'talent-pools',    label: 'Talent Pools',       icon: 'layers',       color: '#E03131' },
  { id: 'communications',  label: 'Communications',     icon: 'mail',         color: '#0CA678' },
  { id: 'copilot',         label: 'AI Copilot',         icon: 'zap',          color: '#7950F2' },
  { id: 'interviews',      label: 'Interviews',         icon: 'calendar',     color: '#3B5BDB' },
  { id: 'offers',          label: 'Offers',             icon: 'dollar',       color: '#F59F00' },
  { id: 'search-reports',  label: 'Search & Reports',  icon: 'bar-chart-2',  color: '#0CA678' },
  { id: 'files',           label: 'Files & Documents',  icon: 'file-text',    color: '#475569' },
  { id: 'forms',           label: 'Forms',              icon: 'clipboard',    color: '#3B5BDB' },
  { id: 'org-chart',       label: 'Org Chart',          icon: 'git-branch',   color: '#7950F2' },
  { id: 'settings',        label: 'Settings',           icon: 'settings',     color: '#475569' },
];

export const HELP_ARTICLES = [
  // ── GETTING STARTED ──────────────────────────────────────────────────────
  {
    id: 'gs-login', section: 'getting-started',
    title: 'Logging in to Vercentic',
    summary: 'How to sign in, what to do if you forget your password, and first-login tips.',
    keywords: ['login','sign in','password','forgot password','access','credentials'],
    content: [
      { type:'p', text:'Go to your Vercentic URL in any web browser. Enter your email address and password, then click Sign In.' },
      { type:'p', text:'If it is your first time, your administrator will have set up your account and sent you an invite email with a temporary password.' },
      { type:'tip', text:'If you forget your password, ask your Vercentic administrator to reset it for you from Settings > Users.' },
    ],
  },
  {
    id: 'gs-interface', section: 'getting-started',
    title: 'Understanding the interface',
    summary: 'A tour of the three main areas: sidebar, search bar, and content area.',
    keywords: ['interface','layout','sidebar','navigation','search bar','nav','overview','tour'],
    content: [
      { type:'p', text:'Vercentic has three main areas on every page:' },
      { type:'list', items:['Left sidebar — navigation. Click any section to go to its list view.','Top search bar — search everything from anywhere. The + Create button adds new records.','Main content area — records, dashboards, lists, and settings appear here.'] },
      { type:'p', text:'The floating button in the bottom-right corner opens the AI Copilot.' },
      { type:'tip', text:'Hover over any button to see a tooltip explaining what it does.' },
    ],
  },
  {
    id: 'gs-dashboard', section: 'getting-started',
    title: 'The Dashboard',
    summary: 'Your home page — stat cards, pipeline charts, activity feed, and quick navigation.',
    keywords: ['dashboard','home','stats','charts','overview','pipeline','activity feed'],
    content: [
      { type:'p', text:'The Dashboard is your home page showing a live overview of platform activity.' },
      { type:'list', items:['Stat cards — Total Candidates, Open Jobs, Active Pools with trend percentages.','Hiring Activity chart — record creation by month, year to date.','Pipeline donuts — breakdown by status. Clickable legend items filter the list.','Activity feed — recent creates and edits across all objects.'] },
      { type:'p', text:'Clicking any stat card navigates directly to a filtered list of matching records.' },
    ],
  },
  {
    id: 'gs-create', section: 'getting-started',
    title: 'Creating a new record',
    summary: 'Three ways to add a new person, job, or other record to the platform.',
    keywords: ['create','new record','add','new person','new job','add candidate'],
    content: [
      { type:'p', text:'There are three ways to create a new record:' },
      { type:'steps', items:['Click the + Create button in the top search bar and choose the object type.','Navigate to a list view and click the "New [Object]" button in the toolbar.','Open the AI Copilot and describe what you want to create in plain language.'] },
      { type:'ai', text:'The Copilot is often the fastest route — just say "Add a new candidate called Sarah Ahmed, she\'s a React developer in Dubai" and it fills in the details.' },
    ],
  },
  // ── RECORDS ──────────────────────────────────────────────────────────────
  {
    id: 'rec-list', section: 'records',
    title: 'Using list views',
    summary: 'How to navigate, filter, sort, and manage records in list view.',
    keywords: ['list','table','view','filter','sort','column','search list'],
    content: [
      { type:'p', text:'Clicking a section in the sidebar shows all records as a table. From here you can search, filter, sort, choose columns, open records, or select multiple for bulk actions.' },
      { type:'tip', text:'Click any record name (shown in blue) to open its full detail page.' },
    ],
  },
  {
    id: 'rec-filter', section: 'records',
    title: 'Filtering records',
    summary: 'Add filter conditions to narrow a list by any field value.',
    keywords: ['filter','search','narrow','conditions','find records','operator','contains','equals'],
    content: [
      { type:'p', text:'Click "+ Add filter" below the toolbar. Choose a field, pick an operator, and enter a value. Multiple filters stack together — all conditions must match.' },
      { type:'p', text:'Active filters show as blue chips. Click the × on any chip to remove that filter.' },
      { type:'tip', text:'Save a filter combination as a Saved List — click the Lists button and choose "Save current".' },
    ],
  },
  {
    id: 'rec-saved-lists', section: 'records',
    title: 'Saved Lists',
    summary: 'Save filter and column combinations as named lists, and share them with your team.',
    keywords: ['saved list','save view','share list','saved filter','bookmark'],
    content: [
      { type:'p', text:'A Saved List stores your filters, columns, and sort order under a name. Set up the filters you want, then click Lists → "Save current". Give it a name and optionally share it with your whole team.' },
      { type:'p', text:'Load any saved list from the Lists dropdown. Your filters and columns update instantly.' },
    ],
  },
  {
    id: 'rec-bulk', section: 'records',
    title: 'Bulk actions',
    summary: 'Select multiple records to edit a field or delete them all at once.',
    keywords: ['bulk','select','multiple records','bulk edit','bulk delete','select all'],
    content: [
      { type:'p', text:'Tick the checkbox on any row to select it. Tick the header checkbox to select all visible records. A dark action bar appears with options to edit a field across all selected records, or delete them.' },
      { type:'tip', text:'Selection clears automatically when you change filters or navigate away.' },
    ],
  },
  {
    id: 'rec-detail', section: 'records',
    title: 'The record detail page',
    summary: 'Understanding the two-column layout, panels, and editing fields inline.',
    keywords: ['record detail','record page','fields','panels','edit','inline edit','detail view'],
    content: [
      { type:'p', text:'Clicking a record name opens the full detail page — a two-column layout with fields on the left and panels (Communications, Notes, Files, Activity, Pipeline, etc.) on the right.' },
      { type:'p', text:'Click any field value to edit it inline. Type your change, then click away to save. Press Esc to cancel.' },
      { type:'tip', text:'Drag the divider between columns to resize. Drag panel grip icons to reorder. Both preferences are saved per object type.' },
    ],
  },
  {
    id: 'rec-export', section: 'records',
    title: 'Exporting records',
    summary: 'Export the current filtered list to CSV, TSV, or JSON.',
    keywords: ['export','download','csv','tsv','json','spreadsheet'],
    content: [
      { type:'p', text:'Click the Export button in the list toolbar to download the current records. Three formats: CSV (for Excel/Sheets), TSV, and JSON. The export includes only visible columns and respects active filters.' },
    ],
  },
  // ── PEOPLE ───────────────────────────────────────────────────────────────
  {
    id: 'ppl-types', section: 'people',
    title: 'Person types',
    summary: 'How person_type controls which fields appear on a record.',
    keywords: ['person type','employee','candidate','contractor','consultant','contact','conditional fields'],
    content: [
      { type:'p', text:'The Person Type field controls which fields appear. Setting it to "Employee" reveals employment fields: Job Title, Department, Entity, Employment Type, and Start/End Dates.' },
      { type:'list', items:['Employee — full employment details visible.','Candidate — external applicant in a hiring process.','Contractor — independent or agency worker.','Consultant — advisory or project engagement.','Contact — general network contact.'] },
    ],
  },
  {
    id: 'ppl-cv', section: 'people',
    title: 'Uploading and parsing a CV',
    summary: 'Upload a CV and use AI to automatically fill in the candidate\'s fields.',
    keywords: ['cv','resume','upload','parse','extract','ai parse','auto fill','pdf','docx'],
    content: [
      { type:'p', text:'Open a Person record → Files panel. Select "CV / Resume" from the dropdown, then drag your file in or click to browse. PDF and DOCX work best.' },
      { type:'p', text:'Once uploaded, a Parse CV button appears. Click it — the AI extracts name, email, phone, job title, skills, education, and work history. Tick the fields you want to apply, then click Apply.' },
      { type:'ai', text:'CV parsing works best with clearly formatted PDFs. DOCX files are also supported.' },
    ],
  },
  {
    id: 'ppl-comms', section: 'people',
    title: 'Communicating with a person',
    summary: 'Send email, SMS, WhatsApp, and log calls from a person\'s record.',
    keywords: ['email','sms','whatsapp','call','message','contact','outreach','communicate'],
    content: [
      { type:'p', text:'Click the Communicate button in the top bar on any Person record. Choose: Email, SMS, WhatsApp, or Log a Call. All communications are saved to the Communications panel.' },
      { type:'tip', text:'Use the AI Draft button in any compose window to generate a personalised message based on the person\'s profile.' },
    ],
  },
  // ── JOBS ─────────────────────────────────────────────────────────────────
  {
    id: 'jobs-create', section: 'jobs',
    title: 'Creating a job',
    summary: 'Add a new job requisition with all the relevant details.',
    keywords: ['create job','new job','add role','requisition','vacancy','job posting'],
    content: [
      { type:'p', text:'Click Jobs in the sidebar, then "New Job". Fill in at minimum the job title, department, and status. Location, salary range, work type, and employment type improve candidate matching.' },
      { type:'ai', text:'The Copilot can create a job for you — say "Create a job for a Senior Product Manager in Dubai" and it guides you through the details and can draft a job description.' },
    ],
  },
  {
    id: 'jobs-pipeline', section: 'jobs',
    title: 'Managing the hiring pipeline',
    summary: 'How to add candidates to a job and move them through pipeline stages.',
    keywords: ['pipeline','stages','candidates','add candidate','move stage','track candidates','hiring stages'],
    content: [
      { type:'p', text:'The top of every Job record shows the Linked People widget — a row of pipeline stages with a count of candidates at each. Click a stage number to expand the list.' },
      { type:'steps', items:['Click "+ Add Person" inside any stage column.','Search for the person by name.','Click to select them — they are added to that stage immediately.','Use the stage controls on each person card to advance, move back, or jump to any stage.'] },
    ],
  },
  {
    id: 'jobs-matching', section: 'jobs',
    title: 'AI candidate matching',
    summary: 'Score and rank candidates against a job using the AI matching engine.',
    keywords: ['ai match','matching','score','rank','candidate score','match percentage','suitability'],
    content: [
      { type:'p', text:'Open the AI Match tab on any Job record. All candidates are scored and ranked across skills, location, experience, availability, and rating.' },
      { type:'list', items:['Green (75%+) — strong match.','Amber (50–74%) — partial match, worth reviewing.','Red (below 50%) — significant gaps.'] },
      { type:'tip', text:'Hover over any score ring to see the specific match reasons and gaps.' },
    ],
  },
  // ── TALENT POOLS ─────────────────────────────────────────────────────────
  {
    id: 'tp-manage', section: 'talent-pools',
    title: 'Managing people in a talent pool',
    summary: 'Add people, move them through stages, and view the pipeline at a glance.',
    keywords: ['add to pool','pool stages','move candidate','pool pipeline','talent pool stages'],
    content: [
      { type:'p', text:'The stage track at the top of a Talent Pool record shows all stages and the count of people at each. Click any stage number to expand the list.' },
      { type:'p', text:'Use the stage controls on each person card to move them. Click "+ Add Person" inside any stage to search for and add someone.' },
      { type:'tip', text:'You can also add a person to a pool from their own Linked Records panel.' },
    ],
  },
  // ── COMMUNICATIONS ───────────────────────────────────────────────────────
  {
    id: 'comms-send', section: 'communications',
    title: 'Sending an email',
    summary: 'Compose and send an email from a person\'s record, with AI drafting and templates.',
    keywords: ['send email','email','compose','outreach','template','ai draft','message'],
    content: [
      { type:'p', text:'Click Communicate > Email from the top bar on a Person record. Choose a template or write your own. Click AI Draft to generate a personalised message based on the person\'s profile.' },
      { type:'note', text:'If email credentials are not configured, messages are saved in simulation mode (amber badge) but not actually sent.' },
    ],
  },
  {
    id: 'comms-timeline', section: 'communications',
    title: 'The communications timeline',
    summary: 'Browse, filter, and search all communications history on a person record.',
    keywords: ['communications','timeline','history','filter','search messages','inbox'],
    content: [
      { type:'p', text:'Open the Communications panel on any Person record to see all emails, messages, and call logs in reverse chronological order.' },
      { type:'p', text:'Use the type tabs (All, Email, SMS, WhatsApp, Call) to filter by channel. The search box searches subject lines and message bodies. Click any item to expand and read the full message.' },
    ],
  },
  // ── AI COPILOT ───────────────────────────────────────────────────────────
  {
    id: 'ai-overview', section: 'copilot',
    title: 'What the AI Copilot can do',
    summary: 'A full overview of Copilot capabilities — creating records, searching, drafting, scheduling, and more.',
    keywords: ['copilot','ai','assistant','chat','what can copilot do','capabilities','ai features'],
    content: [
      { type:'p', text:'The AI Copilot is accessible via the floating button in the bottom-right. It understands your data and can take action on your behalf:' },
      { type:'list', items:['Create any record (Person, Job, Talent Pool, Workflow, Form, Interview, Offer) through natural conversation.','Search your data — "find me all candidates in Dubai with React experience".','Summarise a person\'s profile or a job description in one click.','Draft outreach emails, SMS messages, or interview invitations.','Generate tailored interview questions for any role.','Schedule interviews and create job offers conversationally.','Build forms by describing what you need.','Invite users and configure workflows.'] },
    ],
  },
  {
    id: 'ai-how-to', section: 'copilot',
    title: 'Using the Copilot',
    summary: 'How to open the Copilot, what to say, and how the confirmation cards work.',
    keywords: ['how to use copilot','copilot chat','open copilot','quick actions','confirm','copilot tips'],
    content: [
      { type:'p', text:'Click the floating button in the bottom-right to open the Copilot panel. Type your request in plain language — no special format needed.' },
      { type:'p', text:'When the Copilot is about to take an action, it shows a confirmation card first. Review the details, then click Confirm to proceed or Discard to cancel.' },
      { type:'ai', text:'If you have a record open when you open the Copilot, it automatically knows the context. "Summarise this profile" refers to the record you were viewing.' },
    ],
  },
  // ── INTERVIEWS ───────────────────────────────────────────────────────────
  {
    id: 'int-schedule', section: 'interviews',
    title: 'Scheduling an interview',
    summary: 'Three ways to schedule — from the Interviews section, a Job record, or the Copilot.',
    keywords: ['schedule interview','book interview','interview','calendar','interview booking'],
    content: [
      { type:'steps', items:['From the Interviews section in the sidebar — click "Schedule Interview", pick the candidate and job, choose the interview type, date, time, and interviewers.','From a Job record — use the schedule action on a candidate card in the pipeline.','Via the Copilot — say "Schedule a video interview with James for the DevOps Engineer role next Wednesday at 11am".'] },
    ],
  },
  // ── OFFERS ───────────────────────────────────────────────────────────────
  {
    id: 'off-lifecycle', section: 'offers',
    title: 'Offer statuses and approvals',
    summary: 'Understanding the offer lifecycle from Draft through to Accepted or Declined.',
    keywords: ['offer status','approval','approve offer','offer lifecycle','pending approval','accepted','declined'],
    content: [
      { type:'list', items:['Draft — created but not submitted.','Pending Approval — submitted and waiting for approvers.','Approved — all approvers confirmed. Ready to send.','Sent — sent to the candidate.','Accepted — candidate accepted.','Declined — candidate declined.','Expired — expiry date passed.','Withdrawn — offer withdrawn.'] },
      { type:'note', text:'Offers expiring within 3 days are highlighted in amber. Follow up promptly.' },
    ],
  },
  // ── SEARCH & REPORTS ─────────────────────────────────────────────────────
  {
    id: 'sr-reports', section: 'search-reports',
    title: 'Building a report',
    summary: 'Use the report builder to create custom data views with filters, grouping, formulas, and charts.',
    keywords: ['report','report builder','create report','chart','data','analytics','custom report'],
    content: [
      { type:'steps', items:['Choose your data source (People, Jobs, Talent Pools, etc.).','Toggle columns on or off.','Add filter conditions.','Optionally group by a field and sort.','Click Run Report.','Switch between Table, Bar, Line, and Pie chart views.','Save with a name. Optionally share with your team.'] },
      { type:'tip', text:'Click the Templates tab to start from one of eight pre-built example reports.' },
    ],
  },
  // ── ORG CHART ────────────────────────────────────────────────────────────
  {
    id: 'org-navigate', section: 'org-chart',
    title: 'Navigating the org chart',
    summary: 'How to zoom, pan, drill into departments, and switch between structure and people views.',
    keywords: ['org chart','navigate','zoom','pan','department','structure','people view','drill down'],
    content: [
      { type:'p', text:'Click Org Chart in the sidebar. Mouse wheel to zoom, click and drag to pan. The Fit button zooms to show all content.' },
      { type:'p', text:'Use the Structure / People toggle to switch views. In Structure view, click the people count badge on any org unit to drill into that department\'s reporting tree.' },
      { type:'tip', text:'Click the PDF button to export the current view as a high-resolution PDF.' },
    ],
  },
  // ── SETTINGS ─────────────────────────────────────────────────────────────
  {
    id: 'set-theme', section: 'settings',
    title: 'Changing the theme',
    summary: 'How to change the colour theme and other appearance settings.',
    keywords: ['theme','colour','appearance','dark mode','light mode','customise'],
    content: [
      { type:'p', text:'Go to Settings > Appearance to change the colour theme. Five options: Indigo (default), Teal, Rose, Amber, and Violet. You can also toggle Dark/Light mode, change font, and adjust density.' },
    ],
  },
  {
    id: 'set-language', section: 'settings',
    title: 'Changing the language',
    summary: 'How to switch the platform UI language, including Arabic right-to-left.',
    keywords: ['language','translation','arabic','french','german','spanish','rtl','right to left'],
    content: [
      { type:'p', text:'Go to Settings > Language and click your preferred language. Available: English, Arabic (RTL), French, German, Spanish, Portuguese.' },
      { type:'note', text:'Selecting Arabic automatically switches the page layout to right-to-left. Your data (field values) is not translated — only the UI text changes.' },
    ],
  },
];

// ── Compact text for Copilot context injection ────────────────────────────────
export function buildHelpContext() {
  return HELP_ARTICLES.map(a => {
    const text = a.content.map(block => {
      if (['p','tip','note','ai'].includes(block.type)) return block.text;
      if (['list','steps'].includes(block.type)) return block.items.join(' | ');
      return '';
    }).filter(Boolean).join(' ');
    return `[${a.title}] ${a.summary} — ${text}`;
  }).join('\n\n');
}
