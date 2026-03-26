#!/usr/bin/env node
// Seed 60 days of demo AI usage data
const path = require('path');
const { insert, getStore } = require(path.join(__dirname, 'server/db/init'));

const store = getStore();
const existing = (store.ai_usage_log || []).length;
if (existing > 0) {
  console.log(`Already have ${existing} AI log entries — skipping (delete ai_usage_log from talentos.json to reseed)`);
  process.exit(0);
}

const users = (store.users || []).slice(0, 6);
if (!users.length) { console.log('No users found'); process.exit(1); }
console.log(`Seeding AI usage for ${users.length} users: ${users.map(u=>u.first_name||u.email).join(', ')}`);

const FEATURES = [
  { f:'copilot',            w:8, ti:[300,1800], to:[100,600]  },
  { f:'cv_parse',           w:4, ti:[800,2500], to:[200,700]  },
  { f:'job_match',          w:3, ti:[500,1200], to:[100,300]  },
  { f:'translation',        w:2, ti:[1000,4000],to:[800,3500] },
  { f:'doc_extract',        w:2, ti:[600,2000], to:[150,500]  },
  { f:'interview_schedule', w:2, ti:[300,900],  to:[100,300]  },
  { f:'offer_create',       w:1, ti:[400,1000], to:[150,400]  },
  { f:'jd_generate',        w:1, ti:[200,600],  to:[400,1200] },
];
const weighted = FEATURES.flatMap(f => Array(f.w).fill(f));
const rnd = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const pick = a => a[Math.floor(Math.random()*a.length)];
const now = Date.now();
let count = 0;

for (let d = 60; d >= 0; d--) {
  const base = now - d*86400000;
  const n = d>45?rnd(0,3): d>30?rnd(1,6): d>14?rnd(3,10): rnd(5,16);
  for (let i=0; i<n; i++) {
    const user = pick(users);
    const feat = pick(weighted);
    insert('ai_usage_log', {
      user_id:        user.id,
      user_name:      `${user.first_name||''} ${user.last_name||''}`.trim()||user.email,
      user_email:     user.email,
      feature:        feat.f,
      tokens_in:      rnd(...feat.ti),
      tokens_out:     rnd(...feat.to),
      model:          'claude-sonnet-4-6',
      environment_id: user.environment_id||'',
      created_at:     new Date(base+rnd(0,82800000)).toISOString(),
    });
    count++;
  }
}
console.log(`✅ Seeded ${count} AI usage records across 60 days`);
