const path = require('path');
const fs   = require('fs');
const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const crypto  = require('crypto');
const { applyStarterConfig } = require('../data/starter_config');
const { getStore, saveStore, saveStoreNow, provisionTenant, tenantStorage, loadTenantStore } = require('../db/init');
const { invalidateTenantCache } = require('../middleware/tenant');

const hashPassword = (pw) => crypto.createHash('sha256').update(pw + 'talentos_salt').digest('hex');

function ensureCollections() {
  const s = getStore();
  if (!s.clients)             { s.clients = [];             saveStore(); }
  if (!s.client_environments) { s.client_environments = []; saveStore(); }
  if (!s.provision_log)       { s.provision_log = [];       saveStore(); }
}

const TEMPLATES = {
  core_recruitment: {
    label: 'Core Recruitment',
    description: 'People, Jobs and Talent Pools with standard recruitment fields',
    icon: 'users',
    objects: [
      {
        slug: 'people', name: 'Person', plural_name: 'People', icon: 'user', color: '#4361EE', is_system: true,
        fields: [
          // ── IDENTITY ─────────────────────────────────────────────────────
          { name:'Identity',            api_key:'section_identity',    field_type:'section_separator',is_required:false, show_in_list:false, collapsible:true },
          { name:'Person Type',         api_key:'person_type',         field_type:'select',           is_required:false, show_in_list:true,
            options:['Candidate','Employee','Contractor','Consultant','Contact'] },
          { name:'First Name',          api_key:'first_name',          field_type:'text',             is_required:true,  show_in_list:true  },
          { name:'Last Name',           api_key:'last_name',           field_type:'text',             is_required:true,  show_in_list:true  },
          { name:'Current Title',       api_key:'current_title',       field_type:'text',             is_required:false, show_in_list:true  },
          { name:'Current Company',     api_key:'current_company',     field_type:'text',             is_required:false, show_in_list:false  },
          { name:'Summary / Bio',       api_key:'summary',             field_type:'textarea',         is_required:false, show_in_list:false },
          // ── CONTACT ──────────────────────────────────────────────────────
          { name:'Contact',             api_key:'section_contact',     field_type:'section_separator',is_required:false, show_in_list:false, collapsible:true },
          { name:'Email',               api_key:'email',               field_type:'email',            is_required:true,  show_in_list:true  },
          { name:'Phone',               api_key:'phone',               field_type:'phone',            is_required:false, show_in_list:true },
          { name:'Location',            api_key:'location',            field_type:'text',             is_required:false, show_in_list:true  },
          { name:'Country',             api_key:'country',             field_type:'country',          is_required:false, show_in_list:false },
          // ── PROFESSIONAL ─────────────────────────────────────────────────
          { name:'Professional',        api_key:'section_professional',field_type:'section_separator',is_required:false, show_in_list:false, collapsible:true },
          { name:'Work History',        api_key:'work_history',        field_type:'table',            is_required:false, show_in_list:false },
          { name:'Education',           api_key:'education',           field_type:'table',            is_required:false, show_in_list:false },
          { name:'Years Experience',    api_key:'years_experience',    field_type:'number',           is_required:false, show_in_list:false  },
          { name:'Skills',              api_key:'skills',              field_type:'skills',           is_required:false, show_in_list:false },
          { name:'Languages',           api_key:'languages',           field_type:'multi_select',     is_required:false, show_in_list:false,
            options:['English','Arabic','French','German','Spanish','Mandarin','Portuguese','Hindi','Japanese','Other'] },
          { name:'LinkedIn URL',        api_key:'linkedin_url',        field_type:'url',              is_required:false, show_in_list:true },
          { name:'Cover Letter',        api_key:'cover_letter',        field_type:'rich_text',        is_required:false, show_in_list:false },
          // ── AVAILABILITY ─────────────────────────────────────────────────
          { name:'Availability',        api_key:'section_availability',field_type:'section_separator',is_required:false, show_in_list:false, collapsible:true },
          { name:'Notice Period',       api_key:'notice_period',       field_type:'select',           is_required:false, show_in_list:false,
            options:['Immediate','2 weeks','1 month','2 months','3 months','Negotiable'] },
          { name:'Available From',      api_key:'availability_date',   field_type:'date',             is_required:false, show_in_list:false },
          { name:'Salary Expectation',  api_key:'salary_expectation',  field_type:'currency',         is_required:false, show_in_list:false },
          { name:'Work Type Preference',api_key:'work_type_preference',field_type:'multi_select',     is_required:false, show_in_list:false,
            options:['On-site','Hybrid','Remote'] },
          { name:'Work Authorisation',  api_key:'work_authorisation',  field_type:'select',           is_required:false, show_in_list:false,
            options:['Citizen','Permanent Resident','Work Visa','Requires Sponsorship'] },
          // ── EMPLOYMENT (Employee only) ────────────────────────────────────
          { name:'Employment',          api_key:'section_employment',  field_type:'section_separator',is_required:false, show_in_list:false, collapsible:true },
          { name:'Job Title',           api_key:'job_title',           field_type:'text',             is_required:false, show_in_list:false,
            condition_field:'person_type', condition_value:'Employee' },
          { name:'Department',          api_key:'department',          field_type:'select',           is_required:false, show_in_list:false,
            condition_field:'person_type', condition_value:'Employee',
            options:['Engineering','Product','Sales','Marketing','Finance','HR','Operations','Legal','Customer Success','Other'] },
          { name:'Entity / Company',    api_key:'entity',              field_type:'text',             is_required:false, show_in_list:false,
            condition_field:'person_type', condition_value:'Employee' },
          { name:'Employment Type',     api_key:'employment_type',     field_type:'select',           is_required:false, show_in_list:false,
            condition_field:'person_type', condition_value:'Employee',
            options:['Full-time','Part-time','Contract','Casual'] },
          { name:'Start Date',          api_key:'start_date',          field_type:'date',             is_required:false, show_in_list:false,
            condition_field:'person_type', condition_value:'Employee' },
          { name:'End Date',            api_key:'end_date',            field_type:'date',             is_required:false, show_in_list:false,
            condition_field:'person_type', condition_value:'Employee' },
          // ── RECRUITMENT ───────────────────────────────────────────────────
          { name:'Recruitment',         api_key:'section_recruitment', field_type:'section_separator',is_required:false, show_in_list:false, collapsible:true },
          { name:'Status',              api_key:'status',              field_type:'select',           is_required:false, show_in_list:false,
            options:['Active','Passive','Placed','On Hold','Blacklisted','Archived','Not Looking'] },
          { name:'Source',              api_key:'source',              field_type:'select',           is_required:false, show_in_list:false,
            options:['LinkedIn','Referral','Agency','Job Board','Direct','Portal','Event','Other'] },
          { name:'Source Detail',       api_key:'source_detail',       field_type:'text',             is_required:false, show_in_list:false },
          { name:'Rating',              api_key:'rating',              field_type:'rating',           is_required:false, show_in_list:false  },
          { name:'Do Not Contact',      api_key:'do_not_contact',      field_type:'boolean',          is_required:false, show_in_list:false },
          { name:'GDPR Consent',        api_key:'gdpr_consent',        field_type:'boolean',          is_required:false, show_in_list:false },
          { name:'GDPR Consent Date',   api_key:'gdpr_consent_date',   field_type:'date',             is_required:false, show_in_list:false },
          // ── DIVERSITY & INCLUSION ─────────────────────────────────────────
          { name:'Diversity & Inclusion',api_key:'section_dei',        field_type:'section_separator',is_required:false, show_in_list:false, collapsible:true },
          { name:'Gender',              api_key:'gender',              field_type:'select',           is_required:false, show_in_list:false,
            options:['Male','Female','Non-binary','Prefer not to say'] },
          { name:'Date of Birth',       api_key:'date_of_birth',       field_type:'date',             is_required:false, show_in_list:false },
          { name:'Nationality',         api_key:'nationality',         field_type:'country',          is_required:false, show_in_list:false },
        ]
      },
      {
        slug: 'jobs', name: 'Job', plural_name: 'Jobs', icon: 'briefcase', color: '#F79009', is_system: true,
        fields: [
          // ── OVERVIEW ─────────────────────────────────────────────────────
          { name:'Overview',                  api_key:'section_overview',    field_type:'section_separator',is_required:false, show_in_list:false, collapsible:true },
          { name:'Job Title',                 api_key:'job_title',           field_type:'text',             is_required:true,  show_in_list:true  },
          { name:'Department',                api_key:'department',          field_type:'select',           is_required:false, show_in_list:true,
            options:['Engineering','Product','Sales','Marketing','Finance','HR','Operations','Legal','Customer Success','Design','Data','Other'] },
          { name:'Sub-department',            api_key:'sub_department',      field_type:'text',             is_required:false, show_in_list:false },
          { name:'Location',                  api_key:'location',            field_type:'text',             is_required:false, show_in_list:true  },
          { name:'Work Type',                 api_key:'work_type',           field_type:'select',           is_required:false, show_in_list:true,
            options:['On-site','Hybrid','Remote'] },
          { name:'Employment Type',           api_key:'employment_type',     field_type:'select',           is_required:false, show_in_list:true,
            options:['Full-time','Part-time','Contract','Freelance','Internship','Temporary'] },
          { name:'Status',                    api_key:'status',              field_type:'select',           is_required:false, show_in_list:true,
            options:['Draft','Open','On Hold','Filled','Cancelled'] },
          { name:'Priority',                  api_key:'priority',            field_type:'select',           is_required:false, show_in_list:true,
            options:['Critical','High','Medium','Low'] },
          { name:'Job Code / Req No.',        api_key:'job_code',            field_type:'text',             is_required:false, show_in_list:false },
          { name:'Headcount',                 api_key:'headcount',           field_type:'number',           is_required:false, show_in_list:false },
          { name:'Reason for Hire',           api_key:'reason_for_hire',     field_type:'select',           is_required:false, show_in_list:false,
            options:['New Role','Backfill','Replacement','Expansion'] },
          { name:'Job Description',           api_key:'description',         field_type:'rich_text',        is_required:false, show_in_list:false },
          // ── COMPENSATION ─────────────────────────────────────────────────
          { name:'Compensation',              api_key:'section_compensation',field_type:'section_separator',is_required:false, show_in_list:false, collapsible:true },
          { name:'Salary Min',                api_key:'salary_min',          field_type:'currency',         is_required:false, show_in_list:false },
          { name:'Salary Max',                api_key:'salary_max',          field_type:'currency',         is_required:false, show_in_list:false },
          { name:'Currency',                  api_key:'salary_currency',     field_type:'select',           is_required:false, show_in_list:false,
            options:['AED','USD','GBP','EUR','SAR','QAR','KWD','INR'] },
          { name:'Pay Frequency',             api_key:'pay_frequency',       field_type:'select',           is_required:false, show_in_list:false,
            options:['Annual','Monthly','Hourly','Daily'] },
          { name:'Bonus (%)',                 api_key:'bonus_percent',       field_type:'number',           is_required:false, show_in_list:false },
          { name:'Equity / Stock',            api_key:'equity',              field_type:'boolean',          is_required:false, show_in_list:false },
          { name:'Visa Sponsorship',          api_key:'visa_sponsorship',    field_type:'boolean',          is_required:false, show_in_list:false },
          { name:'Benefits',                  api_key:'benefits',            field_type:'multi_select',     is_required:false, show_in_list:false,
            options:['Health Insurance','Pension','Car Allowance','Housing Allowance','Annual Flights','Gym','Remote Stipend','Childcare','Learning Budget'] },
          // ── REQUIREMENTS ─────────────────────────────────────────────────
          { name:'Requirements',              api_key:'section_requirements',field_type:'section_separator',is_required:false, show_in_list:false, collapsible:true },
          { name:'Required Skills',           api_key:'required_skills',     field_type:'skills',           is_required:false, show_in_list:false },
          { name:'Min. Experience (yrs)',     api_key:'experience_min_years',field_type:'number',           is_required:false, show_in_list:false },
          { name:'Education Level',           api_key:'education_level',     field_type:'select',           is_required:false, show_in_list:false,
            options:['Any','High School','Degree','Masters','PhD','Professional Certification'] },
          { name:'Nice-to-have Skills',       api_key:'nice_to_have_skills', field_type:'multi_select',     is_required:false, show_in_list:false },
          { name:'Languages Required',        api_key:'languages_required',  field_type:'multi_select',     is_required:false, show_in_list:false,
            options:['English','Arabic','French','German','Spanish','Mandarin','Portuguese','Hindi','Japanese'] },
          { name:'Certifications',            api_key:'certifications',      field_type:'text',             is_required:false, show_in_list:false },
          // ── TEAM ─────────────────────────────────────────────────────────
          { name:'Team',                      api_key:'section_team',        field_type:'section_separator',is_required:false, show_in_list:false, collapsible:true },
          { name:'Hiring Manager',            api_key:'hiring_manager',      field_type:'people',           is_required:false, show_in_list:true,
            related_object_slug:'people', people_multi:false },
          { name:'Recruiter',                 api_key:'recruiter',           field_type:'people',           is_required:false, show_in_list:false,
            related_object_slug:'people' },
          { name:'Interviewers',              api_key:'interviewers',        field_type:'people',           is_required:false, show_in_list:false,
            related_object_slug:'people', people_multi:true },
          { name:'Coordinator',               api_key:'coordinator',         field_type:'people',           is_required:false, show_in_list:false,
            related_object_slug:'people' },
          { name:'Sourcing Partner',          api_key:'sourcing_partner',    field_type:'people',           is_required:false, show_in_list:false,
            related_object_slug:'people' },
          // ── POSTING ──────────────────────────────────────────────────────
          { name:'Posting',                   api_key:'section_posting',     field_type:'section_separator',is_required:false, show_in_list:false, collapsible:true },
          { name:'Posting Status',            api_key:'posting_status',      field_type:'select',           is_required:false, show_in_list:false,
            options:['Not Posted','Draft','Live','Paused','Closed'] },
          { name:'Career Site Visible',       api_key:'career_site_visible', field_type:'boolean',          is_required:false, show_in_list:false },
          { name:'Internal Only',             api_key:'internal_only',       field_type:'boolean',          is_required:false, show_in_list:false },
          { name:'Job Boards',                api_key:'job_boards',          field_type:'multi_select',     is_required:false, show_in_list:false,
            options:['LinkedIn','Indeed','Glassdoor','Bayt','Naukri','Monster','Reed','Total Jobs','Company Website','Referral','Other'] },
          { name:'Open Date',                 api_key:'open_date',           field_type:'date',             is_required:false, show_in_list:true  },
          { name:'Posted Date',               api_key:'posted_date',         field_type:'date',             is_required:false, show_in_list:false },
          { name:'Application Deadline',      api_key:'application_deadline',field_type:'date',             is_required:false, show_in_list:false },
          { name:'External Job URL',          api_key:'external_job_url',    field_type:'url',              is_required:false, show_in_list:false },
          { name:'Referral Bonus',            api_key:'referral_bonus',      field_type:'currency',         is_required:false, show_in_list:false },
          // ── PROCESS & TIMELINE ───────────────────────────────────────────
          { name:'Process & Timeline',        api_key:'section_process',     field_type:'section_separator',is_required:false, show_in_list:false, collapsible:true },
          { name:'Target Close Date',         api_key:'target_close_date',   field_type:'date',             is_required:false, show_in_list:true  },
          { name:'Actual Close Date',         api_key:'actual_close_date',   field_type:'date',             is_required:false, show_in_list:false },
          { name:'Target Start Date',         api_key:'target_start_date',   field_type:'date',             is_required:false, show_in_list:false },
          { name:'Time-to-Fill Target (days)',api_key:'time_to_fill_target', field_type:'number',           is_required:false, show_in_list:false },
          // ── APPROVAL ─────────────────────────────────────────────────────
          { name:'Approval',                  api_key:'section_approval',    field_type:'section_separator',is_required:false, show_in_list:false, collapsible:true },
          { name:'Approval Status',           api_key:'approval_status',     field_type:'select',           is_required:false, show_in_list:false,
            options:['Not Required','Pending','Approved','Rejected'] },
          { name:'Approved By',               api_key:'approved_by',         field_type:'people',           is_required:false, show_in_list:false,
            related_object_slug:'people' },
          { name:'Approval Date',             api_key:'approval_date',       field_type:'date',             is_required:false, show_in_list:false },
          { name:'Cost Centre',               api_key:'cost_centre',         field_type:'text',             is_required:false, show_in_list:false },
          { name:'Budget Code',               api_key:'budget_code',         field_type:'text',             is_required:false, show_in_list:false },
          { name:'Job ID',                    api_key:'job_id',              field_type:'auto_number',      is_required:false, show_in_list:true  },
        ]
      },
      {
        slug: 'talent-pools', name: 'Talent Pool', plural_name: 'Talent Pools', icon: 'layers', color: '#0CAF77', is_system: true,
        fields: [
          { name:'Pool Name',    api_key:'pool_name',    field_type:'text',     is_required:true,  show_in_list:true  },
          { name:'Description',  api_key:'description',  field_type:'textarea', is_required:false, show_in_list:false },
          { name:'Focus Area',   api_key:'focus_area',   field_type:'text',     is_required:false, show_in_list:true  },
          { name:'Category',     api_key:'category',     field_type:'select',   is_required:false, show_in_list:true,
            options:['Engineering','Sales','Marketing','Finance','Operations','Leadership','Graduate','Passive','Other'] },
          { name:'Status',       api_key:'status',       field_type:'select',   is_required:false, show_in_list:true,
            options:['Active','Archived','Draft'] },
          { name:'Owner',        api_key:'owner',        field_type:'people',   is_required:false, show_in_list:false,
            related_object_slug:'people' },
          { name:'Target Size',  api_key:'target_size',  field_type:'number',   is_required:false, show_in_list:false },
          { name:'Tags',         api_key:'tags',         field_type:'multi_select', is_required:false, show_in_list:false },
        ]
      }
    ],
    default_roles: [
      { name: 'Super Admin',    permissions: { create:true,  read:true,  edit:true,  delete:true,  admin:true  }, color: '#7C3AED' },
      { name: 'Recruiter',      permissions: { create:true,  read:true,  edit:true,  delete:false, admin:false }, color: '#4361EE' },
      { name: 'Hiring Manager', permissions: { create:false, read:true,  edit:false, delete:false, admin:false }, color: '#F79009' },
      { name: 'Viewer',         permissions: { create:false, read:true,  edit:false, delete:false, admin:false }, color: '#9DA8C7' },
    ]
  },
  agency: {
    label: 'Recruitment Agency',
    description: 'Adds Clients, Placements and Invoices on top of Core Recruitment',
    icon: 'briefcase',
    extends: 'core_recruitment',
    extra_objects: [
      {
        slug: 'clients_co', name: 'Client Company', plural_name: 'Client Companies', icon: 'building', color: '#EF4444', is_system: false,
        fields: [
          { name: 'Company Name',  api_key: 'company_name',  field_type: 'text',     is_required: true,  show_in_list: true  },
          { name: 'Industry',      api_key: 'industry',      field_type: 'select',   is_required: false, show_in_list: true,
            options: ['Technology','Finance','Healthcare','Retail','Manufacturing','Professional Services','Other'] },
          { name: 'Status',        api_key: 'status',        field_type: 'select',   is_required: false, show_in_list: true,
            options: ['Prospect','Active','On Hold','Former'] },
          { name: 'Account Owner', api_key: 'account_owner', field_type: 'text',     is_required: false, show_in_list: true  },
          { name: 'Website',       api_key: 'website',       field_type: 'url',      is_required: false, show_in_list: false },
          { name: 'Notes',         api_key: 'notes_text',    field_type: 'textarea', is_required: false, show_in_list: false },
        ]
      },
      {
        slug: 'placements', name: 'Placement', plural_name: 'Placements', icon: 'check-circle', color: '#0CAF77', is_system: false,
        fields: [
          { name: 'Candidate',  api_key: 'candidate',  field_type: 'people',   is_required: true,  show_in_list: true, related_object_slug: 'people', people_multi: false },
          { name: 'Job Title',  api_key: 'job_title',  field_type: 'text',     is_required: false, show_in_list: true  },
          { name: 'Start Date', api_key: 'start_date', field_type: 'date',     is_required: false, show_in_list: true  },
          { name: 'Salary',     api_key: 'salary',     field_type: 'currency', is_required: false, show_in_list: true  },
          { name: 'Fee %',      api_key: 'fee_pct',    field_type: 'number',   is_required: false, show_in_list: true  },
          { name: 'Fee Amount', api_key: 'fee_amount', field_type: 'currency', is_required: false, show_in_list: true  },
          { name: 'Status',     api_key: 'status',     field_type: 'select',   is_required: false, show_in_list: true,
            options: ['Pending','Confirmed','Invoiced','Paid','Cancelled'] },
        ]
      }
    ]
  },
  rpo_provider: {
    label: 'RPO Provider',
    description: 'Full RPO template with Client Companies, SLA tracking and Placements',
    icon: 'briefcase',
    extends: 'core_recruitment',
    extra_objects: [
      {
        slug: 'client_companies', name: 'Client Company', plural_name: 'Client Companies', icon: 'building', color: '#EF4444', is_system: false,
        fields: [
          { name: 'Company Name',    api_key: 'company_name',    field_type: 'text',     is_required: true,  show_in_list: true  },
          { name: 'Industry',        api_key: 'industry',        field_type: 'select',   is_required: false, show_in_list: true,
            options: ['Technology','Finance','Healthcare','Retail','Manufacturing','Professional Services','Government','Other'] },
          { name: 'Account Status',  api_key: 'account_status',  field_type: 'select',   is_required: false, show_in_list: true,
            options: ['Prospect','Active','On Hold','Former'] },
          { name: 'Account Manager', api_key: 'account_manager', field_type: 'text',     is_required: false, show_in_list: true  },
          { name: 'Contract Start',  api_key: 'contract_start',  field_type: 'date',     is_required: false, show_in_list: false },
          { name: 'Contract End',    api_key: 'contract_end',    field_type: 'date',     is_required: false, show_in_list: false },
          { name: 'Default SLA Days',api_key: 'default_sla_days',field_type: 'number',   is_required: false, show_in_list: true  },
          { name: 'Fee Structure',   api_key: 'fee_structure',   field_type: 'select',   is_required: false, show_in_list: false,
            options: ['Retained','Contingency','Hybrid','Management Fee'] },
          { name: 'Website',         api_key: 'website',         field_type: 'url',      is_required: false, show_in_list: false },
          { name: 'Notes',           api_key: 'notes_text',      field_type: 'textarea', is_required: false, show_in_list: false },
        ]
      },
      {
        slug: 'placements', name: 'Placement', plural_name: 'Placements', icon: 'check-circle', color: '#0CAF77', is_system: false,
        fields: [
          { name: 'Candidate Name',  api_key: 'candidate_name',  field_type: 'text',     is_required: true,  show_in_list: true  },
          { name: 'Job Title',       api_key: 'job_title',       field_type: 'text',     is_required: false, show_in_list: true  },
          { name: 'Client Company',  api_key: 'client_company',  field_type: 'text',     is_required: false, show_in_list: true  },
          { name: 'Start Date',      api_key: 'start_date',      field_type: 'date',     is_required: false, show_in_list: true  },
          { name: 'Salary',          api_key: 'salary',          field_type: 'currency', is_required: false, show_in_list: false },
          { name: 'Placement Fee',   api_key: 'placement_fee',   field_type: 'currency', is_required: false, show_in_list: true  },
          { name: 'Guarantee Period',api_key: 'guarantee_period',field_type: 'number',   is_required: false, show_in_list: false },
          { name: 'Guarantee Expiry',api_key: 'guarantee_expiry',field_type: 'date',     is_required: false, show_in_list: false },
          { name: 'Status',          api_key: 'status',          field_type: 'select',   is_required: false, show_in_list: true,
            options: ['Placed','In Guarantee','Guarantee Expired','Cancelled'] },
        ]
      },
    ],
    jobs_extra_fields: [
      { name: 'Client Company',   api_key: 'client_company',   field_type: 'text',   is_required: false, show_in_list: true  },
      { name: 'Hiring Manager',   api_key: 'hiring_manager',   field_type: 'text',   is_required: false, show_in_list: false },
      { name: 'Priority',         api_key: 'priority',         field_type: 'select', is_required: false, show_in_list: true,
        options: ['Low','Medium','High','Critical'] },
      { name: 'SLA Target Days',  api_key: 'sla_target_days',  field_type: 'number', is_required: false, show_in_list: true  },
      { name: 'Date Opened',      api_key: 'date_opened',      field_type: 'date',   is_required: false, show_in_list: true  },
      { name: 'Brief Status',     api_key: 'brief_status',     field_type: 'select', is_required: false, show_in_list: false,
        options: ['Brief Received','Approved','Sourcing','Shortlisted','Interviewing','Offer Stage','Filled','Cancelled'] },
    ],
    default_roles: [
      { name: 'Super Admin',    permissions: { create:true,  read:true,  edit:true,  delete:true,  admin:true  }, color: '#7C3AED' },
      { name: 'Account Manager',permissions: { create:true,  read:true,  edit:true,  delete:false, admin:false }, color: '#EF4444' },
      { name: 'Recruiter',      permissions: { create:true,  read:true,  edit:true,  delete:false, admin:false }, color: '#4361EE' },
      { name: 'Viewer',         permissions: { create:false, read:true,  edit:false, delete:false, admin:false }, color: '#9DA8C7' },
    ]
  },
  hr_platform: {
    label: 'HR Platform',
    description: 'Employees, Departments and Leave on top of Core Recruitment',
    icon: 'users',
    extends: 'core_recruitment',
    extra_objects: [
      {
        slug: 'employees', name: 'Employee', plural_name: 'Employees', icon: 'user', color: '#0891B2', is_system: false,
        fields: [
          { name: 'First Name',  api_key: 'first_name',  field_type: 'text',     is_required: true,  show_in_list: true  },
          { name: 'Last Name',   api_key: 'last_name',   field_type: 'text',     is_required: true,  show_in_list: true  },
          { name: 'Employee ID', api_key: 'employee_id', field_type: 'text',     is_required: false, show_in_list: true  },
          { name: 'Job Title',   api_key: 'job_title',   field_type: 'text',     is_required: false, show_in_list: true  },
          { name: 'Department',  api_key: 'department',  field_type: 'text',     is_required: false, show_in_list: true  },
          { name: 'Start Date',  api_key: 'start_date',  field_type: 'date',     is_required: false, show_in_list: true  },
          { name: 'Status',      api_key: 'status',      field_type: 'select',   is_required: false, show_in_list: true,
            options: ['Active','On Leave','Terminated'] },
          { name: 'Salary',      api_key: 'salary',      field_type: 'currency', is_required: false, show_in_list: false },
        ]
      },
      {
        slug: 'leave_requests', name: 'Leave Request', plural_name: 'Leave Requests', icon: 'calendar', color: '#F59E0B', is_system: false,
        fields: [
          { name: 'Employee',   api_key: 'employee',   field_type: 'people',  is_required: true,  show_in_list: true, related_object_slug: 'employees', people_multi: false },
          { name: 'Leave Type', api_key: 'leave_type', field_type: 'select',  is_required: true,  show_in_list: true,
            options: ['Annual','Sick','Parental','Unpaid','Other'] },
          { name: 'Start Date', api_key: 'start_date', field_type: 'date',    is_required: true,  show_in_list: true  },
          { name: 'End Date',   api_key: 'end_date',   field_type: 'date',    is_required: true,  show_in_list: true  },
          { name: 'Days',       api_key: 'days',       field_type: 'number',  is_required: false, show_in_list: true  },
          { name: 'Status',     api_key: 'status',     field_type: 'select',  is_required: false, show_in_list: true,
            options: ['Pending','Approved','Rejected','Cancelled'] },
          { name: 'Notes',      api_key: 'notes_text', field_type: 'textarea',is_required: false, show_in_list: false },
        ]
      }
    ]
  }
};

function buildTemplate(key) {
  const tpl = TEMPLATES[key];
  if (!tpl) throw new Error(`Unknown template: ${key}`);
  let objects = [...(tpl.objects || [])];
  if (tpl.extends) {
    const base = TEMPLATES[tpl.extends];
    // Deep-clone base objects so we don't mutate them
    objects = JSON.parse(JSON.stringify([...(base.objects || [])]));
    // Inject jobs_extra_fields into the jobs object
    if (tpl.jobs_extra_fields && tpl.jobs_extra_fields.length) {
      const jobsObj = objects.find(o => o.slug === 'jobs');
      if (jobsObj) jobsObj.fields = [...(jobsObj.fields || []), ...tpl.jobs_extra_fields];
    }
    objects = [...objects, ...(tpl.extra_objects || [])];
  }
  return { objects, roles: tpl.default_roles || TEMPLATES.core_recruitment.default_roles };
}

async function provisionClient(clientData, envData, adminUser, templateKey) {
  const s = getStore(); ensureCollections();
  const now = new Date().toISOString();

  // Generate a URL-safe tenant slug from the company name
  const tenantSlug = clientData.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);

  const client = {
    id: uuidv4(), name: clientData.name, industry: clientData.industry||'',
    region: clientData.region||'', plan: clientData.plan||'starter', size: clientData.size||'',
    status: 'active', tenant_slug: tenantSlug,
    primary_contact_name: clientData.contact_name||'',
    primary_contact_email: clientData.contact_email||'', primary_contact_phone: clientData.contact_phone||'',
    website: clientData.website||'', notes: clientData.notes||'',
    trial_ends_at: clientData.plan==='trial' ? new Date(Date.now()+30*24*60*60*1000).toISOString() : null,
    created_at: now, updated_at: now, deleted_at: null,
  };
  s.clients.push(client);
  saveStoreNow('master'); // persist immediately so listTenants() finds the slug after restart

  const environment = {
    id: uuidv4(), client_id: client.id,
    name: envData.name || `${clientData.name} Production`,
    type: envData.type||'production', locale: envData.locale||'en',
    timezone: envData.timezone||'UTC', is_default: 0, status: 'active',
    created_at: now, updated_at: now, deleted_at: null,
  };
  s.client_environments.push(environment);
  saveStoreNow('master'); // flush again — environment is now in master store
  invalidateTenantCache(); // new slug must be visible immediately without 30s cache lag

  // Build objects/fields/roles in memory only — do NOT push to master store (s).
  // Everything goes exclusively into the isolated tenant store below.
  const { objects, roles } = buildTemplate(templateKey || 'core_recruitment');
  const createdObjects = [];
  const createdFields  = [];

  for (const objDef of objects) {
    const obj = {
      id: uuidv4(), environment_id: environment.id, slug: objDef.slug,
      name: objDef.name, plural_name: objDef.plural_name, icon: objDef.icon||'database',
      color: objDef.color||'#4361EE', is_system: objDef.is_system!==false,
      sort_order: createdObjects.length, created_at: now, updated_at: now, deleted_at: null,
    };
    createdObjects.push(obj);
    (objDef.fields||[]).forEach((fDef, i) => {
      createdFields.push({
        id: uuidv4(), environment_id: environment.id, object_id: obj.id,
        name: fDef.name, api_key: fDef.api_key, field_type: fDef.field_type,
        is_required: fDef.is_required||false,
        show_in_list: fDef.show_in_list!==false ? 1 : 0,
        show_in_form: 1,
        options: fDef.options||null,
        related_object_slug: fDef.related_object_slug||null,
        people_multi: fDef.people_multi!==undefined?fDef.people_multi:null,
        section_label: fDef.section_label||null,
        collapsible: fDef.collapsible!==false ? 1 : 0,
        as_panel: fDef.as_panel ? 1 : 0,
        condition_field: fDef.condition_field||null,
        condition_value: fDef.condition_value||null,
        placeholder: '', help_text: '', is_system: true,
        sort_order: i, created_at: now, updated_at: now, deleted_at: null,
      });
    });
  }

  const createdRoles = [];
  for (const roleDef of roles) {
    const slug = roleDef.name.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
    createdRoles.push({
      id: uuidv4(), environment_id: environment.id,
      name: roleDef.name, slug,
      permissions: roleDef.permissions, color: roleDef.color||'#4361EE',
      is_system: true, created_at: now, updated_at: now, deleted_at: null,
    });
  }

  if (!s.users) s.users = [];
  const superAdminRole = createdRoles.find(r=>r.name==='Super Admin')||createdRoles[0];
  const plainPassword = adminUser.password || 'Admin1234!';
  const user = {
    id: uuidv4(), environment_id: environment.id, client_id: client.id,
    first_name: adminUser.first_name||'Admin', last_name: adminUser.last_name||'User',
    email: adminUser.email,
    password_hash: hashPassword(plainPassword),
    role_id: superAdminRole?.id||null, role_name: superAdminRole?.name||'Super Admin',
    status: 'active', is_super_admin: true,
    must_change_password: 0, mfa_enabled: 0,
    last_login: null, login_count: 0,
    created_at: now, updated_at: now, deleted_at: null,
  };
  // Do NOT push user into master s.users — user belongs only in the tenant store

  s.provision_log.push({
    id: uuidv4(), client_id: client.id, environment_id: environment.id,
    template: templateKey||'core_recruitment', objects_seeded: createdObjects.length,
    fields_seeded: createdFields.length,
    roles_seeded: createdRoles.length, admin_email: adminUser.email,
    provisioned_at: now, status: 'success',
  });

  saveStore();

  // === Provision isolated tenant store ===
  // All client data lives in /data/tenant-{slug}.json, NOT in master store.
  // We run the seeding inside the tenant's AsyncLocalStorage context so
  // getStore() inside seedUsersAndRoles etc. writes to the tenant file.
  await tenantStorage.run(tenantSlug, async () => {
    const ts = provisionTenant(tenantSlug); // creates /data/tenant-{slug}.json

    // Seed environment
    if (!ts.environments) ts.environments = [];
    ts.environments.push({ ...environment });

    // Seed objects + fields
    if (!ts.objects) ts.objects = [];
    if (!ts.fields)  ts.fields  = [];
    for (const obj of createdObjects) ts.objects.push(obj);
    for (const field of createdFields) ts.fields.push(field);

    // Seed roles
    if (!ts.roles) ts.roles = [];
    for (const role of createdRoles) ts.roles.push(role);

    // Seed admin user into tenant store
    if (!ts.users) ts.users = [];
    ts.users.push(user);

    // Create a Person record so the admin appears in the People object
    const peopleObj = createdObjects.find(o => o.slug === 'people');
    if (peopleObj) {
      if (!ts.records) ts.records = [];
      ts.records.push({
        id: uuidv4(), object_id: peopleObj.id, environment_id: environment.id,
        record_number: 1,
        data: {
          first_name: adminUser.first_name || 'Admin',
          last_name:  adminUser.last_name  || 'User',
          email:      adminUser.email,
          status:     'Active',
          person_type: 'Employee',
          current_title: 'Administrator',
        },
        user_id:    user.id,
        created_by: user.id,
        created_at: now, updated_at: now, deleted_at: null,
      });
    }

    // Seed security defaults
    ts.security_settings = { password_min_length:8, password_require_uppercase:1, password_require_number:1, password_require_symbol:1, session_timeout_minutes:60, max_login_attempts:5, lockout_duration_minutes:30, mfa_enabled:0, sso_enabled:0, updated_at: now };

    // Seed company documents
    if (!ts.company_documents) ts.company_documents = [];
    const SAMPLE_DOCS = [
      { name:'Employee Benefits Guide 2026', category:'Benefits & Perks', visibility:'candidate', description:'Comprehensive overview of employee benefits, healthcare, retirement, and perks.', text:'Healthcare: comprehensive medical, dental, and vision from day one. 90% premiums covered for employees, 75% for dependents. Mental health support with 12 free therapy sessions. Retirement: 401(k) match up to 6%, fully vested after 2 years. PTO: 25 days annual leave plus public holidays, 5 mental health days, 16 weeks parental leave. Wellness: $1,500 annual stipend, free healthy snacks. Learning: $3,000 annual budget, LinkedIn Learning, Coursera access. Remote: flexible hybrid, $1,000 home office allowance.' },
      { name:'Company Culture Handbook', category:'Culture & Values', visibility:'candidate', description:'Our values, working style, DEI commitments.', text:'Mission: transform how organisations discover and develop talent. Values: People Over Process, Radical Transparency, Continuous Learning, Diverse Perspectives, Customer Obsession. Working style: small autonomous squads of 5-8, async-first, core hours 10am-3pm. DEI: 48% leadership women/non-binary, annual pay equity audits, 5 ERGs.' },
      { name:'Interview Process Guide', category:'Hiring Process', visibility:'candidate', description:'What candidates can expect during our interview process.', text:'Stage 1: Application Review (1-3 days). Stage 2: Recruiter Screen (30 min video). Stage 3: Hiring Manager Interview (45 min, behavioural). Stage 4: Technical Assessment (varies by role, topic shared in advance). Stage 5: Team Meet (45 min casual). Stage 6: Offer within 2 business days. Full process: 2-3 weeks. Single recruiter point of contact throughout.' },
      { name:'Salary & Compensation Bands', category:'Salary & Compensation', visibility:'internal', description:'Internal compensation framework — confidential.', text:'Targets 75th percentile. Engineering: IC1 $75-95k, IC2 $95-130k, IC3 $130-175k, IC4 $175-220k, IC5 $220-280k. Management: M1 $150-200k, M2 $200-250k, M3 $250-320k, VP $320-400k. Geographic adjustments: SF/NY 100%, London/Dubai 95%, Berlin 85%. Equity: 4-year vest, 1-year cliff.' },
      { name:'Brand Voice & Writing Guidelines', category:'Brand Guidelines', visibility:'internal', description:'How we write job descriptions and communications.', text:'Voice: confident not arrogant, warm but professional. JDs: lead with impact, be honest about challenges, always include salary range, avoid jargon, use inclusive language. Emails: clear subject lines, reference something specific, always include next step. Social: authentic over polished, employee stories, behind-the-scenes.' },
      { name:'Engineering Interview Scoring Rubric', category:'Interview Guides', visibility:'internal', description:'Structured scoring criteria for engineering interviews.', text:'Technical Problem Solving (1-5): 1=cannot break down problem, 3=working solution with guidance, 5=elegant solution. System Design (IC3+, 1-5): 1=cannot articulate components, 3=reasonable design, 5=exceptional production-level. Communication (1-5): 1=difficulty explaining, 3=communicates clearly, 5=outstanding. Recommendation: Strong Yes 4.0+, Yes 3.0-3.9, No 2.0-2.9, Strong No <2.0.' },
    ];
    const chunkText = (t,sz=500,ov=50) => { const w=t.split(/\s+/); const c=[]; for(let i=0;i<w.length;i+=sz-ov){c.push(w.slice(i,i+sz).join(' '));if(i+sz>=w.length)break;} return c; };
    SAMPLE_DOCS.forEach(d => {
      const words = d.text.split(/\s+/);
      const chunks = chunkText(d.text);
      ts.company_documents.push({ id: uuidv4(), environment_id: environment.id, name: d.name, category: d.category, visibility: d.visibility, description: d.description, original_filename: d.name.toLowerCase().replace(/\s+/g,'_')+'.txt', mime_type:'text/plain', file_size: d.text.length, text_content: d.text, word_count: words.length, chunks: chunks.map((c,i)=>({index:i,text:c})), chunk_count: chunks.length, created_at: now, updated_at: now, created_by:'system' });
    });

    saveStoreNow(tenantSlug); // synchronous — must complete before response
  });

  // Apply starter configuration (workflows, email templates, career site, scorecard)
  try {
    await applyStarterConfig(tenantSlug, environment, createdObjects, clientData);
  } catch(e) {
    console.error('[provision] Starter config failed (non-fatal):', e.message);
  }

  return {
    client, environment, tenant_slug: tenantSlug,
    admin_user: { ...user, password: '[hidden]' },
    objects: createdObjects.map(o=>({id:o.id,slug:o.slug,name:o.name})),
    roles: createdRoles.map(r=>({id:r.id,name:r.name})),
    credentials: {
      url: `/?tenant=${tenantSlug}`,
      email: adminUser.email,
      password: plainPassword,
      tenant_slug: tenantSlug,
    }
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  ensureCollections();
  const s = getStore();
  const clients = (s.clients||[]).filter(c=>!c.deleted_at);
  const enriched = clients.map(c => {
    const envs   = (s.client_environments||[]).filter(e=>e.client_id===c.id&&!e.deleted_at);
    const envIds = envs.map(e=>e.id);
    // Load from tenant store if provisioned
    const ts      = c.tenant_slug ? loadTenantStore(c.tenant_slug) : s;
    // Records — always use tenant store. Never fall back to master (would show wrong data).
    const records = (ts.records||[]).filter(r=>envIds.includes(r.environment_id)&&!r.deleted_at);
    // Users — check both stores
    const tsU = (ts.users||[]).filter(u=>(u.client_id===c.id||envIds.includes(u.environment_id))&&!u.deleted_at);
    const msU = (s.users||[]).filter(u=>(u.client_id===c.id||envIds.includes(u.environment_id))&&!u.deleted_at);
    const seenU = new Set(); const users = [...tsU,...msU].filter(u=>{ if(seenU.has(u.id)) return false; seenU.add(u.id); return true; });
    return { ...c, env_count: envs.length, record_count: records.length, user_count: users.length, tenant_slug: c.tenant_slug || null };
  });
  res.json(enriched);
});

router.get('/provision/templates', (req, res) => {
  res.json(Object.entries(TEMPLATES).map(([key, tpl]) => ({
    key, label: tpl.label, description: tpl.description, icon: tpl.icon,
    object_count: (tpl.objects||[]).length + ((tpl.extra_objects||[]).length),
  })));
});

router.get('/provision/log', (req, res) => {
  ensureCollections();
  res.json((getStore().provision_log||[]).slice().reverse());
});

router.get('/stats/platform', (req, res) => {
  ensureCollections();
  const s = getStore();
  const clients = (s.clients||[]).filter(c=>!c.deleted_at);
  const envs    = (s.client_environments||[]).filter(e=>!e.deleted_at);
  const records = (s.records||[]).filter(r=>!r.deleted_at);
  const users   = (s.users||[]).filter(u=>!u.deleted_at);
  const objects = (s.objects||[]).filter(o=>!o.deleted_at);
  const recordsByEnv = {};
  records.forEach(r=>{ recordsByEnv[r.environment_id]=(recordsByEnv[r.environment_id]||0)+1; });
  const topEnvs = envs.map(e=>({...e,record_count:recordsByEnv[e.id]||0}))
    .sort((a,b)=>b.record_count-a.record_count).slice(0,5);
  const statusBreakdown = clients.reduce((a,c)=>({...a,[c.status]:(a[c.status]||0)+1}),{});
  const planBreakdown   = clients.reduce((a,c)=>({...a,[c.plan]:(a[c.plan]||0)+1}),{});
  const storeSizeKB = Math.round(Buffer.byteLength(JSON.stringify(s),'utf8')/1024);
  res.json({
    totals: { clients:clients.length, environments:envs.length, records:records.length, users:users.length, objects:objects.length },
    status_breakdown: statusBreakdown, plan_breakdown: planBreakdown,
    top_environments: topEnvs, store_size_kb: storeSizeKB, generated_at: new Date().toISOString(),
  });
});

router.get('/:id/stats', (req, res) => {
  ensureCollections();
  const s = getStore();
  const client = (s.clients||[]).find(c=>c.id===req.params.id&&!c.deleted_at);
  if (!client) return res.status(404).json({ error: 'Not found' });
  const envs = (s.client_environments||[]).filter(e=>e.client_id===client.id&&!e.deleted_at);
  const envIds = new Set(envs.map(e=>e.id));

  // Load from tenant store if provisioned, otherwise master
  const ts = client.tenant_slug ? loadTenantStore(client.tenant_slug) : s;

  // Records — always use tenant store only. Never fall back to master.
  const records = (ts.records||[]).filter(r=>envIds.has(r.environment_id)&&!r.deleted_at);

  // Users — check both stores (user may be in master store with env_id pointing to tenant env)
  const tsUsers = (ts.users||[]).filter(u=>(u.client_id===client.id||envIds.has(u.environment_id))&&!u.deleted_at);
  const masterUsers = (s.users||[]).filter(u=>(u.client_id===client.id||envIds.has(u.environment_id))&&!u.deleted_at);
  const userIds = new Set();
  const users = [...tsUsers, ...masterUsers].filter(u => {
    if (userIds.has(u.id)) return false;
    userIds.add(u.id); return true;
  });

  // Objects — always use tenant store only
  const objects = (ts.objects||[]).filter(o=>envIds.has(o.environment_id)&&!o.deleted_at);
  const log     = (s.provision_log||[]).filter(l=>l.client_id===client.id);
  const thirtyDaysAgo = new Date(Date.now()-30*24*60*60*1000);
  const byDay = {};
  records.filter(r=>new Date(r.created_at)>thirtyDaysAgo)
    .forEach(r=>{ const d=r.created_at.slice(0,10); byDay[d]=(byDay[d]||0)+1; });
  // Sandboxes for this client's environments
  const sandboxes = (ts.sandboxes||s.sandboxes||[])
    .filter(sb => !sb.deleted_at && envIds.has(sb.production_env_id))
    .map(sb => {
      const sbEnv = (ts.environments||s.environments||[]).find(e=>e.id===sb.sandbox_env_id);
      return {
        id: sb.id,
        name: sb.name,
        status: sb.status,
        production_env_id: sb.production_env_id,
        sandbox_env_id: sb.sandbox_env_id,
        sandbox_env_name: sbEnv?.name || sb.name,
        created_at: sb.created_at,
        promoted_at: sb.promoted_at,
      };
    });

  res.json({
    client_id: client.id, client_name: client.name,
    environment_count: envs.length, record_count: records.length,
    user_count: users.length, object_count: objects.length,
    environments: envs,
    sandboxes,
    records_last_30d: byDay, provision_log: log,
  });
});

// ── Activity Report — per environment or global ──────────────────────────────
router.get('/:id/activity-report', (req, res) => {
  ensureCollections();
  const s = getStore();
  const client = (s.clients||[]).find(c=>c.id===req.params.id&&!c.deleted_at);
  if (!client) return res.status(404).json({ error: 'Not found' });

  const days = parseInt(req.query.days) || 30;
  const envFilter = req.query.environment_id || null;
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();

  // Get environments for this client
  const envs = (s.client_environments||[]).filter(e=>e.client_id===client.id&&!e.deleted_at);
  const envIds = envFilter ? new Set([envFilter]) : new Set(envs.map(e=>e.id));
  const allEnvIds = envIds;

  // Load from tenant store if provisioned
  const ts = client.tenant_slug ? loadTenantStore(client.tenant_slug) : s;

  // Activity log entries
  const allActivity = (ts.activity||[]).filter(a => allEnvIds.has(a.environment_id));
  const recentActivity = allActivity.filter(a => a.created_at >= cutoff);

  // Records
  const allRecords = (ts.records||[]).filter(r => allEnvIds.has(r.environment_id) && !r.deleted_at);
  const recentRecords = allRecords.filter(r => r.created_at >= cutoff);

  // Users
  const allUsers = (ts.users||[]).filter(u => {
    if (u.client_id === client.id) return true;
    return u.environment_id && allEnvIds.has(u.environment_id);
  }).filter(u => !u.deleted_at);

  // Objects
  const objects = (ts.objects||[]).filter(o => allEnvIds.has(o.environment_id) && !o.deleted_at);

  // Communications
  const comms = (ts.communications||[]).filter(c => allEnvIds.has(c.environment_id) && c.created_at >= cutoff);

  // Workflows
  const workflows = (ts.workflows||[]).filter(w => allEnvIds.has(w.environment_id) && !w.deleted_at);

  // Interviews
  const interviews = (s.interviews||[]).filter(i => allEnvIds.has(i.environment_id) && i.created_at >= cutoff);

  // Offers
  const offers = (s.offers||[]).filter(o => allEnvIds.has(o.environment_id) && !o.deleted_at);

  // Portal feedback
  const feedback = (s.portal_feedback||[]).filter(f => allEnvIds.has(f.environment_id) && f.created_at >= cutoff);

  // ── Aggregations ──

  // Activity by action type
  const byAction = {};
  recentActivity.forEach(a => { byAction[a.action] = (byAction[a.action]||0) + 1; });

  // Activity by object
  const byObject = {};
  recentActivity.forEach(a => {
    const obj = objects.find(o => o.id === a.object_id);
    const name = obj?.plural_name || obj?.name || 'Unknown';
    if (!byObject[name]) byObject[name] = { name, created:0, updated:0, deleted:0, total:0 };
    byObject[name][a.action] = (byObject[name][a.action]||0) + 1;
    byObject[name].total++;
  });

  // Daily activity trend
  const dailyTrend = [];
  for (let i = days-1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    const dayActivity = recentActivity.filter(a => a.created_at.startsWith(dateStr));
    const dayRecords = recentRecords.filter(r => r.created_at.startsWith(dateStr));
    const dayComms = comms.filter(c => c.created_at.startsWith(dateStr));
    dailyTrend.push({
      date: dateStr,
      activities: dayActivity.length,
      records_created: dayRecords.length,
      communications: dayComms.length,
    });
  }

  // Active users (logged in during period)
  const activeUsers = allUsers.filter(u => u.last_login && u.last_login >= cutoff)
    .map(u => ({
      id: u.id, email: u.email, name: [u.first_name, u.last_name].filter(Boolean).join(' '),
      role: u.role?.name || u.role_name || '—',
      last_login: u.last_login, login_count: u.login_count || 0,
    }))
    .sort((a,b) => (b.last_login||'').localeCompare(a.last_login||''));

  // Recent activity feed (last 50)
  const recentFeed = recentActivity.slice().sort((a,b) => b.created_at.localeCompare(a.created_at)).slice(0,50).map(a => {
    const obj = objects.find(o => o.id === a.object_id);
    const record = allRecords.find(r => r.id === a.record_id);
    const recordName = record?.data?.first_name
      ? [record.data.first_name, record.data.last_name].filter(Boolean).join(' ')
      : record?.data?.job_title || record?.data?.name || record?.data?.pool_name || a.record_id?.slice(0,8);
    return {
      id: a.id, action: a.action, object_name: obj?.name || '—', record_name: recordName,
      actor: a.actor || 'system', created_at: a.created_at,
      changes_summary: a.changes ? Object.keys(a.changes).slice(0,5).join(', ') : null,
    };
  });

  // Per-environment breakdown (if viewing all envs)
  const envBreakdown = envs.map(env => {
    const envActivity = recentActivity.filter(a => a.environment_id === env.id);
    const envRecords = allRecords.filter(r => r.environment_id === env.id);
    const envUsers = allUsers.filter(u => u.environment_id === env.id || u.client_id === client.id);
    return {
      id: env.id, name: env.name, type: env.type || 'production',
      total_records: envRecords.length,
      recent_activity: envActivity.length,
      active_users: envUsers.filter(u => u.last_login && u.last_login >= cutoff).length,
      last_activity: envActivity.length ? envActivity.sort((a,b)=>b.created_at.localeCompare(a.created_at))[0].created_at : null,
    };
  });

  res.json({
    client_id: client.id,
    client_name: client.name,
    period_days: days,
    environment_filter: envFilter,
    summary: {
      total_records: allRecords.length,
      records_created: recentRecords.length,
      total_activity: recentActivity.length,
      active_users: activeUsers.length,
      total_users: allUsers.length,
      total_objects: objects.length,
      total_workflows: workflows.length,
      communications_sent: comms.length,
      interviews_scheduled: interviews.length,
      offers: offers.length,
      feedback_received: feedback.length,
    },
    by_action: byAction,
    by_object: Object.values(byObject).sort((a,b)=>b.total-a.total),
    daily_trend: dailyTrend,
    active_users: activeUsers,
    recent_feed: recentFeed,
    environments: envBreakdown,
  });
});

// ── Global activity report (all clients) ─────────────────────────────────────
router.get('/reports/activity-summary', (req, res) => {
  ensureCollections();
  const s = getStore();
  const days = parseInt(req.query.days) || 30;
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();

  const clients = (s.clients||[]).filter(c=>!c.deleted_at);
  const allActivity = (s.activity||[]).filter(a => a.created_at >= cutoff);
  const allRecords = (s.records||[]).filter(r => !r.deleted_at);
  const allUsers = (s.users||[]).filter(u => !u.deleted_at);

  const clientSummaries = clients.map(c => {
    const envs = (s.client_environments||[]).filter(e=>e.client_id===c.id&&!e.deleted_at);
    const envIds = new Set(envs.map(e=>e.id));
    const activity = allActivity.filter(a => envIds.has(a.environment_id));
    const records = allRecords.filter(r => envIds.has(r.environment_id));
    const users = allUsers.filter(u => u.client_id === c.id);
    const activeUsers = users.filter(u => u.last_login && u.last_login >= cutoff);
    return {
      id: c.id, name: c.name, plan: c.plan, status: c.status,
      total_records: records.length, recent_activity: activity.length,
      total_users: users.length, active_users: activeUsers.length,
      last_activity: activity.length ? activity.sort((a,b)=>b.created_at.localeCompare(a.created_at))[0].created_at : null,
    };
  }).sort((a,b) => b.recent_activity - a.recent_activity);

  res.json({
    period_days: days,
    total_clients: clients.length,
    total_activity: allActivity.length,
    total_records: allRecords.length,
    total_users: allUsers.length,
    clients: clientSummaries,
  });
});

// ── GET /platform-logs — must be BEFORE /:id wildcard ────────────────────────
router.get('/platform-logs', (req, res) => {
  try {
    const { storeCache: sc } = require('../db/init');
    const master = sc['master'];
    if (!master) return res.json({ logs: [], total: 0 });

    let logs = [...(master.platform_logs || [])].reverse();
    const { limit = 200, category, level, search, since } = req.query;
    if (category && category !== 'all') logs = logs.filter(l => l.category === category);
    if (level    && level    !== 'all') logs = logs.filter(l => l.level    === level);
    if (since)  logs = logs.filter(l => l.ts >= since);
    if (search) {
      const q = search.toLowerCase();
      logs = logs.filter(l =>
        l.message?.toLowerCase().includes(q) ||
        l.event?.toLowerCase().includes(q)   ||
        JSON.stringify(l.meta || {}).toLowerCase().includes(q)
      );
    }
    const total = logs.length;
    logs = logs.slice(0, Number(limit));
    res.json({ logs, total });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/platform-logs', (req, res) => {
  try {
    const { storeCache: sc, saveStore } = require('../db/init');
    const master = sc['master'];
    if (master) { master.platform_logs = []; saveStore('master'); }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /purge-test-clients — wipe all test clients + tenant files, keep master data intact
// MUST be before /:id wildcard routes
router.post('/purge-test-clients', (req, res) => {
  const { keep_slugs = [] } = req.body;
  const s = getStore();
  const dataDir = path.join(__dirname, '../../data');
  const clients = s.clients || [];
  const removed = [];
  const kept    = [];

  for (const client of clients) {
    const slug = client.tenant_slug;
    if (keep_slugs.includes(slug)) { kept.push(client); continue; }
    if (slug) {
      const tenantFile = path.join(dataDir, `tenant-${slug}.json`);
      try { if (fs.existsSync(tenantFile)) fs.unlinkSync(tenantFile); } catch(e) { /* ignore */ }
    }
    removed.push(client.name);
  }

  const keptSlugs = new Set(kept.map(c => c.tenant_slug));
  s.clients = kept;
  s.client_environments = (s.client_environments || []).filter(e => kept.find(c => c.id === e.client_id));
  // Also purge orphaned environments stored directly in s.environments (have a client_id)
  s.environments = (s.environments || []).filter(e => !e.client_id || kept.find(c => c.id === e.client_id));
  s.provision_log = (s.provision_log || []).filter(l => keptSlugs.has(l.tenant_slug) || !l.tenant_slug);
  invalidateTenantCache();
  saveStoreNow('master');

  res.json({ removed_count: removed.length, removed, kept: kept.map(c => c.name) });
});

router.get('/:id', (req, res) => {
  ensureCollections();
  const s = getStore();
  const client = (s.clients||[]).find(c=>c.id===req.params.id&&!c.deleted_at);
  if (!client) return res.status(404).json({ error: 'Not found' });
  const envs  = (s.client_environments||[]).filter(e=>e.client_id===client.id&&!e.deleted_at);
  const users = (s.users||[]).filter(u=>u.client_id===client.id&&!u.deleted_at);
  const log   = (s.provision_log||[]).filter(l=>l.client_id===client.id);
  res.json({ ...client, environments: envs, users, provision_log: log });
});

// ── POST /:id/users — create a user for a client ─────────────────────────────
router.post('/:id/users', express.json(), async (req, res) => {
  ensureCollections();
  const s = getStore();
  const client = (s.clients||[]).find(c=>c.id===req.params.id&&!c.deleted_at);
  if (!client) return res.status(404).json({ error: 'Client not found' });

  const { first_name, last_name, email, role_id, environment_id, password } = req.body;
  if (!first_name || !last_name || !email || !role_id || !environment_id) {
    return res.status(400).json({ error: 'first_name, last_name, email, role_id, environment_id required' });
  }
  if ((s.users||[]).find(u=>u.email===email&&!u.deleted_at)) {
    return res.status(409).json({ error: 'Email already in use' });
  }

  const bcrypt = require('bcryptjs');
  const rawPassword = password || `Welcome${Math.floor(Math.random()*9000+1000)}!`;
  const hash = await bcrypt.hash(rawPassword, 10);
  const uid = () => require('crypto').randomUUID();

  if (!s.users) s.users = [];
  const user = {
    id: uid(), client_id: client.id, environment_id,
    first_name, last_name, email,
    role_id, status: 'active',
    password_hash: hash,
    auth_provider: 'local',
    must_change_password: 1,
    login_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  s.users.push(user);
  saveStore();

  // Log provision event
  if (!s.provision_log) s.provision_log = [];
  s.provision_log.push({
    id: uid(), client_id: client.id, action: 'user_created',
    details: { email, first_name, last_name, role_id },
    created_at: new Date().toISOString(),
  });
  saveStore();

  res.status(201).json({ ...user, password_hash: undefined, temp_password: rawPassword });
});

// ── PATCH /:id/users/:userId — update a client user ──────────────────────────
router.patch('/:id/users/:userId', express.json(), (req, res) => {
  ensureCollections();
  const s = getStore();
  const idx = (s.users||[]).findIndex(u=>u.id===req.params.userId&&u.client_id===req.params.id);
  if (idx===-1) return res.status(404).json({ error: 'User not found' });
  const allowed = ['first_name','last_name','role_id','status'];
  allowed.forEach(k => { if (req.body[k]!==undefined) s.users[idx][k]=req.body[k]; });
  s.users[idx].updated_at = new Date().toISOString();
  saveStore();
  res.json(s.users[idx]);
});

// ── GET /:id/error-logs — error logs for this client's environments ───────────
router.get('/:id/error-logs', (req, res) => {
  ensureCollections();
  const s = getStore();
  const client = (s.clients||[]).find(c=>c.id===req.params.id&&!c.deleted_at);
  if (!client) return res.status(404).json({ error: 'Not found' });
  const envIds = new Set((s.client_environments||[]).filter(e=>e.client_id===client.id&&!e.deleted_at).map(e=>e.id));
  const { page=1, limit=50, severity, resolved, search } = req.query;
  let logs = (s.error_logs||[]).filter(l=>envIds.has(l.environment_id));
  if (severity) logs = logs.filter(l=>l.severity===severity);
  if (resolved!==undefined) logs = logs.filter(l=>String(l.resolved)===resolved);
  if (search) { const q=search.toLowerCase(); logs=logs.filter(l=>l.message?.toLowerCase().includes(q)||l.code?.toLowerCase().includes(q)||l.user_email?.toLowerCase().includes(q)); }
  logs = [...logs].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  const total = logs.length;
  const offset = (Number(page)-1)*Number(limit);
  res.json({ logs: logs.slice(offset,offset+Number(limit)), total, page:Number(page) });
});

// ── GET /:id/activity — activity log for this client's environments ───────────
router.get('/:id/activity', (req, res) => {
  ensureCollections();
  const s = getStore();
  const client = (s.clients||[]).find(c=>c.id===req.params.id&&!c.deleted_at);
  if (!client) return res.status(404).json({ error: 'Not found' });
  const envIds = new Set((s.client_environments||[]).filter(e=>e.client_id===client.id&&!e.deleted_at).map(e=>e.id));
  const ts = client.tenant_slug ? loadTenantStore(client.tenant_slug) : s;
  const { page=1, limit=50, search, action } = req.query;
  let logs = [
    ...(ts.activity_log||[]).filter(l=>envIds.has(l.environment_id)),
    ...(s.audit_log||[]).filter(l=>l.user_id&&(s.users||[]).find(u=>u.id===l.user_id&&u.client_id===client.id)),
  ];
  if (action) logs = logs.filter(l=>l.action===action||l.type===action);
  if (search) { const q=search.toLowerCase(); logs=logs.filter(l=>(l.action||l.type||'').toLowerCase().includes(q)||(l.record_name||l.entity_id||'').toLowerCase().includes(q)); }
  logs = [...logs].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  const total = logs.length;
  const offset = (Number(page)-1)*Number(limit);
  res.json({ items: logs.slice(offset,offset+Number(limit)), total, page:Number(page) });
});

router.post('/provision', express.json(), async (req, res) => {
  const { client, environment, admin_user, template } = req.body;
  if (!client?.name)      return res.status(400).json({ error: 'client.name required' });
  if (!admin_user?.email) return res.status(400).json({ error: 'admin_user.email required' });
  ensureCollections();
  const existing = (getStore().clients||[]).find(c=>!c.deleted_at&&c.name.toLowerCase()===client.name.toLowerCase());
  if (existing) return res.status(409).json({ error: `Client "${client.name}" already exists` });
  try {
    res.status(201).json(await provisionClient(client, environment||{}, admin_user, template||'core_recruitment'));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', (req, res) => {
  ensureCollections();
  const s = getStore(); const now = new Date().toISOString();
  const client = { id: uuidv4(), ...req.body, status: req.body.status||'active', created_at: now, updated_at: now, deleted_at: null };
  s.clients.push(client); saveStore(); res.status(201).json(client);
});

router.patch('/:id/status', (req, res) => {
  ensureCollections();
  const s = getStore(); const idx = (s.clients||[]).findIndex(c=>c.id===req.params.id);
  if (idx===-1) return res.status(404).json({ error: 'Not found' });
  s.clients[idx].status = req.body.status; s.clients[idx].updated_at = new Date().toISOString();
  saveStore(); res.json(s.clients[idx]);
});

router.patch('/:id', (req, res) => {
  ensureCollections();
  const s = getStore(); const idx = (s.clients||[]).findIndex(c=>c.id===req.params.id);
  if (idx===-1) return res.status(404).json({ error: 'Not found' });
  s.clients[idx] = { ...s.clients[idx], ...req.body, updated_at: new Date().toISOString() };
  saveStore(); res.json(s.clients[idx]);
});

router.delete('/:id', (req, res) => {
  ensureCollections();
  const s = getStore();
  const idx = (s.clients||[]).findIndex(c=>c.id===req.params.id);
  if (idx===-1) return res.status(404).json({ error: 'Not found' });

  const client = s.clients[idx];
  const tenantSlug = client.tenant_slug;

  // Soft-delete the client record
  s.clients[idx].deleted_at = new Date().toISOString();
  s.clients[idx].status = 'churned';
  saveStore();

  // Hard-delete the tenant JSON file from the Volume so the slug can be reused clean
  if (tenantSlug) {
    const { tenantDbPath } = require('../db/init');
    const fs = require('fs');
    const filePath = tenantDbPath(tenantSlug);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑  Deleted tenant file: ${filePath}`);
      }
      // Also evict from memory cache
      const { storeCache } = require('../db/init');
      delete storeCache[tenantSlug];
    } catch(e) {
      console.error(`⚠️  Could not delete tenant file for ${tenantSlug}:`, e.message);
    }
  }

  res.json({ deleted: true, tenant_file_removed: !!tenantSlug });
});

router.get('/:clientId/environments', (req, res) => {
  ensureCollections();
  const s = getStore();
  const envs = (s.client_environments||[]).filter(e=>e.client_id===req.params.clientId&&!e.deleted_at);
  res.json(envs.map(e => {
    const records = (s.records||[]).filter(r=>r.environment_id===e.id&&!r.deleted_at);
    const objects = (s.objects||[]).filter(o=>o.environment_id===e.id&&!o.deleted_at);
    const users   = (s.users||[]).filter(u=>u.environment_id===e.id&&!u.deleted_at);
    return { ...e, record_count: records.length, object_count: objects.length, user_count: users.length };
  }));
});

router.patch('/:clientId/environments/:envId/status', (req, res) => {
  ensureCollections();
  const s = getStore();
  const idx = (s.client_environments||[]).findIndex(e=>e.id===req.params.envId);
  if (idx===-1) return res.status(404).json({ error: 'Not found' });
  s.client_environments[idx].status = req.body.status;
  s.client_environments[idx].updated_at = new Date().toISOString();
  const mainIdx = (s.environments||[]).findIndex(e=>e.id===req.params.envId);
  if (mainIdx!==-1) s.environments[mainIdx].status = req.body.status;
  saveStore(); res.json(s.client_environments[idx]);
});

// ── Delete an environment ─────────────────────────────────────────────────────
// DELETE /api/superadmin/clients/:clientId/environments/:envId
// Soft-deletes the environment and wipes all its data. Requires ?confirm=yes.
router.delete('/:clientId/environments/:envId', (req, res) => {
  if (req.query.confirm !== 'yes') {
    return res.status(400).json({ error: 'Pass ?confirm=yes to confirm deletion' });
  }
  ensureCollections();
  const { clientId, envId } = req.params;
  const s = getStore();

  const client = (s.clients||[]).find(c => c.id === clientId && !c.deleted_at);
  if (!client) return res.status(404).json({ error: 'Client not found' });

  const envIdx = (s.client_environments||[]).findIndex(
    e => e.id === envId && e.client_id === clientId && !e.deleted_at
  );
  if (envIdx === -1) return res.status(404).json({ error: 'Environment not found' });

  const env = s.client_environments[envIdx];
  const tenantSlug = client.tenant_slug;
  const now = new Date().toISOString();

  // Soft-delete in master store
  s.client_environments[envIdx].deleted_at = now;
  s.client_environments[envIdx].status = 'deleted';
  const masterEnvIdx = (s.environments||[]).findIndex(e => e.id === envId);
  if (masterEnvIdx !== -1) s.environments[masterEnvIdx].deleted_at = now;

  // Wipe all data for this environment from the tenant store
  const removedCounts = {};
  if (tenantSlug) {
    try {
      const ts = loadTenantStore(tenantSlug);
      const COLLECTIONS = [
        'records','people_links','workflows','record_workflow_assignments',
        'pools','notes','communications','attachments','interviews',
        'offers','forms','form_responses','activity_log','saved_views',
        'objects','fields','roles','permissions',
      ];
      COLLECTIONS.forEach(col => {
        if (!ts[col]) return;
        const before = ts[col].length;
        ts[col] = ts[col].filter(item => item.environment_id !== envId);
        if (before !== ts[col].length) removedCounts[col] = before - ts[col].length;
      });
      // Remove from tenant environments list too
      if (ts.environments) ts.environments = ts.environments.filter(e => e.id !== envId);
      saveStoreNow(tenantSlug);
    } catch (err) {
      console.error('[env-delete] tenant store wipe error:', err.message);
    }
  }

  // Audit log
  if (!s.provision_log) s.provision_log = [];
  s.provision_log.push({
    id: uuidv4(), client_id: clientId, environment_id: envId,
    action: 'delete_environment',
    details: `Deleted environment "${env.name}" (${envId}). Removed: ${JSON.stringify(removedCounts)}`,
    performed_by: 'superadmin', created_at: now,
  });

  saveStore();
  res.json({ deleted: true, environment_id: envId, environment_name: env.name, removed: removedCounts });
});

// ─── Load test data into an environment ──────────────────────────────────────
router.post('/load-test-data', async (req, res) => {
  const { environment_id, tenant_slug } = req.body;
  if (!environment_id) return res.status(400).json({ error: 'environment_id required' });

  // Run within the correct tenant context so getStore() returns the right store
  const slug = tenant_slug || 'master';
  if (slug !== 'master') loadTenantStore(slug);

  await tenantStorage.run(slug, async () => {
    const s = getStore();
    const env = (s.environments||[]).find(e => e.id === environment_id);
    if (!env) return res.status(404).json({ error: 'Environment not found' });
    try {
      const loadTestData = require('../data/test_data_seed');
      const results = await loadTestData(environment_id);
      s.provision_log = s.provision_log || [];
      s.provision_log.push({ id: uuidv4(), environment_id, action: 'load_test_data', details: `Loaded: ${results.people} people, ${results.jobs} jobs, ${results.pools} pools`, performed_by: 'superadmin', created_at: new Date().toISOString() });
      saveStore();
      res.json({ success: true, ...results });
    } catch (err) {
      console.error('Load test data error:', err);
      res.status(500).json({ error: err.message });
    }
  });
});


// ── Clear all records for an environment ─────────────────────────────────────
// DELETE /api/superadmin/clients/:id/environments/:envId/records
// Deletes ALL records (and related data) in the environment. Irreversible.
router.delete('/:clientId/environments/:envId/records', (req, res) => {
  ensureCollections();
  const { clientId, envId } = req.params;
  const { confirm } = req.query; // require ?confirm=yes as safety gate
  if (confirm !== 'yes') {
    return res.status(400).json({ error: 'Add ?confirm=yes to confirm this destructive action' });
  }
  const s = getStore();
  const client = (s.clients||[]).find(c=>c.id===clientId&&!c.deleted_at);
  if (!client) return res.status(404).json({ error: 'Client not found' });

  // Find which store to operate on
  const tenantSlug = client.tenant_slug;
  const store = tenantSlug ? loadTenantStore(tenantSlug) : s;

  // Tables to clear for this environment
  const CLEARABLE = [
    'records','notes','communications','interviews','offers',
    'attachments','people_links','record_workflow_assignments',
    'activity','activity_log','form_responses',
  ];

  const counts = {};
  CLEARABLE.forEach(table => {
    if (!store[table]) return;
    const before = store[table].length;
    store[table] = store[table].filter(r => r.environment_id !== envId);
    counts[table] = before - store[table].length;
  });

  const totalRemoved = Object.values(counts).reduce((a,b)=>a+b, 0);
  saveStore(tenantSlug);

  // Log it
  s.provision_log = s.provision_log || [];
  s.provision_log.push({
    id: uuidv4(), client_id: clientId, environment_id: envId,
    action: 'clear_all_records',
    details: `Deleted ${totalRemoved} records across ${Object.keys(counts).filter(k=>counts[k]>0).join(', ')}`,
    performed_by: 'superadmin', created_at: new Date().toISOString(),
  });
  saveStore();

  res.json({ success: true, total_removed: totalRemoved, breakdown: counts });
});

// ── Clear ALL records across ALL environments for a client ────────────────────
// DELETE /api/superadmin/clients/:id/records
router.delete('/:clientId/records', (req, res) => {
  ensureCollections();
  const { confirm } = req.query;
  if (confirm !== 'yes') {
    return res.status(400).json({ error: 'Add ?confirm=yes to confirm this destructive action' });
  }
  const s = getStore();
  const client = (s.clients||[]).find(c=>c.id===req.params.clientId&&!c.deleted_at);
  if (!client) return res.status(404).json({ error: 'Client not found' });

  const tenantSlug = client.tenant_slug;
  const store = tenantSlug ? loadTenantStore(tenantSlug) : s;

  const CLEARABLE = [
    'records','notes','communications','interviews','offers',
    'attachments','people_links','record_workflow_assignments',
    'activity','activity_log','form_responses',
  ];

  let totalRemoved = 0;
  CLEARABLE.forEach(table => {
    if (!store[table]) return;
    totalRemoved += store[table].length;
    store[table] = [];
  });

  saveStore(tenantSlug);

  s.provision_log = s.provision_log || [];
  s.provision_log.push({
    id: uuidv4(), client_id: client.id,
    action: 'clear_all_records_all_environments',
    details: `Deleted all ${totalRemoved} records across all environments`,
    performed_by: 'superadmin', created_at: new Date().toISOString(),
  });
  saveStore();

  res.json({ success: true, total_removed: totalRemoved });
});

// ── Impersonation — generate a short-lived token to log in as a client admin ─
// Token lives in master store for 5 minutes, single-use.
router.post('/:id/impersonate', (req, res) => {
  ensureCollections();
  const s = getStore();
  const client = (s.clients||[]).find(c => c.id === req.params.id && !c.deleted_at);
  if (!client) return res.status(404).json({ error: 'Client not found' });
  if (!client.tenant_slug) return res.status(400).json({ error: 'Client has no tenant slug — re-provision to fix' });

  // Find the admin user in the tenant store
  const ts = loadTenantStore(client.tenant_slug);
  const adminUser = (ts.users||[]).find(u =>
    !u.deleted_at && u.status === 'active' &&
    (u.is_super_admin || (()=>{ const r=(ts.roles||[]).find(r=>r.id===u.role_id); return r?.slug==='super_admin'||r?.slug==='admin'; })())
  ) || (ts.users||[])[0];

  if (!adminUser) return res.status(400).json({ error: 'No admin user found in tenant — seed demo data first' });

  // Generate a single-use token
  const token = require('crypto').randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min

  if (!s.impersonation_tokens) s.impersonation_tokens = [];
  // Purge expired tokens
  s.impersonation_tokens = s.impersonation_tokens.filter(t => t.expires_at > new Date().toISOString());
  s.impersonation_tokens.push({
    token, client_id: client.id, tenant_slug: client.tenant_slug,
    user_id: adminUser.id, expires_at: expiresAt, used: false,
  });
  saveStore();

  const appUrl = `https://${client.tenant_slug}.vercentic.com/?impersonate=${token}`;
  res.json({ token, app_url: appUrl, expires_at: expiresAt, user_email: adminUser.email });
});


// GET /:id/roles — fetch roles from the client's tenant store
router.get('/:id/roles', (req, res) => {
  ensureCollections();
  const s = getStore();
  const client = (s.clients||[]).find(c => c.id === req.params.id);
  if (!client) return res.status(404).json({ error: 'Client not found' });
  
  const tenantSlug = client.tenant_slug;
  if (!tenantSlug) return res.json([]);
  
  // Read from the tenant store
  const tenantFile = path.join(__dirname, '../../data', `tenant-${tenantSlug}.json`);
  if (!fs.existsSync(tenantFile)) return res.json([]);
  
  try {
    const tenantData = JSON.parse(fs.readFileSync(tenantFile, 'utf8'));
    const roles = (tenantData.roles || []).filter(r => !r.deleted_at);
    res.json(roles);
  } catch (e) {
    res.json([]);
  }
});

// GET /:id/environments-with-roles — fetch environments from tenant store
router.get('/:id/environments-with-roles', (req, res) => {
  ensureCollections();
  const s = getStore();
  const client = (s.clients||[]).find(c => c.id === req.params.id);
  if (!client) return res.status(404).json({ error: 'Client not found' });
  
  const tenantSlug = client.tenant_slug;
  if (!tenantSlug) return res.json({ environments: [], roles: [] });
  
  const tenantFile = path.join(__dirname, '../../data', `tenant-${tenantSlug}.json`);
  if (!fs.existsSync(tenantFile)) return res.json({ environments: [], roles: [] });
  
  try {
    const tenantData = JSON.parse(fs.readFileSync(tenantFile, 'utf8'));
    const environments = (tenantData.environments || []).filter(e => !e.deleted_at);
    const roles        = (tenantData.roles || []).filter(r => !r.deleted_at);
    res.json({ environments, roles });
  } catch (e) {
    res.json({ environments: [], roles: [] });
  }
});


// ── POST /:id/repair-users — seed admin user into tenant store if missing ─────
// Used to fix tenants where signup completed but user was not written to tenant store.
router.post('/:id/repair-users', express.json(), async (req, res) => {
  ensureCollections();
  const s = getStore();
  const client = (s.clients||[]).find(c => c.id === req.params.id && !c.deleted_at);
  if (!client) return res.status(404).json({ error: 'Client not found' });

  const { email, password, first_name, last_name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const tenantSlug = client.tenant_slug;
  const ts = loadTenantStore(tenantSlug);

  // Check if user already exists — if so, update the password hash
  const existingIdx = (ts.users||[]).findIndex(u => u.email === email.toLowerCase() && !u.deleted_at);
  if (existingIdx >= 0) {
    const existing = ts.users[existingIdx];
    // Always reset password so admin can recover access
    const cryp = require('crypto');
    const salt2 = cryp.randomBytes(16).toString('hex');
    const hash2 = cryp.createHash('sha256').update(password + salt2).digest('hex');
    ts.users[existingIdx] = { ...existing, password_hash: `${salt2}:${hash2}`, must_change_password: 0, updated_at: new Date().toISOString() };
    saveStoreNow(tenantSlug);
    return res.json({ ok: true, message: 'User password updated', user_id: existing.id });
  }

  // Get environment id
  const env = (ts.environments||[])[0] || (s.environments||[]).find(e => e.tenant_slug === tenantSlug);
  if (!env) return res.status(400).json({ error: 'No environment found for tenant' });

  // Get or create super_admin role
  let saRole = (ts.roles||[]).find(r => r.slug === 'super_admin');
  if (!saRole) {
    saRole = { id: require('crypto').randomUUID(), name: 'Super Admin', slug: 'super_admin', color: '#6941C6', is_system: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    if (!ts.roles) ts.roles = [];
    ts.roles.push(saRole);
  }

  const crypto = require('crypto');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(password + salt).digest('hex');
  const userId = crypto.randomUUID();

  const user = {
    id: userId,
    environment_id: env.id,
    client_id: client.id,
    first_name: first_name || 'Admin',
    last_name:  last_name  || '',
    email:      email.toLowerCase(),
    password_hash: `${salt}:${hash}`,
    role_id:    saRole.id,
    role_name:  'Super Admin',
    status:     'active',
    is_super_admin: true,
    must_change_password: 0,
    mfa_enabled: 0,
    login_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };

  if (!ts.users) ts.users = [];
  ts.users.push(user);
  saveStoreNow(tenantSlug);

  // Also register in master client_users
  if (!s.client_users) s.client_users = [];
  if (!s.client_users.find(u => u.email === email.toLowerCase() && u.tenant_slug === tenantSlug)) {
    s.client_users.push({ id: userId, client_id: client.id, tenant_slug: tenantSlug, environment_id: env.id, first_name: first_name||'Admin', last_name: last_name||'', email: email.toLowerCase(), role_name: 'Super Admin', status: 'active', source: 'repair', created_at: new Date().toISOString() });
    saveStore('master');
  }

  res.json({ ok: true, user_id: userId, environment_id: env.id, tenant_slug: tenantSlug });
});

// ── POST /:id/seed-objects — seed full template into existing tenant (repair empty tenants) ──
router.post('/:id/seed-objects', express.json(), async (req, res) => {
  ensureCollections();
  const s = getStore();
  const client = (s.clients||[]).find(c => c.id === req.params.id && !c.deleted_at);
  if (!client) return res.status(404).json({ error: 'Client not found' });

  const { template_key = 'core_recruitment', force = false } = req.body;
  const tenantSlug = client.tenant_slug;
  if (!tenantSlug) return res.status(400).json({ error: 'Client has no tenant slug' });

  const ts = loadTenantStore(tenantSlug);

  // Check if tenant already has objects (unless force=true)
  if (!force && (ts.objects||[]).length > 0) {
    return res.json({ ok: true, message: `Tenant already has ${ts.objects.length} objects — pass force:true to reseed`, objects: ts.objects.length });
  }

  // Find environment
  const env = (ts.environments||[])[0];
  if (!env) return res.status(400).json({ error: 'No environment in tenant store' });

  // Resolve template (TEMPLATES is defined at the top of this file)
  const tpl = TEMPLATES?.[template_key] || TEMPLATES?.['core_recruitment'];
  if (!tpl) return res.status(400).json({ error: 'Unknown template: ' + template_key });

  const now = new Date().toISOString();
  const createdObjects = [];
  const createdFields = [];

  // Use the same object/field seeding logic as the main provision function
  let templateObjects = JSON.parse(JSON.stringify(tpl.objects || []));
  if (tpl.extra_objects) templateObjects = [...templateObjects, ...tpl.extra_objects];

  await tenantStorage.run(tenantSlug, async () => {
    const store = getStore();
    if (!store.objects) store.objects = [];
    if (!store.fields)  store.fields  = [];
    if (!store.roles)   store.roles   = [];

    // When force=true, wipe ALL existing objects + fields for this environment first
    if (force) {
      store.objects = (store.objects||[]).filter(o => o.environment_id !== env.id);
      store.fields  = (store.fields ||[]).filter(f => f.environment_id !== env.id);
    }

    // Seed objects + fields
    templateObjects.forEach((obj, idx) => {
      const objId = uuidv4();
      const objRecord = {
        id: objId, environment_id: env.id,
        name: obj.name, plural_name: obj.plural_name||obj.name+'s',
        slug: obj.slug, icon: obj.icon||'circle', color: obj.color||'#6941C6',
        is_system: 1, sort_order: idx,
        relationships_enabled: 0,
        person_type_options: obj.slug==='people' ? ['Employee','Contractor','Consultant','Candidate','Contact'] : null,
        created_at: now, updated_at: now, deleted_at: null,
      };
      store.objects.push(objRecord);
      createdObjects.push(objRecord);

      (obj.fields||[]).forEach((f, fi) => {
        const fieldRecord = {
          id: uuidv4(), object_id: objId, environment_id: env.id,
          name: f.name, api_key: f.api_key||f.name.toLowerCase().replace(/\s+/g,'_'),
          field_type: f.field_type||'text',
          is_required: f.is_required||0, is_unique: f.is_unique||0,
          is_system: 1,
          show_in_list: f.show_in_list!==undefined ? (f.show_in_list ? 1 : 0) : 1,
          show_in_form: 1,
          sort_order: fi, options: f.options||null,
          condition_field: f.condition_field||null, condition_value: f.condition_value||null,
          section_label: f.section_label||null, collapsible: f.collapsible!==false ? 1 : 0,
          as_panel: f.as_panel ? 1 : 0,
          related_object_slug: f.related_object_slug||null,
          people_multi: f.people_multi!==undefined ? f.people_multi : null,
          created_at: now, updated_at: now,
        };
        store.fields.push(fieldRecord);
        createdFields.push(fieldRecord);
      });
    });

    // Seed default roles if missing
    if (store.roles.length === 0) {
      ['Super Admin','Admin','Recruiter','Hiring Manager','Read Only'].forEach((name, i) => {
        const slug = name.toLowerCase().replace(/\s+/g,'_');
        store.roles.push({ id: uuidv4(), name, slug, color: ['#6941C6','#3B82F6','#059669','#F59E0B','#9CA3AF'][i], is_system: 1, created_at: now, updated_at: now });
      });
    }

    saveStoreNow(tenantSlug);
  });

  // Apply starter config (workflows, email templates, stage categories, etc.)
  try {
    await applyStarterConfig(tenantSlug, env, createdObjects, { name: client.name });
  } catch(e) {
    console.warn('[seed-objects] starter config error (non-fatal):', e.message);
  }

  res.json({
    ok: true,
    objects_created: createdObjects.length,
    fields_created: createdFields.length,
    objects: createdObjects.map(o => ({ id: o.id, slug: o.slug, name: o.name })),
  });
});

module.exports = router;
module.exports.buildTemplate = buildTemplate;
// ── Template Environments ────────────────────────────────────────────────────

// GET /api/superadmin/templates — list all template environments across all tenants
router.get('/templates', (req, res) => {
  try {
    const s = getStore();
    const templates = (s.client_environments||[])
      .filter(e => e.is_template && !e.deleted_at)
      .map(e => {
        const client = (s.clients||[]).find(c=>c.id===e.client_id)||{};
        // Count config items in tenant store
        const ts = getTenantStore(client.tenant_slug||'');
        const objCount   = (ts.object_definitions||ts.objects||[]).filter(o=>o.environment_id===e.id&&!o.deleted_at).length;
        const fieldCount = (ts.fields||[]).filter(f=>f.environment_id===e.id&&!f.deleted_at).length;
        const wfCount    = (ts.workflows||[]).filter(w=>w.environment_id===e.id&&!w.deleted_at).length;
        return {
          ...e,
          client_name:   client.name,
          tenant_slug:   client.tenant_slug,
          object_count:  objCount,
          field_count:   fieldCount,
          workflow_count: wfCount,
        };
      });
    res.json(templates);
  } catch(e) { res.status(500).json({error:e.message}); }
});

// POST /api/superadmin/environments/:id/flag-template — mark/unmark an env as a template
router.post('/environments/:id/flag-template', express.json(), (req, res) => {
  try {
    const s = getStore();
    const env = (s.client_environments||[]).find(e=>e.id===req.params.id);
    if (!env) return res.status(404).json({error:'Environment not found'});
    env.is_template     = req.body.is_template !== false;
    env.template_name   = req.body.template_name || env.name;
    env.template_desc   = req.body.template_desc || '';
    env.template_tags   = req.body.template_tags || [];
    env.updated_at      = new Date().toISOString();
    saveStoreNow('master');
    res.json(env);
  } catch(e) { res.status(500).json({error:e.message}); }
});

// POST /api/superadmin/clients/:id/provision-from-template — provision new client from template env
router.post('/:id/provision-from-template', express.json(), async (req, res) => {
  try {
    const s = getStore();
    const { template_env_id, admin_user, environment: envData } = req.body;
    const client = (s.clients||[]).find(c=>c.id===req.params.id);
    if (!client) return res.status(404).json({error:'Client not found'});

    const templateEnv = (s.client_environments||[]).find(e=>e.id===template_env_id&&e.is_template);
    if (!templateEnv) return res.status(404).json({error:'Template environment not found'});

    const templateClient = (s.clients||[]).find(c=>c.id===templateEnv.client_id);
    if (!templateClient) return res.status(404).json({error:'Template client not found'});

    // Create the new environment
    const now = new Date().toISOString();
    const newEnv = {
      id: uuidv4(), client_id: client.id,
      name: envData?.name || `${client.name} Production`,
      type: envData?.type||'production', locale: envData?.locale||'en',
      timezone: envData?.timezone||'UTC', is_default: 0, status: 'active',
      source_template_id: template_env_id,
      created_at: now, updated_at: now, deleted_at: null,
    };
    s.client_environments.push(newEnv);
    saveStoreNow('master');

    // Copy config from template tenant store to new tenant store
    const result = await copyEnvConfig(
      templateClient.tenant_slug, templateEnv.id,
      client.tenant_slug,         newEnv.id,
      { admin_user }
    );

    res.json({ ok: true, environment: newEnv, ...result });
  } catch(e) { console.error('[provision-from-template]', e); res.status(500).json({error:e.message}); }
});

// POST /api/superadmin/copy-config — copy config between any two environments
router.post('/copy-config', express.json(), async (req, res) => {
  try {
    const { from_env_id, to_env_id } = req.body;
    const s = getStore();
    const fromEnv = (s.client_environments||[]).find(e=>e.id===from_env_id);
    const toEnv   = (s.client_environments||[]).find(e=>e.id===to_env_id);
    if (!fromEnv) return res.status(404).json({error:'Source environment not found'});
    if (!toEnv)   return res.status(404).json({error:'Target environment not found'});
    const fromClient = (s.clients||[]).find(c=>c.id===fromEnv.client_id);
    const toClient   = (s.clients||[]).find(c=>c.id===toEnv.client_id);
    if (!fromClient||!toClient) return res.status(404).json({error:'Client not found'});
    const result = await copyEnvConfig(fromClient.tenant_slug, from_env_id, toClient.tenant_slug, to_env_id, {});
    res.json({ ok: true, ...result });
  } catch(e) { res.status(500).json({error:e.message}); }
});

// ── Core config-copy function ────────────────────────────────────────────────
async function copyEnvConfig(fromSlug, fromEnvId, toSlug, toEnvId, opts={}) {
  const now = new Date().toISOString();
  const uid = () => uuidv4();
  const { loadTenantStore, tenantDbPath, tenantStorage, storeCache } = require('../db/init');
  const fs = require('fs');
  const path = require('path');

  // Load source tenant store
  loadTenantStore(fromSlug);
  const fromTs = storeCache[fromSlug];

  // Load or provision target tenant store
  if (!storeCache[toSlug]) loadTenantStore(toSlug);
  const toTs = storeCache[toSlug];

  ensureTenantCollections(toTs);

  // Wipe existing config in target env (not records)
  const CONFIG_TABLES = ['object_definitions','objects','fields','workflows','workflow_steps',
    'email_templates','stage_categories','portals','panel_layouts','forms','scorecard_templates',
    'interview_types','lists','saved_views'];
  for (const tbl of CONFIG_TABLES) {
    if (toTs[tbl]) toTs[tbl] = toTs[tbl].filter(r => r.environment_id !== toEnvId);
  }

  // Build an id-remap table so all cross-references are updated
  const idMap = {};
  const remap = oldId => idMap[oldId] || oldId;
  const newId = oldId => { const n = uid(); idMap[oldId] = n; return n; };

  // ── 1. Objects ──────────────────────────────────────────────────────────────
  const srcObjs = (fromTs.object_definitions||fromTs.objects||[])
    .filter(o => o.environment_id===fromEnvId && !o.deleted_at);
  const createdObjects = [];
  for (const obj of srcObjs) {
    const nid = newId(obj.id);
    const copy = { ...obj, id: nid, environment_id: toEnvId, created_at: now, updated_at: now };
    const tbl = toTs.object_definitions ? 'object_definitions' : 'objects';
    if (!toTs[tbl]) toTs[tbl] = [];
    toTs[tbl].push(copy);
    createdObjects.push(copy);
  }

  // ── 2. Fields ────────────────────────────────────────────────────────────────
  const srcFields = (fromTs.fields||[]).filter(f => f.environment_id===fromEnvId && !f.deleted_at);
  for (const f of srcFields) {
    const nid = newId(f.id);
    const copy = { ...f, id: nid, environment_id: toEnvId, object_id: remap(f.object_id), created_at: now, updated_at: now };
    if (!toTs.fields) toTs.fields = [];
    toTs.fields.push(copy);
  }

  // ── 3. Workflows ─────────────────────────────────────────────────────────────
  const srcWfs = (fromTs.workflows||[]).filter(w => w.environment_id===fromEnvId && !w.deleted_at);
  for (const wf of srcWfs) {
    const nid = newId(wf.id);
    const copy = { ...wf, id: nid, environment_id: toEnvId, object_id: remap(wf.object_id), created_at: now, updated_at: now };
    if (!toTs.workflows) toTs.workflows = [];
    toTs.workflows.push(copy);
  }
  // Workflow steps
  const srcSteps = (fromTs.workflow_steps||[]).filter(s => {
    const wf = srcWfs.find(w=>w.id===s.workflow_id);
    return !!wf;
  });
  for (const step of srcSteps) {
    const nid = newId(step.id);
    const copy = { ...step, id: nid, workflow_id: remap(step.workflow_id), created_at: now, updated_at: now };
    if (!toTs.workflow_steps) toTs.workflow_steps = [];
    toTs.workflow_steps.push(copy);
  }

  // ── 4. Stage categories ──────────────────────────────────────────────────────
  const srcCats = (fromTs.stage_categories||[]).filter(c => c.environment_id===fromEnvId && !c.deleted_at);
  for (const cat of srcCats) {
    const nid = newId(cat.id);
    const copy = { ...cat, id: nid, environment_id: toEnvId, created_at: now, updated_at: now };
    if (!toTs.stage_categories) toTs.stage_categories = [];
    toTs.stage_categories.push(copy);
  }

  // ── 5. Email templates ───────────────────────────────────────────────────────
  const srcEmails = (fromTs.email_templates||[]).filter(e => e.environment_id===fromEnvId && !e.deleted_at);
  for (const tmpl of srcEmails) {
    const nid = newId(tmpl.id);
    const copy = { ...tmpl, id: nid, environment_id: toEnvId, created_at: now, updated_at: now };
    if (!toTs.email_templates) toTs.email_templates = [];
    toTs.email_templates.push(copy);
  }

  // ── 6. Portals (config only, no portal analytics/feedback) ──────────────────
  const srcPortals = (fromTs.portals||[]).filter(p => p.environment_id===fromEnvId && !p.deleted_at);
  for (const portal of srcPortals) {
    const nid = newId(portal.id);
    const copy = { ...portal, id: nid, environment_id: toEnvId, slug: portal.slug+'-'+toEnvId.slice(0,4), status:'draft', created_at: now, updated_at: now };
    if (!toTs.portals) toTs.portals = [];
    toTs.portals.push(copy);
  }

  // ── 7. Panel layouts ─────────────────────────────────────────────────────────
  const srcLayouts = (fromTs.panel_layouts||[]).filter(l => l.environment_id===fromEnvId);
  for (const layout of srcLayouts) {
    const nid = newId(layout.id);
    const copy = { ...layout, id: nid, environment_id: toEnvId, created_at: now, updated_at: now };
    if (!toTs.panel_layouts) toTs.panel_layouts = [];
    toTs.panel_layouts.push(copy);
  }

  // ── 8. Forms & scorecard templates ──────────────────────────────────────────
  for (const tbl of ['forms','scorecard_templates','interview_types']) {
    const srcItems = (fromTs[tbl]||[]).filter(i => i.environment_id===fromEnvId && !i.deleted_at);
    for (const item of srcItems) {
      const nid = newId(item.id);
      const copy = { ...item, id: nid, environment_id: toEnvId, created_at: now, updated_at: now };
      if (!toTs[tbl]) toTs[tbl] = [];
      toTs[tbl].push(copy);
    }
  }

  // ── 9. Admin user (if provided) ──────────────────────────────────────────────
  let adminResult = null;
  if (opts.admin_user) {
    const { email, first_name, last_name, password } = opts.admin_user;
    if (email && password) {
      const bcrypt = require('bcryptjs');
      const saltRounds = 10;
      const hash = bcrypt.hashSync(password, saltRounds);
      const roles = (toTs.roles||[]);
      const adminRole = roles.find(r=>r.slug==='super_admin')||roles.find(r=>r.slug==='admin')||roles[0];
      const user = {
        id: uid(), email, first_name: first_name||'Admin', last_name: last_name||'User',
        role_id: adminRole?.id||null, status:'active', auth_provider:'local',
        password_hash: hash, must_change_password: 0,
        created_at: now, updated_at: now,
      };
      if (!toTs.users) toTs.users = [];
      toTs.users.push(user);
      adminResult = { email, id: user.id };
    }
  }

  // Persist target store
  const { tenantDbPath: tdbPath } = require('../db/init');
  const fs2 = require('fs');
  try {
    fs2.writeFileSync(tdbPath(toSlug), JSON.stringify(toTs, null, 2));
    console.log('[copyEnvConfig] Saved tenant store for', toSlug);
  } catch(e) { console.error('[copyEnvConfig] Save error:', e.message); }

  return {
    objects:         createdObjects.length,
    fields:          srcFields.length,
    workflows:       srcWfs.length,
    stage_categories: srcCats.length,
    email_templates: srcEmails.length,
    portals:         srcPortals.length,
    panel_layouts:   srcLayouts.length,
    admin:           adminResult,
  };
}

function ensureTenantCollections(ts) {
  const cols = ['object_definitions','objects','fields','workflows','workflow_steps',
    'email_templates','stage_categories','portals','panel_layouts','forms',
    'scorecard_templates','interview_types','roles','users','records','people_links',
    'communications','notes','attachments','activity_log','lists','saved_views'];
  for (const c of cols) { if (!ts[c]) ts[c] = []; }
}
