// seed-company-docs.js — Seed 6 sample company documents into all environments
const { getStore, saveStore } = require('./db/init');
const { v4: uuidv4 } = require('uuid');

function chunk(text, size=500, overlap=50) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += size - overlap) {
    chunks.push(words.slice(i, i + size).join(' '));
    if (i + size >= words.length) break;
  }
  return chunks;
}

const DOCS = [
  {
    name: "Employee Benefits Guide 2026",
    category: "Benefits & Perks",
    visibility: "candidate",
    description: "Comprehensive overview of employee benefits, healthcare, retirement, and perks.",
    text: `Employee Benefits Guide 2026

At Vercentic, we believe in taking care of our people. Our benefits package is designed to support your health, financial wellbeing, and work-life balance.

Healthcare: All full-time employees receive comprehensive medical, dental, and vision coverage from day one. We cover 90% of premiums for employees and 75% for dependents. Our plan includes mental health support with 12 free therapy sessions per year through our partnership with BetterHelp.

Retirement & Financial: We offer a generous 401(k) match of up to 6% of your salary. Employees are fully vested after 2 years. We also provide access to financial planning services through Fidelity, including one-on-one sessions with a certified financial planner.

Paid Time Off: 25 days annual leave plus public holidays. We also offer 5 mental health days that can be taken without advance notice. Parental leave is 16 weeks fully paid for all new parents regardless of gender.

Wellness: Annual wellness stipend of $1,500 for gym memberships, fitness equipment, or wellness programs. Free healthy snacks and beverages in all offices. Monthly team wellness activities including yoga, meditation, and outdoor adventures.

Learning & Development: Annual learning budget of $3,000 per employee for courses, conferences, and certifications. Internal mentorship programme matching junior and senior team members. Free access to LinkedIn Learning, Coursera, and O'Reilly platforms.

Remote Work: Flexible hybrid model with 2 days in-office minimum. Home office setup allowance of $1,000 for new joiners. Co-working space membership available for those who prefer not to work from home.`
  },
  {
    name: "Company Culture Handbook",
    category: "Culture & Values",
    visibility: "candidate",
    description: "Our values, working style, DEI commitments, and what makes Vercentic unique.",
    text: `Vercentic Culture Handbook

Our Mission: To transform how organisations discover, engage, and develop talent through intelligent technology that puts people first.

Our Values:
1. People Over Process — We believe the best technology serves people, not the other way around. Every feature we build starts with the question: how does this make someone's work life better?
2. Radical Transparency — We share information openly across the company. Monthly all-hands meetings cover financials, strategy, and challenges honestly. Every employee has access to company dashboards.
3. Continuous Learning — We invest heavily in growth. Failure is treated as learning, not punishment. Teams run retrospectives after every major project and share findings company-wide.
4. Diverse Perspectives — We actively seek out different viewpoints. Our hiring panels always include diverse interviewers. We partner with organisations like Code2040 and Out in Tech to broaden our talent pipeline.
5. Customer Obsession — We spend time with our customers weekly. Every engineer, designer, and PM does quarterly customer ride-alongs to stay connected to real user needs.

Working Style: We operate in small, autonomous squads of 5-8 people. Each squad owns its domain end-to-end, from design through deployment. We use async communication by default and reserve meetings for collaboration that genuinely requires real-time interaction. Our core hours are 10am-3pm in your local timezone — outside of that, work when you're most productive.

Diversity, Equity & Inclusion: 48% of our leadership team identifies as women or non-binary. We conduct annual pay equity audits and publish the results internally. Employee resource groups (ERGs) include Women in Tech, Pride@Vercentic, BIPOC Alliance, Parents & Caregivers, and Neurodiversity Network. Each ERG receives an annual budget for events and initiatives.`
  },
  {
    name: "Interview Process Guide",
    category: "Hiring Process",
    visibility: "candidate",
    description: "What candidates can expect during our interview process, stage by stage.",
    text: `Vercentic Interview Process Guide

We want our interview process to be transparent, fair, and respectful of your time. Here's what to expect at each stage:

Stage 1 — Application Review (1-3 business days): Our talent team reviews your application against the role requirements. We look at skills alignment, experience relevance, and potential for growth. You'll hear back within 3 business days either way.

Stage 2 — Recruiter Screen (30 minutes, video call): A friendly conversation with one of our recruiters to discuss your background, career goals, and what you're looking for. We'll share details about the role, team, and compensation range. This is also your chance to ask us anything.

Stage 3 — Hiring Manager Interview (45 minutes, video call): A deeper dive into your experience with the hiring manager. We focus on real examples from your past work using behavioural questions. No trick questions or brainteasers — we want to understand how you think and work.

Stage 4 — Technical/Functional Assessment (varies by role): For engineering roles, this is a live coding session (60 minutes) where you'll work through a realistic problem with one of our engineers. We use your preferred language and IDE. For non-technical roles, this might be a case study, portfolio review, or skills demonstration. We always share the topic in advance so you can prepare.

Stage 5 — Team Meet (45 minutes): Meet 2-3 potential teammates in a casual conversation. This is as much about you evaluating us as it is about us evaluating you. We genuinely want you to get a feel for the team dynamic and working style.

Stage 6 — Offer: If we'd like to move forward, you'll receive a detailed offer within 2 business days of your final interview. Our offers include base salary, equity (for eligible roles), benefits summary, and start date options. We're always open to discussion.

Throughout the process, your recruiter is your single point of contact. They'll keep you updated at every stage and are available for any questions. We aim to complete the full process within 2-3 weeks.`
  },
  {
    name: "Salary & Compensation Bands",
    category: "Salary & Compensation",
    visibility: "internal",
    description: "Internal compensation framework with salary bands by level and geography.",
    text: `Vercentic Compensation Framework — Confidential

This document is strictly confidential and for internal use only. Do not share salary band information with candidates or external parties.

Our compensation philosophy targets the 75th percentile of market rates in each geography. We benchmark annually against Radford, Mercer, and Glassdoor data.

Engineering Levels:
- IC1 (Junior Engineer): $75,000 - $95,000 base, 5% target bonus
- IC2 (Mid-level Engineer): $95,000 - $130,000 base, 10% target bonus
- IC3 (Senior Engineer): $130,000 - $175,000 base, 15% target bonus
- IC4 (Staff Engineer): $175,000 - $220,000 base, 15% target bonus, RSU grant
- IC5 (Principal Engineer): $220,000 - $280,000 base, 20% target bonus, RSU grant

Management Levels:
- M1 (Engineering Manager): $150,000 - $200,000 base, 15% target bonus, RSU grant
- M2 (Senior Engineering Manager): $200,000 - $250,000 base, 20% target bonus, RSU grant
- M3 (Director of Engineering): $250,000 - $320,000 base, 25% target bonus, RSU grant
- VP Engineering: $320,000 - $400,000 base, 30% target bonus, significant RSU grant

Geographic Adjustments: San Francisco / New York: 100% (base). London / Dubai: 95%. Berlin / Amsterdam: 85%. Remote (other): 80-90% based on local market data.

Equity: RSU grants vest over 4 years with a 1-year cliff. Refresh grants are awarded annually based on performance. Total equity pool is 10% of outstanding shares.

Signing Bonuses: Available at IC3+ and M1+ levels. Standard range is $10,000 - $50,000 depending on level and competitive situation. Must be approved by VP+ and Finance.`
  },
  {
    name: "Brand Voice & Writing Guidelines",
    category: "Brand Guidelines",
    visibility: "internal",
    description: "How we write job descriptions, emails, and external communications.",
    text: `Vercentic Brand Voice & Writing Guidelines

Our voice is confident but not arrogant, warm but professional, and clear above all else.

Tone Principles:
- Write like a knowledgeable colleague, not a corporate entity
- Use active voice: "We build" not "Solutions are built"
- Be specific: "We process 2M records daily" not "We handle large volumes of data"
- Show personality: it's okay to be witty, but never at anyone's expense

Job Description Guidelines:
- Lead with impact: What will this person achieve in their first 6 months?
- Be honest about challenges: Every role has them, and candidates appreciate transparency
- Include salary range: Always. This is non-negotiable. Candidates deserve to know before they apply
- Avoid jargon: "You'll build features used by millions" not "You'll leverage synergies across the stack"
- List requirements honestly: Only list things that are truly required. Move nice-to-haves to a separate section clearly labelled as such
- Use inclusive language: "5+ years experience" not "seasoned veteran". Run all JDs through our bias checker

Email Communication:
- Subject lines: Clear and action-oriented. "Your interview with Vercentic — next steps" not "RE: Application"
- Opening: Reference something specific about the candidate
- Closing: Always include a clear next step and timeline
- Rejection emails: Be kind, specific about why if possible, and invite them to stay connected

Social Media: Authentic over polished. Employee stories over corporate announcements. Behind-the-scenes over staged photos. Always credit the team, not just leadership.`
  },
  {
    name: "Engineering Interview Scoring Rubric",
    category: "Interview Guides",
    visibility: "internal",
    description: "Structured scoring criteria for engineering interviews by competency.",
    text: `Engineering Interview Scoring Rubric — Internal Only

This rubric ensures consistent, fair evaluation across all engineering interviews. Each competency is scored 1-5.

Technical Problem Solving (assessed in coding interview):
1 — Cannot break down the problem. No clear approach. Significant gaps in fundamentals.
2 — Identifies the problem but struggles with approach. Solution is incomplete or has major issues.
3 — Develops a working solution with guidance. Understands trade-offs when prompted. Code is functional.
4 — Independently develops a clean, working solution. Considers edge cases. Discusses trade-offs proactively.
5 — Elegant solution showing deep understanding. Optimises without prompting. Excellent code quality and testing awareness.

System Design (assessed in system design interview, IC3+):
1 — Cannot articulate system components or data flow
2 — Basic understanding but misses key considerations (scaling, reliability, security)
3 — Reasonable design covering core requirements. Identifies some scaling concerns.
4 — Well-structured design with clear reasoning. Handles scale, failure modes, and monitoring.
5 — Exceptional design showing production experience. Discusses observability, deployment strategy, and evolution.

Communication & Collaboration (assessed across all interviews):
1 — Difficulty explaining thought process. Does not engage with interviewer.
2 — Explains approach but struggles with follow-up questions. Limited collaboration.
3 — Communicates clearly. Asks clarifying questions. Works well with interviewer guidance.
4 — Excellent communicator. Actively seeks feedback. Adapts approach based on discussion.
5 — Outstanding communication. Teaches while explaining. Makes interviewer think differently about the problem.

Overall Recommendation:
- Strong Yes (4.0+ average): Extend offer immediately. Candidate would raise the bar.
- Yes (3.0-3.9 average): Recommend hiring. Solid addition to the team.
- No (2.0-2.9 average): Does not meet the bar for this level. Consider for a lower level if appropriate.
- Strong No (below 2.0): Clear miss. Document specific concerns for candidate feedback.

Bias Checks: Before submitting your scorecard, ask yourself: Would I score this differently if the candidate were a different gender, age, or background? Focus on demonstrated skills and potential, not cultural similarity.`
  },
];

// Seed into all environments
const store = getStore();
if (!store.company_documents) store.company_documents = [];

const envs = store.environments || [];
let added = 0;

envs.forEach(env => {
  // Skip if this env already has docs
  const existing = store.company_documents.filter(d => d.environment_id === env.id && !d.deleted_at);
  if (existing.length >= 6) {
    console.log(`  ⏭  ${env.name}: already has ${existing.length} docs, skipping`);
    return;
  }

  DOCS.forEach(doc => {
    const words = doc.text.split(/\s+/);
    const chunks = chunk(doc.text);
    const id = uuidv4();
    store.company_documents.push({
      id,
      environment_id: env.id,
      name: doc.name,
      category: doc.category,
      visibility: doc.visibility,
      description: doc.description,
      original_filename: doc.name.toLowerCase().replace(/\s+/g, '_') + '.txt',
      mime_type: 'text/plain',
      file_size: doc.text.length,
      text_content: doc.text,
      word_count: words.length,
      chunks: chunks.map((c, i) => ({ index: i, text: c })),
      chunk_count: chunks.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'system',
    });
    added++;
  });
  console.log(`  ✅ ${env.name}: seeded 6 documents`);
});

saveStore();
console.log(`\n🎉 Done — ${added} documents seeded across ${envs.length} environments`);
