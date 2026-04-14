import { expect, test } from '@playwright/test';

import { TodoPage } from './fixtures/todo-page';

test.describe('Todo Error States', () => {
	let todoPage: TodoPage;

	test.beforeEach(async ({ page }) => {
		todoPage = new TodoPage(page);
		await todoPage.goto();
	});

	test.afterEach(async ({ request }) => {
		await todoPage.cleanup(request);
	});

	test('empty state shows on first visit (clean database)', async () => {
		await todoPage.page.route('**/api/todos', (route) => {
			if (route.request().method() === 'GET') {
				route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify([]),
				});
			} else {
				route.continue();
			}
		});
		await todoPage.page.reload();
		await todoPage.page.waitForLoadState('domcontentloaded');
		await todoPage.page.locator('h1').waitFor({ state: 'visible', timeout: 5000 });
		const emptyState = await todoPage.getEmptyState();
		expect(emptyState).toBe('No tasks yet');
	});

	test('mock network error → error banner appears → verify message text', async () => {
		await todoPage.addTodo(`Seed todo ${Date.now()}`);

		await todoPage.page.route('**/api/todos', (route) => {
			if (route.request().method() === 'POST') {
				route.fulfill({
					status: 500,
					body: JSON.stringify({
						statusCode: 500,
						error: 'Internal Server Error',
						message: 'Something went wrong',
					}),
				});
			} else {
				route.continue();
			}
		});

		const input = todoPage.page.locator('[placeholder="Add a new task..."]');
		await input.fill('Failing task');
		await input.press('Enter');

		const banner = todoPage.page.locator('[data-testid="error-banner"]');
		await expect(banner).toBeVisible({ timeout: 5000 });
		await expect(banner).toHaveAttribute('role', 'alert');

		const errorText = await todoPage.getErrorBanner();
		expect(errorText).toBeTruthy();
		expect(errorText).toContain("Couldn't add that task");
	});

	test('error banner clears on next successful action', async () => {
		await todoPage.page.route('**/api/todos', (route) => {
			if (route.request().method() === 'POST') {
				route.fulfill({
					status: 500,
					body: JSON.stringify({
						statusCode: 500,
						error: 'Internal Server Error',
						message: 'fail',
					}),
				});
			} else {
				route.continue();
			}
		});

		const input = todoPage.page.locator('[placeholder="Add a new task..."]');

		await input.fill('Fail first');
		await input.press('Enter');

		const banner = todoPage.page.locator('[data-testid="error-banner"]');
		await expect(banner).toBeVisible({ timeout: 5000 });

		await todoPage.page.unroute('**/api/todos');

		await todoPage.addTodo(`Success ${Date.now()}`);

		await expect(banner).not.toBeVisible({ timeout: 5000 });
	});
});
