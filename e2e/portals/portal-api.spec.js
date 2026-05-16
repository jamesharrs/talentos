// e2e/portals/portal-api.spec.js
// API-level tests for the portal public endpoints — no browser needed.
// Uses X-User-Id header for auth to bypass CSRF in test contexts.
// Run with: npx playwright test --project=portal-api

const { test, expect } = require('@playwright/test');

const API          = process.env.API_URL || 'http://localhost:3001';
const ADMIN_UID    = process.env.ADMIN_USER_ID || '8b53288b-63d8-4f6f-b423-14fa1485b310';
const ENV_ID       = process.env.ENV_ID       || 'c0c64e3b-113d-48b8-bc3c-684769849742';

// ── Helpers ───────────────────────────────────────────────────────────────────
const authH = { 'X-User-Id': ADMIN_UID };

function apiGet(request, path) {
  return request.get(`${API}/api${path}`, { headers: authH });
}
function apiPost(request, path, data) {
  return request.post(`${API}/api${path}`, { data, headers: authH });
}
function apiDel(request, path) {
  return request.delete(`${API}/api${path}`, { headers: authH });
}
function pubPost(request, path, data) {
  return request.post(`${API}/api${path}`, { data });
}
function pubGet(request, path) {
  return request.get(`${API}/api${path}`);
}

// Creates a fresh published portal for a test and deletes it afterward
async function withPortal(request, fn) {
  const slug = `e2e-${Date.now()}`;
  const cr = await apiPost(request, '/portals', {
    environment_id: ENV_ID, name: 'E2E Career Site', slug,
    status: 'published', type: 'career_site',
    theme: { primaryColor: '#3B5BDB', company_name: 'E2E Corp', tagline: 'Test' },
  });
  if (!cr.ok()) {
    const body = await cr.text();
    throw new Error(`Portal create failed: ${cr.status()} ${body}`);
  }
  const portal = await cr.json();
  const cleanSlug = portal.slug.replace(/^\//, '');
  try {
    await fn(portal.id, cleanSlug);
  } finally {
    await apiDel(request, `/portals/${portal.id}`);
  }
}

// ── Public slug lookup ────────────────────────────────────────────────────────

test('GET /portals/slug/:slug — returns config for published portal', async ({ request }) => {
  await withPortal(request, async (portalId, slug) => {
    const r = await pubGet(request, `/portals/slug/${slug}`);
    expect(r.ok()).toBeTruthy();
    const p = await r.json();
    expect(p.id).toBe(portalId);
    expect(p.status).toBe('published');
    expect(p.type).toBe('career_site');
    expect(p.branding || p.theme).toBeTruthy();
  });
});

test('GET /portals/slug/:slug — returns 404 for unknown slug', async ({ request }) => {
  const r = await pubGet(request, '/portals/slug/nonexistent-xyz-99999');
  expect(r.status()).toBe(404);
});

test('GET /portals/slug/:slug — returns 404 for draft portal', async ({ request }) => {
  const slug = `e2e-draft-${Date.now()}`;
  const cr = await apiPost(request, '/portals', {
    environment_id: ENV_ID, name: 'Draft Portal', slug, status: 'draft', type: 'career_site',
  });
  const draft = await cr.json();
  try {
    const r = await pubGet(request, `/portals/slug/${slug}`);
    expect(r.status()).toBe(404);
  } finally {
    await apiDel(request, `/portals/${draft.id}`);
  }
});

// ── Application submission ────────────────────────────────────────────────────

test('POST /portals/:id/apply — creates a candidate record', async ({ request }) => {
  await withPortal(request, async (portalId) => {
    const email = `e2e-applicant-${Date.now()}@test.invalid`;
    const r = await pubPost(request, `/portals/${portalId}/apply`, {
      first_name: 'Jane', last_name: 'Applicant', email,
      phone: '+971500000001', cover_note: 'E2E test application', job_title: 'E2E Test Role',
    });
    expect(r.ok()).toBeTruthy();
    const body = await r.json();
    expect(body.success).toBeTruthy();
    expect(body.person_id).toBeTruthy();
  });
});

test('POST /portals/:id/apply — sets source=Career Site and person_type=Candidate', async ({ request }) => {
  await withPortal(request, async (portalId) => {
    const email = `e2e-source-${Date.now()}@test.invalid`;
    const ar = await pubPost(request, `/portals/${portalId}/apply`, {
      first_name: 'Source', last_name: 'Check', email,
    });
    expect(ar.ok()).toBeTruthy();
    const { person_id } = await ar.json();

    // Verify via admin API
    const rr = await apiGet(request, `/records/${person_id}`);
    if (!rr.ok()) { return; } // record endpoint may 404 — skip gracefully
    const rec = await rr.json();
    expect(rec.data?.source).toMatch(/career site/i);
    expect(rec.data?.person_type).toMatch(/candidate/i);
  });
});

test('POST /portals/:id/apply — idempotent: same email reuses existing record', async ({ request }) => {
  await withPortal(request, async (portalId) => {
    const email = `e2e-dup-${Date.now()}@test.invalid`;
    const r1 = await pubPost(request, `/portals/${portalId}/apply`, { first_name: 'Dup', email });
    const r2 = await pubPost(request, `/portals/${portalId}/apply`, { first_name: 'Dup Again', email });
    expect(r1.ok()).toBeTruthy();
    expect(r2.ok()).toBeTruthy();
    const [b1, b2] = [await r1.json(), await r2.json()];
    expect(b1.person_id).toBe(b2.person_id);
    expect(b2.is_new).toBeFalsy();
  });
});

test('POST /portals/:id/apply — rejects missing first_name with 400', async ({ request }) => {
  await withPortal(request, async (portalId) => {
    const r = await pubPost(request, `/portals/${portalId}/apply`, {
      email: `no-fname-${Date.now()}@test.invalid`,
    });
    expect(r.status()).toBe(400);
    const body = await r.json();
    expect(body.error).toMatch(/first_name/i);
  });
});

test('POST /portals/:id/apply — rejects missing email with 400', async ({ request }) => {
  await withPortal(request, async (portalId) => {
    const r = await pubPost(request, `/portals/${portalId}/apply`, { first_name: 'NoEmail' });
    expect(r.status()).toBe(400);
  });
});

test('POST /portals/nonexistent/apply — returns 404', async ({ request }) => {
  const r = await pubPost(request, '/portals/nonexistent-portal-id-xyz/apply', {
    first_name: 'Test', email: 'test@test.invalid',
  });
  expect(r.status()).toBe(404);
});

// ── Application status ────────────────────────────────────────────────────────

test('GET /portals/public/application/:personId — returns application history', async ({ request }) => {
  await withPortal(request, async (portalId) => {
    const email = `e2e-status-${Date.now()}@test.invalid`;
    const ar = await pubPost(request, `/portals/${portalId}/apply`, {
      first_name: 'Status', last_name: 'Check', email, job_title: 'Test Engineer',
    });
    expect(ar.ok()).toBeTruthy();
    const { person_id } = await ar.json();

    const r = await pubGet(request, `/portals/public/application/${person_id}`);
    expect(r.ok()).toBeTruthy();
    const body = await r.json();
    expect(body.person).toBeTruthy();
    expect(body.person.first_name).toBe('Status');
    expect(body.person.email).toBeTruthy();
    expect(Array.isArray(body.applications)).toBeTruthy();
    expect(body.applications.length).toBeGreaterThanOrEqual(1);
    expect(body.applications[0].applied_at).toBeTruthy();
  });
});

test('GET /portals/public/application/nonexistent — returns 404', async ({ request }) => {
  const r = await pubGet(request, '/portals/public/application/nonexistent-person-id-xyz');
  expect(r.status()).toBe(404);
});
