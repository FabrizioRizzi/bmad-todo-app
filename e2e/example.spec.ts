import { expect, test } from '@playwright/test';

test('homepage loads and displays the app header', async ({ page }) => {
	await page.goto('/');

	// Wait for the app header to load
	const header = page.locator('h1');
	await expect(header).toHaveText('My Tasks');

	// Verify the count badge is present
	const countBadge = page.getByRole('status', { name: 'Todo count' });
	await expect(countBadge).toBeVisible();
});
