import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Vite/); // Update if you have a specific title in index.html
});

test('login link works', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  // Click the get started link.
  // This depends on the UI, modify it to fit the actual landing page.
  // Example:
  // await page.getByRole('button', { name: 'Login' }).click();
  // await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
