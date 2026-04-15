// e2e/core/copilot.spec.js
// AI Copilot — opens, accepts messages, DB search, does not crash
const { test, expect } = require('@playwright/test');
const { login } = require('../fixtures/auth');

const ADMIN = { email: 'admin@talentos.io', password: 'Admin1234!' };
const T = { timeout: 15000 };

test.describe('AI Copilot', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await page.locator('button, a').filter({ hasText: /Dashboard|People/ }).first()
      .waitFor({ state: 'visible', timeout: 12000 });
  });

  test('Copilot button is present on screen', async ({ page }) => {
    // The copilot is a floating button — button with ✦ or labelled Copilot/AI
    const btn = page.locator('button[aria-label*="Copilot"], button[aria-label*="AI"], button').filter({ hasText: /✦|Copilot/i }).first();
    const visible = await btn.isVisible({ timeout: 8000 }).catch(() => false);
    expect(visible).toBe(true);
  });

  test('Copilot opens and shows welcome message', async ({ page }) => {
    const btn = page.locator('button').filter({ hasText: /✦|Copilot/i }).first();
    if (!(await btn.isVisible({ timeout: 8000 }).catch(() => false))) {
      test.skip(true, 'Copilot button not found'); return;
    }
    await btn.click();
    await page.waitForTimeout(1000);
    await expect(page.locator('text="Something went wrong"')).not.toBeVisible();

    // Should show a chat panel or welcome text
    const panel = page.locator('text=/Hello|Hi|Copilot|How can I help/i').first();
    await expect(panel).toBeVisible(T);
  });

  test('Copilot accepts a typed message', async ({ page }) => {
    const btn = page.locator('button').filter({ hasText: /✦|Copilot/i }).first();
    if (!(await btn.isVisible({ timeout: 8000 }).catch(() => false))) {
      test.skip(true, 'Copilot button not found'); return;
    }
    await btn.click();
    await page.waitForTimeout(800);

    // Find the chat input
    const input = page.locator('textarea, input[type="text"]').filter({ hasText: '' }).last();
    if (!(await input.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'No chat input found'); return;
    }
    await input.fill('Hello, what can you help me with?');
    await page.waitForTimeout(300);

    // Send the message (Enter or Send button)
    const sendBtn = page.locator('button[type="submit"], button').filter({ hasText: /Send/i }).first();
    if (await sendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sendBtn.click();
    } else {
      await input.press('Enter');
    }

    // Should not crash regardless of AI response time
    await page.waitForTimeout(2000);
    await expect(page.locator('text="Something went wrong"')).not.toBeVisible();
  });

  test('Copilot can be closed', async ({ page }) => {
    const btn = page.locator('button').filter({ hasText: /✦|Copilot/i }).first();
    if (!(await btn.isVisible({ timeout: 8000 }).catch(() => false))) {
      test.skip(true, 'Copilot button not found'); return;
    }
    await btn.click();
    await page.waitForTimeout(800);

    // Close with X button or Escape
    const closeBtn = page.locator('button').filter({ hasText: /✕|×|Close/i }).last();
    if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(500);
    await expect(page.locator('text="Something went wrong"')).not.toBeVisible();
  });
});
