import { test, expect } from '@playwright/test';
import { login, navTo } from '../helpers/auth.js';

test.describe('Jobs', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('Jobs list loads without crash', async ({ page }) => {
    await navTo(page, 'Jobs');
    await expect(page.locator('text="Something went wrong"')).not.toBeVisible();
  });

  test('clicking a job record opens detail without crash', async ({ page }) => {
    await navTo(page, 'Jobs');
    const firstRow = page.locator('table tbody tr').first();
    if (!await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'No job records'); return;
    }
    await firstRow.locator('a, td:nth-child(2)').first().click();
    await page.waitForTimeout(2000);
    await expect(page.locator('text="Something went wrong"')).not.toBeVisible();
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('dashboard loads without crash', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text="Something went wrong"')).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('Settings page loads without crash', async ({ page }) => {
    // Navigate directly by URL since the settings button label may vary
    await page.goto('/?section=settings');
    await page.waitForLoadState('networkidle');
    // Also try clicking the settings icon button
    const settingsBtn = page.locator('button[title*="ettings"], button:has-text("Settings"), a:has-text("Settings")').first();
    if (await settingsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await settingsBtn.click();
      await page.waitForLoadState('networkidle');
    }
    await expect(page.locator('text="Something went wrong"')).not.toBeVisible();
  });
});
