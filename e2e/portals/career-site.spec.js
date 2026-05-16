// e2e/portals/career-site.spec.js
// Browser E2E tests for the candidate experience on the Career Site portal.
// Requires the portal renderer running on port 5173.
// Run with: PORTAL_URL=http://localhost:5173 npx playwright test e2e/portals/career-site.spec.js

const { test, expect } = require('@playwright/test');

const PORTAL_URL = process.env.PORTAL_URL || 'http://localhost:5173';
const API        = process.env.API_URL    || 'http://localhost:3001';

// Helper: find a published career site portal slug
async function getPortalSlug(request) {
  const loginR = await request.post(`${API}/api/users/login`, {
    data: { email: 'admin@talentos.io', password: 'Admin1234!' },
  });
  const cookies = loginR.headers()['set-cookie'] || '';
  const envsR = await request.get(`${API}/api/environments`);
  const envs  = await envsR.json();
  const envId = (envs.find(e => e.is_default) || envs[0])?.id;
  if (!envId) return null;

  const portalsR = await request.get(`${API}/api/portals?environment_id=${envId}`, {
    headers: { Cookie: cookies },
  });
  const portals = await portalsR.json();
  const list = Array.isArray(portals) ? portals : (portals.portals || []);
  const p = list.find(p => p.type === 'career_site' && p.status === 'published' && !p.deleted_at);
  return p ? p.slug.replace(/^\//, '') : null;
}

test.describe('Career Site — rendering', () => {
  test('portal loads without error', async ({ page, request }) => {
    const slug = await getPortalSlug(request);
    if (!slug) { test.skip(); return; }
    await page.goto(`${PORTAL_URL}/?portal=${slug}`);
    await expect(page.locator('text=/not available|unpublished|invalid/i')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.locator('h1, [class*="hero"], text=/join|careers|open.*role/i').first()).toBeVisible({ timeout: 15_000 });
  });

  test('shows job listings or empty state', async ({ page, request }) => {
    const slug = await getPortalSlug(request);
    if (!slug) { test.skip(); return; }
    await page.goto(`${PORTAL_URL}/?portal=${slug}`);
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator('[class*="job"], [class*="card"]').first()
        .or(page.locator('text=/no.*open|no.*position|no.*role/i').first())
    ).toBeVisible({ timeout: 10_000 });
  });

  test('invalid slug shows error screen', async ({ page }) => {
    await page.goto(`${PORTAL_URL}/?portal=nonexistent-xyz-99999`);
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator('text=/not available|unpublished|invalid|not found/i').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('missing slug shows helpful message', async ({ page }) => {
    await page.goto(PORTAL_URL);
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator('text=/no portal|add.*portal|portal.*url/i').first()
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Career Site — application form', () => {
  // Navigate to the apply form for the first open job
  async function navigateToApplyForm(page, request) {
    const slug = await getPortalSlug(request);
    if (!slug) return false;
    await page.goto(`${PORTAL_URL}/?portal=${slug}`);
    await page.waitForLoadState('networkidle');

    // Click first apply button
    const applyBtn = page.locator('text=/apply →|apply for/i').first();
    if (!await applyBtn.isVisible().catch(() => false)) return false;
    await applyBtn.click();
    await page.waitForTimeout(600);

    // If on detail page, click the form's apply button
    const onForm = await page.getByLabel(/first name/i).isVisible().catch(() => false);
    if (!onForm) {
      const detailApply = page.locator('text=/apply for this role/i').first();
      if (await detailApply.isVisible().catch(() => false)) await detailApply.click();
      await page.waitForTimeout(500);
    }
    return await page.getByLabel(/first name/i).isVisible().catch(() => false);
  }

  test('form has required fields and disabled submit', async ({ page, request }) => {
    const onForm = await navigateToApplyForm(page, request);
    if (!onForm) { test.skip(); return; }
    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /submit.*application|apply|send/i })
    ).toBeDisabled();
  });

  test('submit enables when required fields are filled', async ({ page, request }) => {
    const onForm = await navigateToApplyForm(page, request);
    if (!onForm) { test.skip(); return; }
    await page.getByLabel(/first name/i).fill('TestApplicant');
    await page.getByLabel(/email/i).fill('test@e2e.invalid');
    await expect(
      page.getByRole('button', { name: /submit.*application|apply|send/i })
    ).toBeEnabled();
  });

  test('successful submission shows confirmation', async ({ page, request }) => {
    const onForm = await navigateToApplyForm(page, request);
    if (!onForm) { test.skip(); return; }

    await page.getByLabel(/first name/i).fill('E2E');
    await page.getByLabel(/last name/i).fill('Browser').catch(() => {});
    await page.getByLabel(/email/i).fill(`e2e-browser-${Date.now()}@test.invalid`);
    await page.getByRole('button', { name: /submit.*application|apply|send/i }).click();

    await expect(
      page.locator('text=/application submitted|thank you|we.*be in touch/i').first()
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Career Site — admin view of applicants', () => {
  test('applicant created via portal appears in People list', async ({ page, request }) => {
    // Submit via API first
    const loginR = await request.post(`${API}/api/users/login`, {
      data: { email: 'admin@talentos.io', password: 'Admin1234!' },
    });
    const cookies = loginR.headers()['set-cookie'] || '';
    const envsR = await request.get(`${API}/api/environments`);
    const envs  = await envsR.json();
    const envId = (envs.find(e => e.is_default) || envs[0])?.id;
    if (!envId) { test.skip(); return; }

    const portalsR = await request.get(`${API}/api/portals?environment_id=${envId}`, { headers: { Cookie: cookies } });
    const portals  = await portalsR.json();
    const list     = Array.isArray(portals) ? portals : (portals.portals || []);
    const portal   = list.find(p => p.type === 'career_site' && p.status === 'published' && !p.deleted_at);
    if (!portal) { test.skip(); return; }

    const uniqueName = `PortalApplicant${Date.now()}`;
    await request.post(`${API}/api/portals/${portal.id}/apply`, {
      data: { first_name: uniqueName, email: `${uniqueName}@test.invalid` },
    });

    // Check admin app — log in and search
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Search for the applicant in the People list
    const search = page.getByPlaceholder(/search/i).last();
    if (await search.isVisible().catch(() => false)) {
      await search.fill(uniqueName);
      await page.waitForTimeout(700);
      await expect(page.locator(`text=${uniqueName}`).first()).toBeVisible({ timeout: 8_000 });
    }
  });
});
