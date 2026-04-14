import { expect, test } from '@playwright/test';

import { TodoTracker } from './fixtures/test-cleanup';

const tracker = new TodoTracker();

test.describe('Story 1.5 - Create and View List', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
	});

	test.afterEach(async ({ request }) => {
		await tracker.cleanup(request);
	});

	test('displays the app header with title and initial count', async ({ page }) => {
		const header = page.locator('h1');
		await expect(header).toHaveText('My Tasks');

		const countBadge = page.getByRole('status', { name: 'Todo count' });
		await expect(countBadge).toBeVisible();
	});

	test('shows app is functional with empty or populated state', async ({ page }) => {
		await page.waitForLoadState('networkidle');

		const emptyStateExists = await page
			.locator('text=No tasks yet')
			.count()
			.catch(() => 0);

		const todoListExists = await page
			.locator('ul')
			.count()
			.catch(() => 0);

		expect(emptyStateExists > 0 || todoListExists > 0).toBe(true);
	});

	test('creates a todo via Enter key', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');
		const todoText = `Buy groceries ${Date.now()}`;
		tracker.track(todoText);

		await input.fill(todoText);
		await input.press('Enter');

		const todoItem = page.locator(`text=${todoText}`);
		await expect(todoItem.first()).toBeVisible({ timeout: 10000 });
	});

	test('creates a todo via button click', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');
		const addButton = page.locator('[aria-label="Add task"]');
		const todoText = `Complete project ${Date.now()}`;
		tracker.track(todoText);

		await input.fill(todoText);
		await addButton.click();

		const todoItem = page.locator(`text=${todoText}`);
		await expect(todoItem.first()).toBeVisible({ timeout: 10000 });
	});

	test('adds a todo and count updates', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');
		const countBadge = page.getByRole('status', { name: 'Todo count' });

		const initialCountText = await countBadge.textContent();
		const initialNumber = parseInt(initialCountText || '0', 10);

		const todoText = `Task ${Date.now()}`;
		tracker.track(todoText);
		await input.fill(todoText);
		await input.press('Enter');

		await page.locator(`text=${todoText}`).first().waitFor({ state: 'visible', timeout: 10000 });

		const newCountText = await countBadge.textContent();
		const newNumber = parseInt(newCountText || '0', 10);

		expect(newNumber).toBe(initialNumber + 1);
	});

	test('does not add empty todos', async ({ page }) => {
		const countBadge = page.getByRole('status', { name: 'Todo count' });
		const initialCount = await countBadge.textContent();

		const input = page.locator('[placeholder="Add a new task..."]');
		await input.press('Enter');

		const finalCount = await countBadge.textContent();
		expect(finalCount).toBe(initialCount);
	});

	test('trims whitespace from todo description', async ({ page }) => {
		const countBadge = page.getByRole('status', { name: 'Todo count' });
		const initialCount = await countBadge.textContent();

		const input = page.locator('[placeholder="Add a new task..."]');
		await input.fill('   \t\n   ');
		await input.press('Enter');

		const finalCount = await countBadge.textContent();
		expect(finalCount).toBe(initialCount);
	});

	test('clears input after successful submission', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');
		const todoText = `Test task ${Date.now()}`;
		tracker.track(todoText);

		await input.fill(todoText);
		await input.press('Enter');

		await page.locator(`text=${todoText}`).first().waitFor({ state: 'visible', timeout: 10000 });

		await expect(input).toHaveValue('');
	});

	test('input field has accessibility attributes', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');
		const addButton = page.locator('[aria-label="Add task"]');

		await expect(input).toHaveAttribute('placeholder', 'Add a new task...');
		await expect(addButton).toHaveAttribute('aria-label', 'Add task');
	});

	test('focus returns to input after adding todo', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');
		const todoText = `Focus test ${Date.now()}`;
		tracker.track(todoText);

		await input.focus();
		await input.fill(todoText);
		await input.press('Enter');

		await page.locator(`text=${todoText}`).first().waitFor({ state: 'visible', timeout: 10000 });

		await page.waitForTimeout(500);
		await expect(input).toHaveValue('');

		await input.type('verify');
		await expect(input).toHaveValue('verify');
	});

	test('displays multiple todos', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');
		const first = `First ${Date.now()}`;
		const second = `Second ${Date.now()}`;
		tracker.track(first);
		tracker.track(second);

		await input.fill(first);
		await input.press('Enter');
		await page.locator(`text=${first}`).first().waitFor({ state: 'visible', timeout: 10000 });

		await input.fill(second);
		await input.press('Enter');
		await page.locator(`text=${second}`).first().waitFor({ state: 'visible', timeout: 10000 });

		await expect(page.locator(`text=${first}`).first()).toBeVisible();
		await expect(page.locator(`text=${second}`).first()).toBeVisible();
	});

	test('shows error when todo creation fails', async ({ page }) => {
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

		const errorMsg = page.locator('[data-testid="error-banner"]');
		await expect(errorMsg).toBeVisible({ timeout: 10000 });
		await expect(errorMsg).toContainText("Couldn't add that task");
	});

	test('preserves input value when submission fails', async ({ page }) => {
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

		await page
			.locator('[data-testid="error-banner"]')
			.waitFor({ state: 'visible', timeout: 10000 });

		await expect(input).toHaveValue(testValue);
	});

	test('specific todo persists after page reload', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');

		const uniqueTask = `Persistent Task ${Date.now()}`;
		tracker.track(uniqueTask);
		await input.fill(uniqueTask);
		await input.press('Enter');

		await page.locator(`text=${uniqueTask}`).first().waitFor({ state: 'visible', timeout: 10000 });
		await expect(page.locator(`text=${uniqueTask}`).first()).toBeVisible();

		await page.reload();
		await page.waitForLoadState('networkidle');

		await expect(page.locator(`text=${uniqueTask}`).first()).toBeVisible({ timeout: 10000 });
	});
});
