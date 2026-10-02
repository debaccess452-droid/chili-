import { chromium } from 'playwright';

async function runBrowserTest() {
  console.log('=== STARTING BROWSER RUNTIME TEST ===');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const supabaseRequests = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[BROWSER CONSOLE ERROR] ${msg.text()}`);
      consoleErrors.push(msg.text());
    } else if (msg.type() === 'warning') {
      // warning, e.g. unconfigured key warning
      console.log(`[BROWSER CONSOLE WARN] ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    console.log(`[BROWSER UNHANDLED EXCEPTION] ${err.message}\n${err.stack}`);
    pageErrors.push({ message: err.message, stack: err.stack });
  });

  page.on('requestfailed', req => {
    console.log(`[NETWORK FAILED] ${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
    failedRequests.push({ url: req.url(), error: req.failure()?.errorText });
  });

  page.on('response', resp => {
    if (resp.url().includes('supabase.co')) {
      supabaseRequests.push({
        url: resp.url(),
        status: resp.status(),
        statusText: resp.statusText()
      });
      console.log(`[SUPABASE RESPONSE] ${resp.status()} ${resp.url()}`);
    }
  });

  console.log('\n--- Action 1-5: Open & Reload Application ---');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('\n--- Action A: Homepage Loads ---');
  const title = await page.title();
  console.log(`Page title: "${title}"`);
  const headerExists = await page.locator('nav').count();
  console.log(`Navbar rendered: ${headerExists > 0}`);
  const heroExists = await page.locator('text=Authentic Indian Flavors').count();
  console.log(`Hero banner rendered: ${heroExists > 0}`);

  console.log('\n--- Action B & C: Product Catalog & Categories Load ---');
  // Click 'Explore All Spices' or navigate to products
  const exploreBtn = page.locator('button:has-text("Explore All Spices")').first();
  if (await exploreBtn.count() > 0) {
    await exploreBtn.click();
    await page.waitForTimeout(1500);
  }

  const categoryButtons = await page.locator('button:has-text("All Spices")').count();
  console.log(`Category "All Spices" pill exists: ${categoryButtons > 0}`);

  console.log('\n--- Action D & E: Product Cards & Product Images Render ---');
  const productCards = await page.locator('.aspect-4\\/3, .group').count();
  console.log(`Product elements found: ${productCards}`);

  const productImages = await page.locator('img').evaluateAll(imgs =>
    imgs.map(img => ({
      src: img.src.substring(0, 60),
      complete: img.complete,
      naturalWidth: img.naturalWidth
    }))
  );
  console.log(`Total images rendered on page: ${productImages.length}`);

  console.log('\n--- Action F: Product Variant / Weight Selection ---');
  const variantSelect = page.locator('select').first();
  if (await variantSelect.count() > 0) {
    const options = await variantSelect.locator('option').allInnerTexts();
    console.log(`Available variant options: ${options.join(', ')}`);
    if (options.length > 1) {
      await variantSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);
      console.log('Variant selection changed successfully.');
    }
  } else {
    console.log('No select dropdowns on current view (checking if variants are pills/buttons or empty state).');
  }

  console.log('\n--- Action G: Search Works ---');
  const searchInput = page.locator('input[placeholder*="Search"]').first();
  if (await searchInput.count() > 0) {
    await searchInput.fill('Haldi');
    await page.waitForTimeout(500);
    console.log('Search input filled with "Haldi".');
    await searchInput.fill('');
    await page.waitForTimeout(500);
    console.log('Search input cleared.');
  }

  console.log('\n--- Action H: Category Filtering Works ---');
  const categoryPills = page.locator('button:has-text("All Spices")').first();
  if (await categoryPills.count() > 0) {
    await categoryPills.click();
    await page.waitForTimeout(500);
    console.log('Clicked "All Spices" category pill.');
  }

  console.log('\n--- Action I: Add Product to Cart Works ---');
  const addToCartBtn = page.locator('button:has-text("Add to Cart")').first();
  if (await addToCartBtn.count() > 0) {
    await addToCartBtn.click();
    await page.waitForTimeout(1000);
    console.log('Clicked "Add to Cart" button.');
  } else {
    console.log('No "Add to Cart" button visible on page.');
  }

  console.log('\n--- Action J: Cart Opens ---');
  const cartNavBtn = page.locator('button[aria-label*="cart" i], nav button:has-text("Cart"), nav a[href*="cart"]').first();
  const cartBtnFallback = page.locator('nav button').filter({ hasText: /cart|\d+/i }).first();
  
  // Try navigating to #cart
  await page.evaluate(() => {
    window.location.hash = 'cart';
  });
  await page.waitForTimeout(1000);
  const cartHeader = await page.locator('text=Your Shopping Cart').count();
  console.log(`Cart view opened: ${cartHeader > 0}`);

  console.log('\n--- Action K: Admin Panel Opens ---');
  await page.evaluate(() => {
    window.location.hash = 'admin';
  });
  await page.waitForTimeout(1000);
  const adminModal = await page.locator('text=Admin Access Required, text=Super Admin').count();
  console.log(`Admin Gateway/Modal rendered: ${adminModal > 0}`);

  console.log('\n=== TEST SUMMARY ===');
  console.log(`Total Browser Console Errors: ${consoleErrors.length}`);
  console.log(`Total Page Errors (Uncaught Exceptions): ${pageErrors.length}`);
  console.log(`Total Failed Network Requests: ${failedRequests.length}`);
  console.log(`Total Supabase Requests Made: ${supabaseRequests.length}`);

  if (consoleErrors.length > 0) {
    console.log('CONSOLE ERRORS DETAIL:');
    consoleErrors.forEach((e, idx) => console.log(`  ${idx + 1}: ${e}`));
  }

  if (pageErrors.length > 0) {
    console.log('PAGE EXCEPTIONS DETAIL:');
    pageErrors.forEach((e, idx) => console.log(`  ${idx + 1}: ${e.message}`));
  }

  await browser.close();

  if (consoleErrors.length === 0 && pageErrors.length === 0) {
    console.log('\n>>> RESULT: ZERO RUNTIME ERRORS <<<');
    process.exit(0);
  } else {
    console.log('\n>>> RESULT: RUNTIME ERRORS DETECTED <<<');
    process.exit(1);
  }
}

runBrowserTest().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
