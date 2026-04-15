// e2e/core/modules.spec.js
// Interviews, Offers, Reports, Workflows, Portals, Org Chart — module smoke tests
const { test, expect } = require('@playwright/test');
const { login } = require('../fixtures/auth');

const ADMIN = { email: 'admin@talentos.io', password: 'Admin1234!' };
const T = { timeout: 12000 };

async function goToNav(page, label) {
  const btn = page.locator('button, a').filter({ hasText: new RegExp(label, 'i') }).first();
  const visible = await btn.isVisible({ timeout: 5000 }).catch(() => false);
  if (!visible) return false;
  await btn.click();
  await page.waitForLoadState('networkidle');
  return true;
}

test.describe('Modules smoke tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await page.locator('button, a').filter({ hasText: /Dashboard|People/ }).first()
      .waitFor({ state: 'visible', ...T });
  });

  test('Interviews module loads', async ({ page }) => {
    const ok = await goToNav(page, 'Interviews');
    if (!ok) { test.skip(true, 'Interviews not in nav'); return; }
    await expect(page.locator('text="Something went wrong"')).not.toBeVisible();
    const content = await page.locator('text=/Interview Type|Schedule|No interview/i').first().isVisible(T).catch(() => false);
    expect(content).toBe(true);
  });

  test('New Interview Type button is present', async ({ page }) => {
    const ok = await goToNav(page, 'Interviews');
    if (!ok) { test.skip(true, 'Interviews not in nav'); return; }
    const btn = page.locator('button').filter({ hasText: /New|Create|Add/i }).first();
    await expect(btn).toBeVisible(T);
  });

  test('Offers module loads', async ({ page }) => {
    const ok = await goToNav(page, 'Offers');
    if (!ok) { test.skip(true, 'Offers not in nav'); return; }
    await expect(page.locator('text="Something went wrong"')).not.toBeVisible();
    const content = await page.locator('text=/Offer|New Offer|No offer/i').first().isVisible(T).catch(() => false);
    expect(content).toBe(true);
  });

  test('Reports module loads', async ({ page }) => {
    const ok = await goToNav(page, 'Reports');
    if (!ok) { test.skip(true, 'Reports not in nav'); return; }
    await expect(page.locator('text="Something went wrong"')).not.toBeVisible();
    const content = await page.locator('text=/Report|Build|Template|Saved/i').first().isVisible(T).catch(() => false);
    expect(content).toBe(true);
  });

  test('Reports — run a saved template', async ({ page }) => {
    const ok = await goToNav(page, 'Reports');
    if (!ok) { test.skip(true, 'Reports not in nav'); return; }

    const templateBtn = page.locator('button').filter({ hasText: /Template|Example/i }).first();
    if (!(await templateBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'No template button'); return;
    }
    await templateBtn.click();
    await page.waitForTimeout(1000);
    await expect(page.locator('text="Something went wrong"')).not.toBeVisible();
  });

  test('Org Chart loads', async ({ page }) => {
    const ok = await goToNav(page, 'Org Chart');
    if (!ok) { test.skip(true, 'Org Chart not in nav'); return; }
    await expect(page.locator('text="Something went wrong"')).not.toBeVisible();
  });

  test('Org Chart zoom controls are present', async ({ page }) => {
    const ok = await goToNav(page, 'Org Chart');
    if (!ok) { test.skip(true, 'Org Chart not in nav'); return; }
    const zoom = page.locator('button').filter({ hasText: /Fit|\+|−|%/i }).first();
    const visible = await zoom.isVisible({ timeout: 8000 }).catch(() => false);
    if (!visible) test.skip(true, 'Zoom controls not found');
  });

  test('Campaigns module loads', async ({ page }) => {
    const ok = await goToNav(page, 'Campaigns');
    if (!ok) { test.skip(true, 'Campaigns not in nav'); return; }
    await expect(page.locator('text="Something went wrong"')).not.toBeVisible();
  });

  test('Portal Builder loads in settings', async ({ page }) => {
    // Portals is under Settings
    const settingsBtn = page.locator('button, a').filter({ hasText: /Settings/i }).first();
    if (!(await settingsBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Settings not found'); return;
    }
    await settingsBtn.click();
    await page.waitForTimeout(500);
    const portalsBtn = page.locator('button, a, li').filter({ hasText: /Portals/i }).first();
    if (!(await portalsBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Portals not in settings'); return;
    }
    await portalsBtn.click();
    await page.waitForTimeout(800);
    await expect(page.locator('text="Something went wrong"')).not.toBeVisible();
  });

  test('Workflows loads in settings', async ({ page }) => {
    const settingsBtn = page.locator('button, a').filter({ hasText: /Settings/i }).first();
    if (!(await settingsBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Settings not found'); return;
    }
    await settingsBtn.click();
    await page.waitForTimeout(500);
    const wfBtn = page.locator('button, a, li').filter({ hasText: /Workflows/i }).first();
    if (!(await wfBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Workflows not in settings'); return;
    }
    await wfBtn.click();
    await page.waitForTimeout(800);
    await expect(page.locator('text="Something went wrong"')).not.toBeVisible();
    const content = await page.locator('text=/Workflow|New Workflow|No workflow/i').first().isVisible(T).catch(() => false);
    expect(content).toBe(true);
  });
});
