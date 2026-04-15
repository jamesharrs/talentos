// e2e/core/security.spec.js
// Security checks: CSRF, auth guards, session behaviour, rate limiting
const { test, expect } = require('@playwright/test');
const { login } = require('../fixtures/auth');

const ADMIN = { email: 'admin@talentos.io', password: 'Admin1234!' };
const API   = process.env.API_URL || 'http://localhost:3001';

test.describe('Security', () => {
  test('unauthenticated API request returns 401', async ({ request }) => {
    const r = await request.get(`${API}/api/records`);
    expect([401, 403]).toContain(r.status());
  });

  test('wrong password returns 401 not 500', async ({ request }) => {
    const r = await request.post(`${API}/api/users/auth/login`, {
      data: { email: 'admin@talentos.io', password: 'wrongpassword' },
    });
    expect(r.status()).toBe(401);
    const body = await r.json();
    expect(body.error).toBeDefined();
  });

  test('CSRF missing on mutation → 403 CSRF_MISSING', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await page.locator('button, a').filter({ hasText: /Dashboard|People/ }).first()
      .waitFor({ state: 'visible', timeout: 12000 });

    const result = await page.evaluate(async () => {
      const r = await fetch('/api/records', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ object_id: 'x', environment_id: 'x', data: {} }),
      });
      return { status: r.status, body: await r.json().catch(() => ({})) };
    });

    expect(result.status).toBe(403);
    expect(result.body.code).toBe('CSRF_MISSING');
  });

  test('CSRF present → not CSRF error (may be validation error)', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await page.locator('button, a').filter({ hasText: /Dashboard|People/ }).first()
      .waitFor({ state: 'visible', timeout: 12000 });

    const result = await page.evaluate(async () => {
      const csrf = document.cookie.match(/vercentic_csrf=([^;]+)/)?.[1];
      if (!csrf) return { status: 0, error: 'no CSRF cookie' };
      const r = await fetch('/api/records', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        body: JSON.stringify({ object_id: 'bad-uuid', environment_id: 'bad', data: {} }),
      });
      return { status: r.status, body: await r.json().catch(() => ({})) };
    });

    expect(result.error).toBeUndefined();
    expect([400, 422, 404]).toContain(result.status); // Validation/not-found, NOT CSRF error
    expect(result.body.code).not.toBe('CSRF_MISSING');
    expect(result.body.code).not.toBe('CSRF_INVALID');
  });

  test('DELETE without CSRF → 403', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await page.locator('button, a').filter({ hasText: /Dashboard|People/ }).first()
      .waitFor({ state: 'visible', timeout: 12000 });

    const result = await page.evaluate(async () => {
      const r = await fetch('/api/records/fake-id', {
        method: 'DELETE', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      return { status: r.status, body: await r.json().catch(() => ({})) };
    });

    expect(result.status).toBe(403);
  });

  test('session cookie is httpOnly (not readable via JS)', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await page.locator('button, a').filter({ hasText: /Dashboard|People/ }).first()
      .waitFor({ state: 'visible', timeout: 12000 });

    const cookies = await page.evaluate(() => document.cookie);
    // The session cookie vercentic_sid should NOT appear in document.cookie
    expect(cookies).not.toContain('vercentic_sid');
  });

  test('CSRF cookie IS readable (needed for X-CSRF-Token header)', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await page.locator('button, a').filter({ hasText: /Dashboard|People/ }).first()
      .waitFor({ state: 'visible', timeout: 12000 });

    const csrf = await page.evaluate(() => document.cookie.match(/vercentic_csrf=([^;]+)/)?.[1] || '');
    expect(csrf.length).toBeGreaterThan(10);
  });

  test('health check endpoint is public', async ({ request }) => {
    const r = await request.get(`${API}/api/health`);
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body.status).toBe('ok');
  });
});
