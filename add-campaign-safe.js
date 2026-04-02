/**
 * add-campaign-safe.js
 * Run from project root: node add-campaign-safe.js
 * 
 * Safely appends 3 campaign templates to PORTAL_TEMPLATES in portalTemplates.js
 * Uses a unique anchor string to find the exact insertion point.
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'client/src/portalTemplates.js');
if (!fs.existsSync(FILE)) { console.error('portalTemplates.js not found'); process.exit(1); }

let src = fs.readFileSync(FILE, 'utf8');

if (src.includes("'campaign_1'") || src.includes('"campaign_1"')) {
  console.log('Campaign templates already present. Nothing to do.');
  process.exit(0);
}

// The unique anchor: the ];\n\nexport const getTemplatesForType line
// We insert our templates BEFORE the ]; that precedes this export
const ANCHOR = '];\n\nexport const getTemplatesForType';
if (!src.includes(ANCHOR)) {
  console.error('Anchor string not found. File structure may have changed.');
  process.exit(1);
}

// Campaign templates to insert - NO literal \n in strings, use ' · ' or full stops instead
const CAMPAIGN = `,
// ── CAMPAIGN PAGE TEMPLATES ───────────────────────────────────────────────────
{
  id: 'campaign_1',
  type: 'campaign',
  name: 'Role Campaign',
  desc: 'High-impact single-page campaign for a specific role or hiring surge',
  accent: '#7C3AED',
  tags: ['Campaign', 'Role', 'Targeted'],
  theme: {
    primaryColor:'#7C3AED', secondaryColor:'#5B21B6',
    bgColor:'#0F0A1E', textColor:'#F9FAFB', accentColor:'#F59E0B',
    fontFamily:"'Space Grotesk', sans-serif", headingFont:"'Space Grotesk', sans-serif",
    fontSize:'16px', headingWeight:'800',
    borderRadius:'12px', buttonStyle:'filled', buttonRadius:'12px', maxWidth:'1100px',
  },
  pages: [
    { id:uid(), name:'Home', slug:'/', rows:[
      { id:uid(), preset:'1',
        bgImage:'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1400&q=80',
        bgColor:'', overlayOpacity:60, padding:'xl',
        cells:[{ id:uid(), widgetType:'hero', widgetConfig:{
          headline:"We're Hiring 50 Engineers.",
          subheading:'Join a team building the future of intelligent software. Remote-first, world-class benefits, and work that actually matters.',
          ctaText:'Apply Now', align:'left',
        }}]},
      { id:uid(), preset:'4', bgColor:'#7C3AED', bgImage:'', overlayOpacity:0, padding:'sm',
        cells:[{ id:uid(), widgetType:'stats', widgetConfig:{ stats:[{value:'50',label:'Open Roles'},{value:'Remote',label:'Work Style'},{value:'$180k+',label:'Comp Range'},{value:'2 wks',label:'To Hire'}]}}]},
      { id:uid(), preset:'3', bgColor:'#160D2E', bgImage:'', overlayOpacity:0, padding:'lg',
        cells:[
          { id:uid(), widgetType:'text', widgetConfig:{ heading:'Why engineers love it here', content:'No bureaucracy. No endless meetings. Just small teams with big impact, shipping software used by millions.' }},
          { id:uid(), widgetType:'text', widgetConfig:{ heading:'The stack', content:'TypeScript, React, Node.js, PostgreSQL, and a modern AI-powered pipeline. We pick the right tool for the job.' }},
          { id:uid(), widgetType:'text', widgetConfig:{ heading:'Your first 90 days', content:'Paired with a senior engineer from day one. First PR merged in week one. Running your first release in month two.' }},
        ]},
      { id:uid(), preset:'1', bgColor:'', bgImage:'', overlayOpacity:0, padding:'lg',
        cells:[{ id:uid(), widgetType:'image', widgetConfig:{ url:'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80', alt:'Engineering team', borderRadius:'16px' }}]},
      { id:uid(), preset:'1', bgColor:'#0F0A1E', bgImage:'', overlayOpacity:0, padding:'lg',
        cells:[{ id:uid(), widgetType:'jobs', widgetConfig:{ heading:'Open Engineering Roles' }}]},
      { id:uid(), preset:'3', bgColor:'#160D2E', bgImage:'', overlayOpacity:0, padding:'lg',
        cells:[
          { id:uid(), widgetType:'text', widgetConfig:{ heading:'Compensation', content:'Base $120-$180k plus equity, annual bonus, and salary review every 6 months.' }},
          { id:uid(), widgetType:'text', widgetConfig:{ heading:'Remote-first', content:'Work from anywhere. Hubs in Dubai, London and NYC for those who want them.' }},
          { id:uid(), widgetType:'text', widgetConfig:{ heading:'Growth', content:'$3k learning budget per year, conference sponsorship, and internal mobility encouraged.' }},
        ]},
      { id:uid(), preset:'1', bgColor:'#0F0A1E', bgImage:'', overlayOpacity:0, padding:'lg',
        cells:[{ id:uid(), widgetType:'accordion', widgetConfig:{ heading:'Frequently Asked Questions', items:[
          { q:'What does the interview process look like?', a:'A 30-min intro call, a take-home task (max 3 hours), and a final loop. Total time from apply to offer: under 2 weeks.' },
          { q:'Do I need to relocate?', a:'No. Fully remote-first. Our hubs are entirely optional.' },
          { q:'What experience level are you hiring?', a:'Mid-level through staff engineer. Each listing specifies the level — apply to the one that fits.' },
        ]}}]},
      { id:uid(), preset:'1',
        bgImage:'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1400&q=80',
        bgColor:'', overlayOpacity:70, padding:'xl',
        cells:[{ id:uid(), widgetType:'hero', widgetConfig:{ headline:'Ready to build something great?', subheading:'Applications reviewed within 48 hours. We always let you know either way.', ctaText:'Apply Now', align:'center' }}]},
    ]},
  ],
},

{
  id: 'campaign_2',
  type: 'campaign',
  name: 'Early Careers',
  desc: 'Graduate programmes, internships and entry-level recruitment campaigns',
  accent: '#059669',
  tags: ['Graduate', 'Internship', 'Early Careers'],
  theme: {
    primaryColor:'#059669', secondaryColor:'#0D9488',
    bgColor:'#ECFDF5', textColor:'#064E3B', accentColor:'#7C3AED',
    fontFamily:"'Plus Jakarta Sans', sans-serif", headingFont:"'Plus Jakarta Sans', sans-serif",
    fontSize:'16px', headingWeight:'800',
    borderRadius:'16px', buttonStyle:'filled', buttonRadius:'999px', maxWidth:'1060px',
  },
  pages: [
    { id:uid(), name:'Home', slug:'/', rows:[
      { id:uid(), preset:'2', bgColor:'#064E3B', bgImage:'', overlayOpacity:0, padding:'xl',
        cells:[
          { id:uid(), widgetType:'hero', widgetConfig:{ headline:'Start your career where it counts.', subheading:'Our Graduate Programme turns ambitious graduates into confident professionals — fast. 12 months, real responsibility, mentorship from day one.', ctaText:'Apply for 2026 Cohort', align:'left' }},
          { id:uid(), widgetType:'image', widgetConfig:{ url:'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80', alt:'Young professionals collaborating', borderRadius:'20px' }},
        ]},
      { id:uid(), preset:'4', bgColor:'#059669', bgImage:'', overlayOpacity:0, padding:'md',
        cells:[{ id:uid(), widgetType:'stats', widgetConfig:{ stats:[{value:'12 months',label:'Programme Length'},{value:'4',label:'Rotations'},{value:'92%',label:'Permanent Hire Rate'},{value:'250+',label:'Alumni Network'}]}}]},
      { id:uid(), preset:'1', bgColor:'#F0FDF4', bgImage:'', overlayOpacity:0, padding:'lg',
        cells:[{ id:uid(), widgetType:'text', widgetConfig:{ heading:'The journey', content:'Months 1-3: Foundation — orientation, training, your first rotation. Months 4-6: Explore — a second rotation across a different business area. Months 7-9: Deliver — a live project with real ownership. Months 10-12: Lead — present to leadership and secure your permanent offer.' }}]},
      { id:uid(), preset:'2', bgColor:'', bgImage:'', overlayOpacity:0, padding:'lg',
        cells:[
          { id:uid(), widgetType:'image', widgetConfig:{ url:'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80', alt:'Graduate cohort', borderRadius:'16px' }},
          { id:uid(), widgetType:'text', widgetConfig:{ heading:'Who we are looking for', content:'Any degree, any classification. We care about how you think. We are looking for curious, driven graduates with strong communication skills, comfort with ambiguity, and genuine passion for the industry.' }},
        ]},
      { id:uid(), preset:'3', bgColor:'#ECFDF5', bgImage:'', overlayOpacity:0, padding:'lg',
        cells:[
          { id:uid(), widgetType:'text', widgetConfig:{ heading:'"Real ownership from month one."', content:'Sarah K., 2024 cohort, now Product Manager. The programme threw me in at the deep end. My manager trusted me to lead a client project in my second rotation. I made mistakes, learned fast, and never looked back.' }},
          { id:uid(), widgetType:'text', widgetConfig:{ heading:'"Best career decision I ever made."', content:'Marcus T., 2023 cohort, now Senior Analyst. I applied thinking I might get a foot in the door. What I got was a proper career. Two years on I am managing a team of four and working with our biggest clients.' }},
          { id:uid(), widgetType:'text', widgetConfig:{ heading:'"They invest in you like they mean it."', content:'Priya M., 2024 cohort, now UX Designer. Conferences, coaching, a learning budget — they do not just say they invest in people. I went to three conferences in my first year alone.' }},
        ]},
      { id:uid(), preset:'1', bgColor:'#F0FDF4', bgImage:'', overlayOpacity:0, padding:'lg',
        cells:[{ id:uid(), widgetType:'accordion', widgetConfig:{ heading:'Your questions answered', items:[
          { q:'When does the 2026 cohort start?', a:'September 2026. Applications close 31 May 2026. We review on a rolling basis — apply early.' },
          { q:'What degree do I need?', a:'Any degree, any classification. We care far more about how you think than what you studied.' },
          { q:'Is the programme paid?', a:'Yes. Competitive graduate salary with full benefits from day one.' },
          { q:'What happens after the programme?', a:'92% of graduates receive a permanent offer based on rotations and preference.' },
        ]}}]},
      { id:uid(), preset:'1',
        bgImage:'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1400&q=80',
        bgColor:'', overlayOpacity:65, padding:'xl',
        cells:[{ id:uid(), widgetType:'hero', widgetConfig:{ headline:'Applications now open for 2026.', subheading:'Cohort sizes are limited. Do not leave it to the last minute.', ctaText:'Apply Now — Takes 15 mins', align:'center' }}]},
    ]},
    { id:uid(), name:'Apply', slug:'/apply', rows:[
      { id:uid(), preset:'1', bgColor:'', bgImage:'', overlayOpacity:0, padding:'lg',
        cells:[{ id:uid(), widgetType:'form', widgetConfig:{ title:'Graduate Programme Application 2026', description:'Tell us about yourself. We read every application.' }}]},
    ]},
  ],
},

{
  id: 'campaign_3',
  type: 'campaign',
  name: 'Talent Community',
  desc: 'Alumni networks, talent pools and stay-in-touch communities for future hiring',
  accent: '#0EA5E9',
  tags: ['Alumni', 'Community', 'Talent Pool'],
  theme: {
    primaryColor:'#0EA5E9', secondaryColor:'#0284C7',
    bgColor:'#F0F9FF', textColor:'#0C4A6E', accentColor:'#F59E0B',
    fontFamily:"'DM Sans', sans-serif", headingFont:"'DM Sans', sans-serif",
    fontSize:'16px', headingWeight:'700',
    borderRadius:'10px', buttonStyle:'filled', buttonRadius:'10px', maxWidth:'1100px',
  },
  pages: [
    { id:uid(), name:'Home', slug:'/', rows:[
      { id:uid(), preset:'1',
        bgImage:'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1400&q=80',
        bgColor:'', overlayOpacity:55, padding:'xl',
        cells:[{ id:uid(), widgetType:'hero', widgetConfig:{ headline:'Stay connected. Get first access.', subheading:'Join our talent community and be the first to hear about new roles, events, and news from our team. No spam — just the good stuff.', ctaText:'Join the Community', align:'center' }}]},
      { id:uid(), preset:'3', bgColor:'#E0F2FE', bgImage:'', overlayOpacity:0, padding:'lg',
        cells:[
          { id:uid(), widgetType:'text', widgetConfig:{ heading:'Early access to roles', content:'Community members hear about new opportunities 2 weeks before public posting. Many are filled before they ever go live.' }},
          { id:uid(), widgetType:'text', widgetConfig:{ heading:'Events and webinars', content:'Exclusive access to networking events, industry panels, and skills workshops run by our team and senior leaders.' }},
          { id:uid(), widgetType:'text', widgetConfig:{ heading:'Direct recruiter contact', content:'A real person who knows your background. No black holes — we actually respond and keep you updated.' }},
        ]},
      { id:uid(), preset:'4', bgColor:'#0EA5E9', bgImage:'', overlayOpacity:0, padding:'md',
        cells:[{ id:uid(), widgetType:'stats', widgetConfig:{ stats:[{value:'4,200+',label:'Community Members'},{value:'68%',label:'Hired From Community'},{value:'Monthly',label:'Events'},{value:'48hrs',label:'Avg Response'}]}}]},
      { id:uid(), preset:'2', bgColor:'', bgImage:'', overlayOpacity:0, padding:'lg',
        cells:[
          { id:uid(), widgetType:'text', widgetConfig:{ heading:'Who joins our community?', content:'Former applicants who impressed us but were not right timing. Passive candidates open to the right opportunity. Past colleagues and alumni. Anyone curious about working with us — now or in the future.' }},
          { id:uid(), widgetType:'image', widgetConfig:{ url:'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80', alt:'Community networking event', borderRadius:'16px' }},
        ]},
      { id:uid(), preset:'1', bgColor:'#F0F9FF', bgImage:'', overlayOpacity:0, padding:'lg',
        cells:[{ id:uid(), widgetType:'jobs', widgetConfig:{ heading:'Roles open right now', limit:6 }}]},
      { id:uid(), preset:'2', bgColor:'#0C4A6E', bgImage:'', overlayOpacity:0, padding:'xl',
        cells:[
          { id:uid(), widgetType:'text', widgetConfig:{ heading:'Join in 60 seconds.', content:'Tell us who you are and what you are interested in. We will match you to relevant roles and events. No CV required — share that later if it feels right.' }},
          { id:uid(), widgetType:'form', widgetConfig:{ title:'Join Our Talent Community', description:'We will only contact you with things that are actually relevant.' }},
        ]},
    ]},
  ],
}
`;

// Insert just before the closing ]; that precedes getTemplatesForType
src = src.replace(ANCHOR, CAMPAIGN + '\n' + ANCHOR);

fs.writeFileSync(FILE, src);
console.log('✅ Campaign templates added safely to portalTemplates.js');
console.log('   Templates: campaign_1 (Role Campaign), campaign_2 (Early Careers), campaign_3 (Talent Community)');
