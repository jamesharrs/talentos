import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth.js';

test.describe('Authentication', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('input[type="email"], input[placeholder*="email" i]')).toBeVisible();
  });

  test('login with valid credentials succeeds', async ({ page }) => {
    await login(page);
    expect(page.url()).not.toContain('login');
    await expect(page.locator('text="Something went wrong"')).not.toBeVisible();
  });

  test('login with bad credentials shows error', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"], input[placeholder*="email" i]', 'bad@example.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")');
    await page.waitForTimeout(2000);
    const hasError = await page.locator('text=/invalid|incorrect|failed|error/i').isVisible().catch(() => false);
    const stillOnLogin = await page.locator('input[type="password"]').isVisible().catch(() => false);
    expect(hasError || stillOnLogin).toBe(true);
  });
});
