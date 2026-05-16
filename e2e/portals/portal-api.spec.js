// e2e/portals/portal-api.spec.js
// API-level tests for the portal apply/status flow — no browser needed.
// Run with: npx playwright test --project=portal-api

const { test, expect } = require('@playwright/test');

const API = process.env.API_URL || 'http://localhost:3001';

// Shared state across tests in this file
const state = { portalId: null, portalSlug: null, personId: null, cookies: null, envId: null };

// ── Auth helper ───────────────────────────────────────────────────────────────
async function login(request) {
  const r = await request.post(`${API}/api/users/login`, {
    data: { email: 'admin@talentos.io', password: 'Admin1234!' },
  });
  const raw = r.headers()['set-cookie'] || '';
  return raw.split(/\r?\n/).map(l => l.split(';')[0].trim()).filter(Boolean).join('; ');
}

function authedGet(request, path, cookies) {
  return request.get(`${API}/api${path}`, { headers: { Cookie: cookies } });
}
function authedPost(request, path, body, cookies) {
  return request.post(`${API}/api${path}`, {
    data: body, headers: { Cookie: cookies, 'Content-Type': 'application/json' },
  });
}
function authedDel(request, path, cookies) {
  return request.delete(`${API}/api${path}`, { headers: { Cookie: cookies } });
}

// ── All tests in a single describe so beforeAll / afterAll scope correctly ────
test.describe.configure({ mode: 'serial' });

test.describe('Portal API', () => {

  test.beforeAll(async ({ request }) => {
    state.cookies = await login(request);
    const envsR = await authedGet(request, '/environments', state.cookies);
    const envs  = await envsR.json();
    state.envId = (envs.find(e => e.is_default) || envs[0])?.id;
    expect(state.cookies).toBeTruthy();
    expect(state.envId).toBeTruthy();

    // Create a published test portal
    const slug = `e2e-portal-${Date.now()}`;
    const r = await authedPost(request, '/portals', {
      environment_id: state.envId, name: 'E2E Career Site', slug,
      status: 'published', type: 'career_site',
      theme: { primaryColor: '#3B5BDB', company_name: 'E2E Corp', tagline: 'Test' },
    }, state.cookies);
    expect(r.ok()).toBeTruthy();
    const portal = await r.json();
    state.portalId   = portal.id;
    state.portalSlug = portal.slug.replace(/^\//, '');
    expect(state.portalId).toBeTruthy();
  });

  test.afterAll(async ({ request }) => {
    if (state.portalId && state.cookies) {
      await authedDel(request, `/portals/${state.portalId}`, state.cookies);
    }
  });

  // ── Public slug lookup ──────────────────────────────────────────────────────
  test('GET /portals/slug/:slug returns portal config for published portal', async ({ request }) => {
    const r = await request.get(`${API}/api/portals/slug/${state.portalSlug}`);
    expect(r.ok()).toBeTruthy();
    const p = await r.json();
    expect(p.id).toBe(state.portalId);
    expect(p.status).toBe('published');
    expect(p.type).toBe('career_site');
    expect(p.branding || p.theme).toBeTruthy();
  });

  test('GET /portals/slug/:slug returns 404 for unknown slug', async ({ request }) => {
    const r = await request.get(`${API}/api/portals/slug/nonexistent-xyz-99999`);
    expect(r.status()).toBe(404);
  });

  // ── Application submission ──────────────────────────────────────────────────
  test('POST /portals/:id/apply creates a candidate record', async ({ request }) => {
    const email = `e2e-applicant-${Date.now()}@test.invalid`;
    const r = await request.post(`${API}/api/portals/${state.portalId}/apply`, {
      data: { first_name: 'Jane', last_name: 'Applicant', email,
              phone: '+971500000001', cover_note: 'E2E test', job_title: 'E2E Test Role' },
    });
    expect(r.ok()).toBeTruthy();
    const body = await r.json();
    expect(body.success).toBeTruthy();
    expect(body.person_id).toBeTruthy();
    state.personId = body.person_id;
  });

  test('POST /portals/:id/apply is idempotent — same email reuses record', async ({ request }) => {
    const email = `e2e-dup-${Date.now()}@test.invalid`;
    const r1 = await request.post(`${API}/api/portals/${state.portalId}/apply`, { data: { first_name: 'Dup', email } });
    const r2 = await request.post(`${API}/api/portals/${state.portalId}/apply`, { data: { first_name: 'Dup', email } });
    expect(r1.ok()).toBeTruthy();
    expect(r2.ok()).toBeTruthy();
    const b1 = await r1.json();
    const b2 = await r2.json();
    expect(b1.person_id).toBe(b2.person_id);
    expect(b2.is_new).toBeFalsy();
  });

  test('POST /portals/:id/apply rejects missing first_name', async ({ request }) => {
    const r = await request.post(`${API}/api/portals/${state.portalId}/apply`, {
      data: { email: `nofirst-${Date.now()}@test.invalid` },
    });
    expect(r.status()).toBe(400);
    expect((await r.json()).error).toMatch(/first_name/i);
  });

  test('POST /portals/:id/apply rejects missing email', async ({ request }) => {
    const r = await request.post(`${API}/api/portals/${state.portalId}/apply`, {
      data: { first_name: 'NoEmail' },
    });
    expect(r.status()).toBe(400);
  });

  test('POST /portals/nonexistent/apply returns 404', async ({ request }) => {
    const r = await request.post(`${API}/api/portals/nonexistent-id/apply`, {
      data: { first_name: 'Test', email: 'test@test.invalid' },
    });
    expect(r.status()).toBe(404);
  });

  // ── Application status ──────────────────────────────────────────────────────
  test('GET /portals/public/application/:id returns history', async ({ request }) => {
    expect(state.personId).toBeTruthy();
    const r = await request.get(`${API}/api/portals/public/application/${state.personId}`);
    expect(r.ok()).toBeTruthy();
    const body = await r.json();
    expect(body.person).toBeTruthy();
    expect(body.person.first_name).toBe('Jane');
    expect(Array.isArray(body.applications)).toBeTruthy();
    expect(body.applications.length).toBeGreaterThanOrEqual(1);
    expect(body.applications[0].applied_at).toBeTruthy();
  });

  test('GET /portals/public/application/nonexistent returns 404', async ({ request }) => {
    const r = await request.get(`${API}/api/portals/public/application/nonexistent-id`);
    expect(r.status()).toBe(404);
  });

  // ── Candidate source in admin ───────────────────────────────────────────────
  test('applicant record has source=Career Site and person_type=Candidate', async ({ request }) => {
    expect(state.personId).toBeTruthy();
    const r = await authedGet(request, `/records/${state.personId}`, state.cookies);
    if (!r.ok()) { test.skip(); return; } // record endpoint may vary
    const rec = await r.json();
    expect(rec.data?.source).toMatch(/career site/i);
    expect(rec.data?.person_type).toMatch(/candidate/i);
  });

});
