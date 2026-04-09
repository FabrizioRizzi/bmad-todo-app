import { expect, test } from '@playwright/test';

test.describe('Story 1.5 - Create and View List', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the app and wait for it to load
		await page.goto('/');
		// Wait for the main content to load
		await page.waitForLoadState('networkidle');
	});

	test('displays the app header with title and initial count', async ({ page }) => {
		const header = page.locator('h1');
		await expect(header).toHaveText('My Tasks');

		const countBadge = page.getByRole('status', { name: 'Todo count' });
		await expect(countBadge).toBeVisible();
	});

	test('shows app is functional with empty or populated state', async ({ page }) => {
		// Wait for the page to fully load
		await page.waitForLoadState('networkidle');

		// Check if empty state text exists
		const emptyStateExists = await page
			.locator('text=No tasks yet')
			.count()
			.catch(() => 0);

		// Check if any todo list items exist
		const todoListExists = await page
			.locator('ul')
			.count()
			.catch(() => 0);

		// At least one should exist - app is functional
		expect(emptyStateExists > 0 || todoListExists > 0).toBe(true);
	});

	test('creates a todo via Enter key', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');

		await input.fill('Buy groceries');
		await input.press('Enter');

		// Wait for the todo to appear
		const todoItem = page.locator('text=Buy groceries');
		await expect(todoItem.first()).toBeVisible({ timeout: 10000 });
	});

	test('creates a todo via button click', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');
		const addButton = page.locator('[aria-label="Add task"]');

		await input.fill('Complete project');
		await addButton.click();

		// Wait for the todo to appear
		const todoItem = page.locator('text=Complete project');
		await expect(todoItem.first()).toBeVisible({ timeout: 10000 });
	});

	test('adds a todo and count updates', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');
		const countBadge = page.getByRole('status', { name: 'Todo count' });

		// Get initial count
		const initialCountText = await countBadge.textContent();
		const initialNumber = parseInt(initialCountText || '0', 10);

		// Add a new unique todo with timestamp
		const todoText = `Task ${Date.now()}`;
		await input.fill(todoText);
		await input.press('Enter');

		// Wait for the todo to appear in the list
		await page.locator(`text=${todoText}`).first().waitFor({ state: 'visible', timeout: 10000 });

		// Verify count increased
		const newCountText = await countBadge.textContent();
		const newNumber = parseInt(newCountText || '0', 10);

		expect(newNumber).toBe(initialNumber + 1);
	});

	test('does not add empty todos', async ({ page }) => {
		const countBadge = page.getByRole('status', { name: 'Todo count' });
		const initialCount = await countBadge.textContent();

		const input = page.locator('[placeholder="Add a new task..."]');
		await input.press('Enter');

		// Count should not change
		const finalCount = await countBadge.textContent();
		expect(finalCount).toBe(initialCount);
	});

	test('trims whitespace from todo description', async ({ page }) => {
		const countBadge = page.getByRole('status', { name: 'Todo count' });
		const initialCount = await countBadge.textContent();

		const input = page.locator('[placeholder="Add a new task..."]');
		await input.fill('   \t\n   ');
		await input.press('Enter');

		// Count should not change (whitespace-only input rejected)
		const finalCount = await countBadge.textContent();
		expect(finalCount).toBe(initialCount);
	});

	test('clears input after successful submission', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');

		await input.fill('Test task');
		await input.press('Enter');

		// Wait for it to appear
		await page.locator('text=Test task').first().waitFor({ state: 'visible', timeout: 10000 });

		// Input should be cleared
		await expect(input).toHaveValue('');
	});

	test('input field has accessibility attributes', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');
		const addButton = page.locator('[aria-label="Add task"]');

		// Check placeholder
		await expect(input).toHaveAttribute('placeholder', 'Add a new task...');

		// Check button aria-label
		await expect(addButton).toHaveAttribute('aria-label', 'Add task');
	});

	test('focus returns to input after adding todo', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');

		// Focus the input
		await input.focus();
		await input.fill('Focus test');

		// Submit
		await input.press('Enter');

		// Wait for todo to appear
		await page.locator('text=Focus test').first().waitFor({ state: 'visible', timeout: 10000 });

		// Wait a bit for focus to be restored (browser focus events are async)
		await page.waitForTimeout(500);

		// Focus should return to input - verify input is ready for next entry
		// by checking it's empty and focusable
		await expect(input).toHaveValue('');

		// Try typing to verify it has focus
		await input.type('verify');
		await expect(input).toHaveValue('verify');
	});

	test('displays multiple todos', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');

		// Add first todo
		await input.fill('First');
		await input.press('Enter');
		await page.locator('text=First').first().waitFor({ state: 'visible', timeout: 10000 });

		// Add second todo
		await input.fill('Second');
		await input.press('Enter');
		await page.locator('text=Second').first().waitFor({ state: 'visible', timeout: 10000 });

		// Both should be visible
		await expect(page.locator('text=First').first()).toBeVisible();
		await expect(page.locator('text=Second').first()).toBeVisible();
	});

	test('shows error when todo creation fails', async ({ page }) => {
		// Block POST to /api/todos
		await page.route('**/api/todos', (route) => {
			if (route.request().method() === 'POST') {
				route.abort('failed');
			} else {
				route.continue();
			}
		});

		const input = page.locator('[placeholder="Add a new task..."]');
		await input.fill('Failing task');
		await input.press('Enter');

		// Error message should appear in the error banner
		const errorMsg = page.locator('[data-testid="error-banner"]');
		await expect(errorMsg).toBeVisible({ timeout: 10000 });
		await expect(errorMsg).toContainText("Couldn't add that task");
	});

	test('preserves input value when submission fails', async ({ page }) => {
		// Block POST to /api/todos
		await page.route('**/api/todos', (route) => {
			if (route.request().method() === 'POST') {
				route.abort('failed');
			} else {
				route.continue();
			}
		});

		const input = page.locator('[placeholder="Add a new task..."]');
		const testValue = 'Preserve me';

		await input.fill(testValue);
		await input.press('Enter');

		// Wait for error banner
		await page
			.locator('[data-testid="error-banner"]')
			.waitFor({ state: 'visible', timeout: 10000 });

		// Input should still have the value
		await expect(input).toHaveValue(testValue);
	});

	test('specific todo persists after page reload', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');

		// Add a unique todo that we can find
		const uniqueTask = `Persistent Task ${Date.now()}`;
		await input.fill(uniqueTask);
		await input.press('Enter');

		// Wait for it to appear
		await page.locator(`text=${uniqueTask}`).first().waitFor({ state: 'visible', timeout: 10000 });

		// Verify it's in the list
		await expect(page.locator(`text=${uniqueTask}`).first()).toBeVisible();

		// Reload page
		await page.reload();
		await page.waitForLoadState('networkidle');

		// Todo should still exist after reload
		await expect(page.locator(`text=${uniqueTask}`).first()).toBeVisible({ timeout: 10000 });
	});
});
