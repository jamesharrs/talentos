import { test, expect } from '@playwright/test';
import { login, navTo } from '../helpers/auth.js';

test.describe('People — List & Record', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('People list loads without crash', async ({ page }) => {
    await navTo(page, 'People');
    await expect(page.locator('text="Something went wrong"')).not.toBeVisible();
  });

  test('clicking a candidate record opens detail without crash', async ({ page }) => {
    await navTo(page, 'People');
    const firstRow = page.locator('table tbody tr').first();
    if (!await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'No records to test'); return;
    }
    // Click the name link (second td, or any anchor in the row)
    const nameLink = firstRow.locator('a, td:nth-child(2)').first();
    await nameLink.click();
    await page.waitForTimeout(2000);
    // This is the critical test — catches the "Something went wrong" crashes
    await expect(page.locator('text="Something went wrong"')).not.toBeVisible();
  });

  test('bulk select checkbox appears and works', async ({ page }) => {
    await navTo(page, 'People');
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (!await checkbox.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'No checkboxes found'); return;
    }
    await checkbox.click();
    await page.waitForTimeout(500);
    await expect(page.locator('text="Something went wrong"')).not.toBeVisible();
  });

  test('clicking a status pill does not crash', async ({ page }) => {
    await navTo(page, 'People');
    const pill = page.locator('span').filter({ hasText: /^(Active|Passive|Open|Draft|Filled)$/ }).first();
    if (await pill.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pill.click();
      await page.waitForTimeout(500);
      await expect(page.locator('text="Something went wrong"')).not.toBeVisible();
    }
  });
});
