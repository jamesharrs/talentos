#!/usr/bin/env node
/**
 * Vercentic API Smoke Tests
 * Run after every deploy. Exits 1 if anything fails.
 *
 * Usage:
 *   API_URL=https://talentos-production-4045.up.railway.app \
 *   SMOKE_USER=admin@talentos.io SMOKE_PASS=Admin1234! \
 *   node tests/smoke/api-smoke.js
 */

const API_URL  = process.env.API_URL  || 'http://localhost:3001';
const EMAIL    = process.env.SMOKE_USER || 'admin@talentos.io';
const PASSWORD = process.env.SMOKE_PASS || 'Admin1234!';

let passed = 0, failed = 0, authToken = null, envId = null, objectId = null, recordId = null;
const results = [];

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['X-Auth-Token'] = authToken;
    headers['X-User-Id']    = authToken;
    headers['X-Tenant-Slug'] = 'production';
  }
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method, headers, body: body ? JSON.stringify(body) : undefined,
    });
    return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
  } catch (err) {
    return { ok: false, status: 0, error: err.message };
  }
}

function test(label, pass, detail = '') {
  if (pass) { passed++; results.push({ pass: true, label }); process.stdout.write(`  ✅ ${label}\n`); }
  else { failed++; results.push({ pass: false, label, detail }); process.stdout.write(`  ❌ ${label}${detail ? ` — ${detail}` : ''}\n`); }
}

async function testHealth() {
  console.log('\n📡 Health');
  const r = await req('GET', '/api/health');
  test('GET /api/health → 200', r.ok && r.status === 200, `status=${r.status}`);
  test('health returns status:ok', r.data?.status === 'ok', JSON.stringify(r.data));
}

async function testAuth() {
  console.log('\n🔐 Authentication');
  // Try users/login endpoint
  const r = await req('POST', '/api/users/login', { email: EMAIL, password: PASSWORD });
  test('POST /api/users/login → 200', r.ok, `status=${r.status}`);
  test('login returns user object', !!r.data?.user?.id || !!r.data?.id, JSON.stringify(r.data).slice(0, 100));
  if (r.data?.user?.id) authToken = r.data.user.id;
  else if (r.data?.id) authToken = r.data.id;
}

async function testEnvironments() {
  console.log('\n🌍 Environments');
  const r = await req('GET', '/api/environments');
  test('GET /api/environments → 200', r.ok, `status=${r.status}`);
  test('returns array', Array.isArray(r.data), typeof r.data);
  test('at least one environment exists', r.data?.length > 0, `count=${r.data?.length}`);
  if (r.data?.length) envId = (r.data.find(e => e.is_default) || r.data[0]).id;
}

async function testObjects() {
  console.log('\n📦 Objects');
  if (!envId) { console.log('  ⚠️  Skipped'); return; }
  const r = await req('GET', `/api/objects?environment_id=${envId}`);
  test('GET /api/objects → 200', r.ok, `status=${r.status}`);
  test('returns array', Array.isArray(r.data), typeof r.data);
  const people = r.data?.find(o => o.slug === 'people' || o.name === 'Person');
  test('People object exists', !!people, 'objects: ' + r.data?.map(o=>o.name).join(', '));
  if (people) objectId = people.id;
}

async function testRecords() {
  console.log('\n📋 Records');
  if (!objectId || !envId) { console.log('  ⚠️  Skipped'); return; }
  const r = await req('GET', `/api/records?object_id=${objectId}&environment_id=${envId}&limit=5`);
  test('GET /api/records → 200', r.ok, `status=${r.status}`);
  const records = r.data?.records || (Array.isArray(r.data) ? r.data : []);
  if (records.length) {
    recordId = records[0].id;
    const r2 = await req('GET', `/api/records/${recordId}`);
    test('GET /api/records/:id → 200', r2.ok, `status=${r2.status}`);
    test('single record has data', !!r2.data?.data);
  }
}

async function testSearch() {
  console.log('\n🔍 Search');
  if (!envId) { console.log('  ⚠️  Skipped'); return; }
  const r = await req('GET', `/api/records/search?q=a&environment_id=${envId}&limit=3`);
  test('GET /api/records/search → not 500', r.status !== 500, `status=${r.status}`);
}

async function testUsers() {
  console.log('\n👤 Users & Roles');
  const r  = await req('GET', '/api/users');
  test('GET /api/users → 200', r.ok, `status=${r.status}`);
  const r2 = await req('GET', '/api/roles');
  test('GET /api/roles → 200', r2.ok, `status=${r2.status}`);
  test('5 system roles exist', r2.data?.length >= 5, `count=${r2.data?.length}`);
}

async function testWorkflows() {
  console.log('\n⚙️  Workflows');
  if (!envId) { console.log('  ⚠️  Skipped'); return; }
  const r = await req('GET', `/api/workflows?environment_id=${envId}`);
  test('GET /api/workflows → 200', r.ok, `status=${r.status}`);
}

async function testFeatureFlags() {
  console.log('\n🚩 Feature Flags');
  if (!envId) { console.log('  ⚠️  Skipped'); return; }
  const r = await req('GET', `/api/feature-flags?environment_id=${envId}`);
  test('GET /api/feature-flags → not 500', r.status !== 500, `status=${r.status}`);
}

async function run() {
  console.log(`\n🔬 Vercentic API Smoke Tests\n   Target: ${API_URL}\n${'─'.repeat(50)}`);
  await testHealth();
  await testAuth();
  await testEnvironments();
  await testObjects();
  await testRecords();
  await testSearch();
  await testUsers();
  await testWorkflows();
  await testFeatureFlags();
  console.log(`\n${'─'.repeat(50)}\n📊 Results: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) {
    console.log('❌ FAILED:\n' + results.filter(r=>!r.pass).map(r=>`   • ${r.label}${r.detail?`: ${r.detail}`:''}`).join('\n') + '\n');
    process.exit(1);
  } else { console.log('✅ All smoke tests passed!\n'); process.exit(0); }
}

run().catch(err => { console.error('\n💥 Crashed:', err.message); process.exit(1); });
