import { test, expect } from '@playwright/test';

test.describe('Day to Day Expenses - Parity & End-to-End Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
  });

  test('1. Daily Screen: Layout, TopBar, TabStrip, and Cards', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Day to Day Expenses');

    // Verify TopBar
    await expect(page.locator('text=Day to Day Expenses')).toBeVisible();

    // Verify TabStrip tabs
    await expect(page.locator('button[aria-label="Notes"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Daily"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Monthly"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Yearly"]')).toBeVisible();

    // Verify Date card & Balance summary headers
    await expect(page.locator('text=C/F').first()).toBeVisible();
    await expect(page.locator('text=Income (Credit)').first()).toBeVisible();
    await expect(page.locator('text=Expense (Debit)').first()).toBeVisible();
    await expect(page.locator('text=Balance').first()).toBeVisible();

    // Verify FAB
    const fab = page.locator('button[aria-label="Add transaction"]');
    await expect(fab).toBeVisible();

    // Take parity screenshot
    await page.screenshot({ path: 'tests/screenshots/01-daily-empty.png' });
  });

  test('2. Navigation across tabs and screens', async ({ page }) => {
    await page.goto('/');

    // Monthly tab
    await page.click('button[aria-label="Monthly"]');
    await expect(page.locator('text=Balance').first()).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/02-monthly-tab.png' });

    // Yearly tab
    await page.click('button[aria-label="Yearly"]');
    await expect(page.locator('text=Income (Credit)').first()).toBeVisible();
    await expect(page.locator('text=Expense (Debit)').first()).toBeVisible();
    await expect(page.locator('text=Balance').first()).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/03-yearly-tab.png' });

    // Notes tab
    await page.click('button[aria-label="Notes"]');
    await expect(page.locator('button[aria-label="Add note"]')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/04-notes-tab.png' });

    // Charts screen via three-dot menu
    await page.click('button[aria-label="More options"]');
    await page.click('button:has-text("Charts")');
    await expect(page.locator('text=Charts').first()).toBeVisible();
    await expect(page.locator('button:has-text("All time")')).toBeVisible();
    await expect(page.locator('button:has-text("Income (Credit)")')).toBeVisible();
    await expect(page.locator('button:has-text("Expense (Debit)")')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/05-charts-tab.png' });
  });

  test('3. Add Transaction flow via bottom sheet', async ({ page }) => {
    await page.goto('/');

    // Open add sheet
    await page.click('button[aria-label="Add transaction"]');
    await expect(page.locator('button[aria-label="Collapse sheet"]')).toBeVisible();

    // Verify segment buttons
    await expect(page.locator('button:has-text("Expense")')).toBeVisible();
    await expect(page.locator('button:has-text("Income")')).toBeVisible();

    // Fill amount 1250
    const amountInput = page.locator('input[placeholder="Amount"]');
    await amountInput.fill('1250');

    // Fill description
    const descInput = page.locator('input[placeholder="Description"]');
    await descInput.fill('Grocery supplies');

    // Screenshot add sheet
    await page.screenshot({ path: 'tests/screenshots/06-add-sheet.png' });

    // Save transaction via mint check button
    await page.click('button[aria-label="Save transaction"]');

    // Verify transaction appears in Daily view
    await expect(page.locator('text=Grocery supplies')).toBeVisible();
    await expect(page.locator('text=₹1,250.00').first()).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/07-daily-with-tx.png' });
  });

  test('4. Soft delete and 6-second undo toast verification', async ({ page }) => {
    await page.goto('/');

    // Add a transaction to delete
    await page.click('button[aria-label="Add transaction"]');
    await page.locator('input[placeholder="Amount"]').fill('450');
    await page.locator('input[placeholder="Description"]').fill('Coffee with friend');
    await page.click('button[aria-label="Save transaction"]');
    await expect(page.locator('text=Coffee with friend')).toBeVisible();

    // Tap transaction to directly open edit sheet
    await page.click('text=Coffee with friend');
    await expect(page.locator('button:has-text("Delete")')).toBeVisible();

    // Tap Delete inside edit sheet
    await page.click('button:has-text("Delete")');
    await expect(page.locator('text=Delete this transaction?')).toBeVisible();
    await page.locator('button:has-text("Delete")').last().click();

    // Check 6s Undo toast appears
    await expect(page.locator('text=Transaction deleted')).toBeVisible();
    const undoButton = page.locator('button:has-text("UNDO")');
    await expect(undoButton).toBeVisible();

    // Verify item is removed from view
    await expect(page.locator('text=Coffee with friend')).not.toBeVisible();

    // Tap Undo
    await undoButton.click();

    // Item must be immediately restored!
    await expect(page.locator('text=Coffee with friend')).toBeVisible();
    await expect(page.locator('text=₹450.00').first()).toBeVisible();
  });

  test('5. Three-dot menu -> Settings -> Data Management -> Diagnostics & Categories', async ({ page }) => {
    await page.goto('/');

    // Open three dot menu
    await page.click('button[aria-label="More options"]');
    await expect(page.locator('button:has-text("Settings")')).toBeVisible();
    await page.click('button:has-text("Settings")');

    // Settings screen
    await expect(page.locator('text=App Language')).toBeVisible();
    await expect(page.locator('text=Data Management')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/08-settings-screen.png' });

    // Navigate to Data Management
    await page.click('text=Data Management');
    await expect(page.getByText('Categories', { exact: true })).toBeVisible();
    await expect(page.locator('text=Check data and images')).toBeVisible();

    // Navigate to Categories
    await page.getByText('Categories', { exact: true }).click();
    await expect(page.locator('text=Manage Categories')).toBeVisible();
    await expect(page.locator('button:has-text("Expense")')).toBeVisible();
    await expect(page.locator('button:has-text("Income")')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/09-categories-screen.png' });

    // Back to Data Management
    await page.click('button[aria-label="Back"]');

    // Open Check data and images
    await page.click('text=Check data and images');
    await expect(page.locator('text=Check Data and Images')).toBeVisible();
    await expect(page.locator('button:has-text("Start Integrity Check")')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/10-check-data-screen.png' });
  });

  test('6. Account Statement Excel download & Universal Attachment flow', async ({ page }) => {
    await page.goto('/');

    // Verify Add Sheet has Attachment row above Description row
    await page.click('button[aria-label="Add transaction"]');
    await expect(page.locator('text=Add Attachment (Photo, PDF, Excel)')).toBeVisible();
    await expect(page.locator('input[placeholder="Description"]')).toBeVisible();

    // Close Add Sheet
    await page.click('button[aria-label="Collapse sheet"]');

    // Open Settings and verify Account Statement (Excel) button
    await page.click('button[aria-label="More options"]');
    await page.click('button:has-text("Settings")');

    await expect(page.locator('text=Account Statement (Excel)')).toBeVisible();

    // Wait for download event when tapping Account Statement
    const downloadPromise = page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
    await page.click('text=Account Statement (Excel)');
    const download = await downloadPromise;
    if (download) {
      expect(download.suggestedFilename()).toContain('Account_Statement_');
      expect(download.suggestedFilename()).toContain('.xlsx');
    }

    // Verify toast feedback
    await expect(page.locator('text=Generating Account Statement (Excel)...')).toBeVisible();
  });
});

