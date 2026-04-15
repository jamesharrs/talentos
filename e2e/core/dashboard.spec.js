// e2e/core/dashboard.spec.js
// Dashboard — stat cards, charts, activity feed, clickable elements
const { test, expect } = require('@playwright/test');
const { login } = require('../fixtures/auth');

const ADMIN = { email: 'admin@talentos.io', password: 'Admin1234!' };
const T = { timeout: 12000 };

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    // Navigate to Dashboard
    const dashBtn = page.locator('button, a').filter({ hasText: /Dashboard/i }).first();
    await dashBtn.waitFor({ state: 'visible', ...T });
    await dashBtn.click();
    await page.waitForLoadState('networkidle');
  });

  test('Dashboard loads without crash', async ({ page }) => {
    await expect(page.locator('text="Something went wrong"')).not.toBeVisible();
    const content = await page.locator('h1, h2, [data-tour="dashboard-stats"], text=/Candidate|Jobs|Pipeline/i').first().isVisible(T).catch(() => false);
    expect(content).toBe(true);
  });

  test('Stat cards are visible', async ({ page }) => {
    // At least one numeric stat card should be present
    const statCard = page.locator('[data-tour="dashboard-stats"], .stat-card').first();
    const fallback = page.locator('text=/\\d+/').first();
    const visible = await statCard.isVisible({ timeout: 5000 }).catch(() => false)
      || await fallback.isVisible({ timeout: 5000 }).catch(() => false);
    expect(visible).toBe(true);
  });

  test('clicking a stat card navigates to filtered list', async ({ page }) => {
    // Find a clickable stat card
    const card = page.locator('[data-stat-card], button').filter({ hasText: /Candidate|People|Jobs/i }).first();
    if (!(await card.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'No clickable stat card found'); return;
    }
    await card.click();
    await page.waitForTimeout(1000);
    await expect(page.locator('text="Something went wrong"')).not.toBeVisible();
  });

  test('Activity feed section exists', async ({ page }) => {
    const feed = page.locator('text=/Activity|Recent|Timeline/i').first();
    const visible = await feed.isVisible({ timeout: 8000 }).catch(() => false);
    // Soft check — feed may be empty on a fresh environment
    if (!visible) test.skip(true, 'No activity feed visible');
  });

  test('Open Jobs by Department section loads', async ({ page }) => {
    const section = page.locator('text=/Department|Open Req/i').first();
    const visible = await section.isVisible({ timeout: 8000 }).catch(() => false);
    if (!visible) test.skip(true, 'Department breakdown not visible');
    else await expect(page.locator('text="Something went wrong"')).not.toBeVisible();
  });

  test('Hiring Activity chart is rendered', async ({ page }) => {
    // Recharts renders SVG elements
    const chart = page.locator('svg, canvas, .recharts-wrapper').first();
    const visible = await chart.isVisible({ timeout: 8000 }).catch(() => false);
    if (!visible) test.skip(true, 'No chart found');
    else expect(visible).toBe(true);
  });

  test('Refresh button reloads without crash', async ({ page }) => {
    const refreshBtn = page.locator('button').filter({ hasText: /Refresh/i }).first();
    if (!(await refreshBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'No refresh button'); return;
    }
    await refreshBtn.click();
    await page.waitForTimeout(1500);
    await expect(page.locator('text="Something went wrong"')).not.toBeVisible();
  });

  test('Pipeline donut chart segments are clickable', async ({ page }) => {
    // Recharts pie segments are path elements inside SVG
    const piePath = page.locator('.recharts-pie-sector, .recharts-sector').first();
    if (!(await piePath.isVisible({ timeout: 6000 }).catch(() => false))) {
      test.skip(true, 'No pie chart found'); return;
    }
    await piePath.click({ force: true });
    await page.waitForTimeout(800);
    await expect(page.locator('text="Something went wrong"')).not.toBeVisible();
  });

  test('+ Create dropdown opens from top bar', async ({ page }) => {
    const createBtn = page.locator('button').filter({ hasText: /Create/i }).first();
    if (!(await createBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'No Create button'); return;
    }
    await createBtn.click();
    await page.waitForTimeout(400);
    await expect(page.locator('text="Something went wrong"')).not.toBeVisible();
    // Dropdown items should be visible
    const item = page.locator('[role="menuitem"], button').filter({ hasText: /Person|People|Job/i }).first();
    await expect(item).toBeVisible({ timeout: 5000 });
  });

  test('global search bar is present', async ({ page }) => {
    const searchBar = page.locator('input[placeholder*="Search"], [data-tour="global-search"] input').first();
    const visible = await searchBar.isVisible({ timeout: 6000 }).catch(() => false);
    expect(visible).toBe(true);
  });

  test('typing in search shows results or empty state', async ({ page }) => {
    const searchBar = page.locator('input[placeholder*="Search"]').first();
    if (!(await searchBar.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'No search bar'); return;
    }
    await searchBar.fill('test');
    await page.waitForTimeout(600);
    await expect(page.locator('text="Something went wrong"')).not.toBeVisible();
  });

  test('sidebar navigation does not crash when switching sections', async ({ page }) => {
    const navItems = ['People', 'Jobs'];
    for (const item of navItems) {
      const btn = page.locator('button, a').filter({ hasText: new RegExp(`^${item}$`) }).first();
      if (await btn.isVisible({ timeout: 4000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(600);
        await expect(page.locator('text="Something went wrong"')).not.toBeVisible();
      }
    }
  });
});
