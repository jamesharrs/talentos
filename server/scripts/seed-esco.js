// server/scripts/seed-esco.js — Seeds ESCO skills into ontology
// Run: cd server && node scripts/seed-esco.js
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const DATA_DIR = process.env.DATA_PATH || path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'talentos.json');
const store = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const ESCO = require('../data/esco_skills');
const envs = store.environments || [];
if (!envs.length) { console.log('No environments'); process.exit(1); }
if (!store.skills) store.skills = [];
const ts = new Date().toISOString();
let totalAdded = 0;
envs.forEach(env => {
  const existing = store.skills.filter(s => s.environment_id === env.id);
  const existingNames = new Set(existing.map(s => s.name.toLowerCase()));
  let added = 0;
  ESCO.forEach(skill => {
    if (existingNames.has(skill.name.toLowerCase())) return;
    store.skills.push({
      id: uuidv4(), name: skill.name, category: skill.category,
      subcategory: skill.subcategory || null, description: null, aliases: [],
      proficiency_levels: ["Beginner","Intermediate","Advanced","Expert"],
      environment_id: env.id, is_active: true, source: "esco",
      created_at: ts, updated_at: ts,
    });
    existingNames.add(skill.name.toLowerCase());
    added++;
  });
  console.log(`${env.name}: +${added} ESCO skills (${existing.length} existed, ${existing.length+added} total)`);
  totalAdded += added;
});
fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
console.log(`\nDone. ${totalAdded} skills added across ${envs.length} env(s). Total: ${store.skills.length}`);
