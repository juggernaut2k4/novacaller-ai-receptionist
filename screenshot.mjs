import { chromium } from "playwright";

const BASE = "http://localhost:5000";
const DIR = "/home/user/workspace/ai-receptionist/screenshots";

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  // 1. Landing page
  await page.goto(`${BASE}/#/`);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${DIR}/01-landing.png`, fullPage: true });
  console.log("✓ Landing page");

  // 2. Login page
  await page.goto(`${BASE}/#/login`);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${DIR}/02-login.png`, fullPage: true });
  console.log("✓ Login page");

  // 3. Signup page (step 1)
  await page.goto(`${BASE}/#/signup`);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${DIR}/03-signup.png`, fullPage: true });
  console.log("✓ Signup page");

  // 4. Login as demo user
  await page.goto(`${BASE}/#/login`);
  await page.waitForTimeout(500);
  await page.fill('[data-testid="login-email"]', "demo@novacaller.com");
  await page.fill('[data-testid="login-password"]', "demo123");
  await page.click('[data-testid="login-submit"]');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${DIR}/04-dashboard.png`, fullPage: true });
  console.log("✓ Dashboard");

  // 5. Call Log
  await page.goto(`${BASE}/#/calls`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${DIR}/05-calls.png`, fullPage: true });
  console.log("✓ Call Log");

  // 6. Settings - AI tab
  await page.goto(`${BASE}/#/settings`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${DIR}/06-settings-ai.png`, fullPage: true });
  console.log("✓ Settings AI");

  // 7. Settings - Vapi tab
  await page.click('[data-testid="tab-vapi"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${DIR}/07-settings-vapi.png`, fullPage: true });
  console.log("✓ Settings Vapi");

  // 8. Billing
  await page.goto(`${BASE}/#/billing`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${DIR}/08-billing.png`, fullPage: true });
  console.log("✓ Billing");

  await browser.close();
  console.log("\nAll screenshots saved to", DIR);
}

main().catch(e => { console.error(e); process.exit(1); });
