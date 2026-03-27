const EMAIL    = process.env.TEST_EMAIL    || 'admin@talentos.io';
const PASSWORD = process.env.TEST_PASSWORD || 'Admin1234!';

export async function login(page) {
  await page.goto('/');
  await page.waitForSelector('input[type="email"], input[placeholder*="email" i]', { timeout: 10000 });
  await page.fill('input[type="email"], input[placeholder*="email" i]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login")');
  await page.waitForURL(url => !url.pathname.includes('login'), { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

/** Click a nav item by label — tries button, link, and role=button */
export async function navTo(page, label) {
  // Try sidebar button with matching text
  const btn = page.locator(`button:has-text("${label}"), a:has-text("${label}")`).first();
  await btn.click();
  await page.waitForLoadState('networkidle');
}
