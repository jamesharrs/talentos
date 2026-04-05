// server/data/esco_skills.js
// Curated ESCO (European Skills, Competences, Qualifications and Occupations) taxonomy
// Source: https://esco.ec.europa.eu — European Commission standard
// ~800 most commonly used skills in enterprise recruitment, mapped to ESCO categories

const ESCO_SKILLS = [

// ── DIGITAL SKILLS (ESCO Pillar: Digital) ─────────────────────────────────────
// Programming & Development
...["JavaScript","TypeScript","Python","Java","C#","C++","Go","Rust","Ruby","PHP","Swift","Kotlin","Scala","R","MATLAB","Perl","Shell Scripting","SQL","GraphQL","HTML","CSS","SASS/SCSS"].map(n=>({name:n,category:"Digital",subcategory:"Programming Languages"})),
...["React","Angular","Vue.js","Next.js","Node.js","Express.js","Django","Flask","Spring Boot","ASP.NET",".NET Core","Ruby on Rails","Laravel","FastAPI","Svelte","Nuxt.js"].map(n=>({name:n,category:"Digital",subcategory:"Frameworks & Libraries"})),
...["REST APIs","Microservices","Serverless Architecture","WebSockets","OAuth","JWT","API Design","System Design","Event-Driven Architecture","Domain-Driven Design"].map(n=>({name:n,category:"Digital",subcategory:"Software Architecture"})),
...["Git","GitHub","GitLab","Docker","Kubernetes","Jenkins","CircleCI","Terraform","Ansible","Puppet","Chef","ArgoCD","Helm"].map(n=>({name:n,category:"Digital",subcategory:"DevOps & CI/CD"})),
...["AWS","Azure","Google Cloud Platform","AWS Lambda","S3","EC2","CloudFormation","Azure DevOps","GCP BigQuery","Heroku","Vercel","Netlify","Railway"].map(n=>({name:n,category:"Digital",subcategory:"Cloud Computing"})),
...["PostgreSQL","MySQL","MongoDB","Redis","Elasticsearch","DynamoDB","Cassandra","Oracle Database","SQL Server","Neo4j","Firebase","Supabase","Prisma"].map(n=>({name:n,category:"Digital",subcategory:"Databases"})),
...["Machine Learning","Deep Learning","Natural Language Processing","Computer Vision","TensorFlow","PyTorch","scikit-learn","Data Science","Neural Networks","Reinforcement Learning","LLMs","Prompt Engineering","AI Ethics"].map(n=>({name:n,category:"Digital",subcategory:"AI & Machine Learning"})),
...["Data Analysis","Data Visualisation","Power BI","Tableau","Looker","Data Warehousing","ETL Pipelines","Apache Spark","Apache Kafka","Airflow","dbt","Snowflake","Databricks"].map(n=>({name:n,category:"Digital",subcategory:"Data & Analytics"})),
...["Cybersecurity","Penetration Testing","SIEM","SOC Operations","Encryption","Network Security","Identity & Access Management","Incident Response","Vulnerability Assessment","Compliance Auditing","OWASP","Zero Trust Architecture"].map(n=>({name:n,category:"Digital",subcategory:"Cybersecurity"})),
...["Unit Testing","Integration Testing","E2E Testing","Test Automation","Selenium","Cypress","Jest","Playwright","Performance Testing","Load Testing","QA Strategy","Test-Driven Development","BDD"].map(n=>({name:n,category:"Digital",subcategory:"Testing & QA"})),
...["iOS Development","Android Development","React Native","Flutter","Xamarin","Mobile UI Design","App Store Optimisation","Push Notifications","Responsive Design","Progressive Web Apps"].map(n=>({name:n,category:"Digital",subcategory:"Mobile Development"})),
...["Linux Administration","Windows Server","Networking","TCP/IP","DNS","DHCP","Load Balancing","VMware","Hyper-V","Site Reliability Engineering","Monitoring","Observability","Grafana","Prometheus","Datadog"].map(n=>({name:n,category:"Digital",subcategory:"Infrastructure & Ops"})),

// ── BUSINESS & ADMINISTRATION (ESCO Pillar) ──────────────────────────────────
...["Strategic Planning","Business Development","Business Analysis","Market Research","Competitive Analysis","SWOT Analysis","Business Case Development","Stakeholder Management","Change Management","Organisational Development"].map(n=>({name:n,category:"Business",subcategory:"Strategy & Planning"})),
...["Project Management","Agile Methodology","Scrum","Kanban","Waterfall","Prince2","PMP","Programme Management","Risk Management","Resource Planning","Gantt Charts","Sprint Planning","Roadmapping"].map(n=>({name:n,category:"Business",subcategory:"Project Management"})),
...["Product Management","Product Strategy","Product Discovery","User Story Mapping","A/B Testing","OKRs","KPI Definition","Go-to-Market Strategy","Product-Led Growth","Feature Prioritisation","Backlog Management"].map(n=>({name:n,category:"Business",subcategory:"Product Management"})),
...["Financial Analysis","Budgeting","Forecasting","P&L Management","Financial Modelling","Cost-Benefit Analysis","Revenue Recognition","Cash Flow Management","Variance Analysis","Capital Planning"].map(n=>({name:n,category:"Business",subcategory:"Finance"})),
...["Accounting","Bookkeeping","Accounts Payable","Accounts Receivable","General Ledger","Tax Compliance","Audit","IFRS","GAAP","Payroll","Treasury Management","Management Accounting"].map(n=>({name:n,category:"Business",subcategory:"Accounting"})),
...["Sales Strategy","B2B Sales","B2C Sales","Account Management","Pipeline Management","CRM Management","Salesforce","HubSpot","Lead Generation","Sales Forecasting","Negotiation","Cold Outreach","Consultative Selling"].map(n=>({name:n,category:"Business",subcategory:"Sales"})),
...["Digital Marketing","Content Marketing","SEO","SEM","Social Media Marketing","Email Marketing","Marketing Automation","Brand Management","Market Segmentation","Campaign Management","Google Analytics","Google Ads","Meta Ads","LinkedIn Ads","Copywriting","PR & Communications"].map(n=>({name:n,category:"Business",subcategory:"Marketing"})),
...["Supply Chain Management","Procurement","Logistics","Inventory Management","Warehouse Management","Lean Manufacturing","Six Sigma","Quality Management","ISO 9001","Vendor Management","Demand Planning"].map(n=>({name:n,category:"Business",subcategory:"Operations & Supply Chain"})),
...["Talent Acquisition","Recruitment","Employer Branding","Employee Engagement","Performance Management","Learning & Development","Compensation & Benefits","HRIS","Succession Planning","Workforce Planning","DEI Strategy","Onboarding","Employee Relations","HR Analytics"].map(n=>({name:n,category:"Business",subcategory:"Human Resources"})),
...["Contract Management","Legal Compliance","Regulatory Affairs","GDPR","Data Privacy","Intellectual Property","Corporate Governance","Risk & Compliance","Anti-Money Laundering","KYC","Sanctions Screening"].map(n=>({name:n,category:"Business",subcategory:"Legal & Compliance"})),
...["Customer Service","Customer Success","Client Relationship Management","Call Centre Operations","Service Level Agreements","NPS Management","Customer Journey Mapping","Complaint Resolution","Upselling","Cross-selling"].map(n=>({name:n,category:"Business",subcategory:"Customer Service"})),

// ── TRANSVERSAL SKILLS (ESCO: Communication, collaboration, creativity) ──────
...["Communication Skills","Verbal Communication","Written Communication","Public Speaking","Presentation Skills","Active Listening","Storytelling","Technical Writing","Report Writing","Business Writing","Editing & Proofreading","Media Relations"].map(n=>({name:n,category:"Transversal",subcategory:"Communication"})),
...["Leadership","Team Leadership","People Management","Coaching & Mentoring","Delegation","Conflict Resolution","Decision Making","Emotional Intelligence","Influencing","Motivating Others","Servant Leadership","Executive Presence"].map(n=>({name:n,category:"Transversal",subcategory:"Leadership & Management"})),
...["Problem Solving","Critical Thinking","Analytical Thinking","Creative Thinking","Design Thinking","Systems Thinking","Root Cause Analysis","Logical Reasoning","Innovation","Brainstorming","Lateral Thinking"].map(n=>({name:n,category:"Transversal",subcategory:"Thinking & Problem Solving"})),
...["Teamwork","Collaboration","Cross-functional Collaboration","Remote Working","Virtual Team Management","Networking","Relationship Building","Consensus Building","Facilitation","Mediation"].map(n=>({name:n,category:"Transversal",subcategory:"Collaboration"})),
...["Time Management","Organisation","Prioritisation","Multitasking","Attention to Detail","Planning","Goal Setting","Self-motivation","Adaptability","Resilience","Stress Management","Work-Life Balance"].map(n=>({name:n,category:"Transversal",subcategory:"Self-Management"})),
...["Negotiation Skills","Persuasion","Diplomacy","Assertiveness","Cultural Sensitivity","Intercultural Communication","Empathy","Ethics","Professional Conduct","Confidentiality"].map(n=>({name:n,category:"Transversal",subcategory:"Interpersonal"})),

// ── SCIENCE & ENGINEERING (ESCO Pillar) ──────────────────────────────────────
...["Mechanical Engineering","Electrical Engineering","Civil Engineering","Chemical Engineering","Structural Engineering","Aerospace Engineering","Automotive Engineering","Biomedical Engineering","Environmental Engineering","Industrial Engineering","Materials Science","Thermodynamics","Fluid Dynamics","CAD/CAM","AutoCAD","SolidWorks","CATIA"].map(n=>({name:n,category:"Engineering",subcategory:"Engineering Disciplines"})),
...["Research Methodology","Statistical Analysis","Experimental Design","Laboratory Techniques","Scientific Writing","Peer Review","Clinical Research","Biotechnology","Genomics","Bioinformatics","Pharmacology","Toxicology","Regulatory Science"].map(n=>({name:n,category:"Engineering",subcategory:"Science & Research"})),
...["Mathematics","Statistics","Probability","Linear Algebra","Calculus","Numerical Analysis","Operations Research","Optimisation","Simulation Modelling","Quantitative Analysis"].map(n=>({name:n,category:"Engineering",subcategory:"Mathematics & Statistics"})),
...["Sustainability","Environmental Assessment","Carbon Footprint Analysis","Renewable Energy","Waste Management","ESG Reporting","Climate Risk","Circular Economy","Life Cycle Assessment","Green Building"].map(n=>({name:n,category:"Engineering",subcategory:"Sustainability"})),

// ── DESIGN & CREATIVE (ESCO: Arts) ───────────────────────────────────────────
...["UX Design","UI Design","Interaction Design","Information Architecture","Wireframing","Prototyping","User Research","Usability Testing","Design Systems","Accessibility Design","Figma","Sketch","Adobe XD","InVision"].map(n=>({name:n,category:"Design",subcategory:"UX/UI Design"})),
...["Graphic Design","Typography","Colour Theory","Layout Design","Brand Identity","Logo Design","Print Design","Packaging Design","Adobe Photoshop","Adobe Illustrator","Adobe InDesign","Canva"].map(n=>({name:n,category:"Design",subcategory:"Graphic Design"})),
...["Video Production","Video Editing","Motion Graphics","Animation","3D Modelling","Adobe Premiere Pro","After Effects","DaVinci Resolve","Blender","Cinema 4D","Photography","Photo Editing","Lightroom"].map(n=>({name:n,category:"Design",subcategory:"Visual & Motion"})),
...["Content Strategy","Content Creation","Social Media Content","Blog Writing","Podcast Production","Newsletter Writing","Content Governance","Editorial Planning","SEO Writing","UX Writing","Microcopy"].map(n=>({name:n,category:"Design",subcategory:"Content & Media"})),

// ── LANGUAGES (ESCO Pillar) ──────────────────────────────────────────────────
...["English","Arabic","French","German","Spanish","Portuguese","Mandarin Chinese","Japanese","Korean","Hindi","Russian","Italian","Dutch","Swedish","Norwegian","Danish","Finnish","Polish","Turkish","Greek","Hebrew","Thai","Vietnamese","Bahasa Indonesia","Bahasa Malay","Urdu","Bengali","Swahili","Tagalog","Romanian","Czech","Hungarian","Ukrainian","Persian/Farsi"].map(n=>({name:n,category:"Languages",subcategory:"World Languages"})),
...["Translation","Interpretation","Localisation","Transcription","Subtitling","Cross-cultural Communication","Language Teaching","CEFR Assessment","Technical Translation","Legal Translation","Medical Translation"].map(n=>({name:n,category:"Languages",subcategory:"Language Services"})),

// ── HEALTHCARE & LIFE SCIENCES ───────────────────────────────────────────────
...["Patient Care","Clinical Assessment","Medical Diagnosis","Nursing","Physiotherapy","Occupational Therapy","Pharmacy","Mental Health","Counselling","CBT","Psychotherapy","First Aid","Emergency Medicine","Surgery","Anaesthesia","Radiology","Pathology","Oncology","Cardiology","Paediatrics","Geriatrics","Public Health","Epidemiology","Health Informatics","Medical Devices","GMP","Pharmacovigilance","Clinical Trials Management"].map(n=>({name:n,category:"Healthcare",subcategory:"Healthcare & Medicine"})),

// ── EDUCATION & TRAINING ─────────────────────────────────────────────────────
...["Teaching","Curriculum Design","Instructional Design","E-Learning Development","Training Delivery","Assessment Design","Educational Technology","Moodle","LMS Administration","SCORM","Adult Learning","Facilitation","Workshop Design","Coaching","Blended Learning","Gamification"].map(n=>({name:n,category:"Education",subcategory:"Education & Training"})),

// ── CONSTRUCTION & TRADES ────────────────────────────────────────────────────
...["Construction Management","Building Regulations","Health & Safety","NEBOSH","IOSH","CDM Regulations","Site Management","Quantity Surveying","BIM","Building Services","Plumbing","Electrical Installation","Carpentry","Welding","HVAC","Fire Safety","Scaffolding","Crane Operation"].map(n=>({name:n,category:"Construction",subcategory:"Construction & Trades"})),

// ── CERTIFICATIONS & STANDARDS ───────────────────────────────────────────────
...["PMP","PRINCE2 Practitioner","Scrum Master (CSM)","SAFe Agilist","ITIL","TOGAF","AWS Solutions Architect","Azure Administrator","Google Cloud Professional","CISSP","CISM","CompTIA Security+","CFA","ACCA","CIMA","CPA","Six Sigma Green Belt","Six Sigma Black Belt","CIPD","SHRM","ISO 27001","ISO 14001","LEED","NEBOSH Certificate","PMI-ACP","Certified Kubernetes Administrator","Terraform Associate"].map(n=>({name:n,category:"Certifications",subcategory:"Professional Certifications"})),
];

module.exports = ESCO_SKILLS;
