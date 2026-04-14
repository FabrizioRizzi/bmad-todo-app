import { expect, test } from '@playwright/test';

import { TodoTracker } from './fixtures/test-cleanup';

const tracker = new TodoTracker();

test.describe('Story 2.2 - Delete Todo with Undo', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('domcontentloaded');
		await page.locator('h1').waitFor({ state: 'visible', timeout: 5000 });
	});

	test.afterEach(async ({ request }) => {
		await tracker.cleanup(request);
	});

	function deleteButton(page: import('@playwright/test').Page, description: string) {
		return page.locator(`button[aria-label="Delete: ${description}"]`);
	}

	async function createTodo(page: import('@playwright/test').Page, text: string) {
		const input = page.locator('[placeholder="Add a new task..."]');
		await input.fill(text);
		await input.press('Enter');
		await page.locator(`text=${text}`).first().waitFor({ state: 'visible', timeout: 5000 });
		tracker.track(text);
	}

	test('delete button is visible on todo cards', async ({ page }) => {
		const todoText = `Del visible ${Date.now()}`;
		await createTodo(page, todoText);

		const btn = deleteButton(page, todoText);
		await expect(btn).toBeAttached();
	});

	test('clicking delete removes card and shows undo toast', async ({ page }) => {
		const todoText = `Del toast ${Date.now()}`;
		await createTodo(page, todoText);

		const btn = deleteButton(page, todoText);
		await btn.click({ force: true });

		await expect(page.locator('[data-testid="undo-toast"]')).toBeVisible({ timeout: 3000 });
		await expect(page.locator('text=Task deleted')).toBeVisible();
		await expect(page.locator('button:has-text("Undo")')).toBeVisible();

		await page.waitForTimeout(300);
		await expect(page.locator(`text=${todoText}`)).not.toBeVisible();
	});

	test('undo restores the deleted card', async ({ page }) => {
		const todoText = `Undo restore ${Date.now()}`;
		await createTodo(page, todoText);

		const btn = deleteButton(page, todoText);
		await btn.click({ force: true });

		await expect(page.locator('[data-testid="undo-toast"]')).toBeVisible({ timeout: 3000 });

		await page.locator('button:has-text("Undo")').click();

		await expect(page.locator(`text=${todoText}`).first()).toBeVisible({ timeout: 3000 });
		await expect(page.locator('[data-testid="undo-toast"]')).not.toBeVisible();
	});

	test('undo does not send DELETE API call', async ({ page }) => {
		const todoText = `No API ${Date.now()}`;
		await createTodo(page, todoText);

		const deleteRequests: string[] = [];
		await page.route('**/api/todos/**', (route) => {
			if (route.request().method() === 'DELETE') {
				deleteRequests.push(route.request().url());
			}
			route.continue();
		});

		const btn = deleteButton(page, todoText);
		await btn.click({ force: true });

		await expect(page.locator('[data-testid="undo-toast"]')).toBeVisible({ timeout: 3000 });
		await page.locator('button:has-text("Undo")').click();

		await page.waitForTimeout(1000);
		expect(deleteRequests).toHaveLength(0);
	});

	test('timer expiry fires DELETE API call and removes card permanently', async ({ page }) => {
		const todoText = `Timer fire ${Date.now()}`;
		await createTodo(page, todoText);

		const deleteRequests: string[] = [];
		page.on('request', (request) => {
			if (request.method() === 'DELETE' && request.url().includes('/api/todos/')) {
				deleteRequests.push(request.url());
			}
		});

		const btn = deleteButton(page, todoText);
		await btn.click({ force: true });

		await expect(page.locator('[data-testid="undo-toast"]')).toBeVisible({ timeout: 3000 });

		await page.waitForTimeout(5500);

		expect(deleteRequests.length).toBeGreaterThanOrEqual(1);

		await page.reload();
		await page.waitForLoadState('networkidle');
		await expect(page.locator(`text=${todoText}`)).not.toBeVisible({ timeout: 3000 });
	});

	test('DELETE failure restores card and shows error', async ({ page }) => {
		const todoText = `Del fail ${Date.now()}`;
		await createTodo(page, todoText);

		await page.route('**/api/todos/*', (route) => {
			if (route.request().method() === 'DELETE') {
				route.fulfill({
					status: 500,
					body: JSON.stringify({
						statusCode: 500,
						error: 'Internal Server Error',
						message: 'DB error',
					}),
				});
			} else {
				route.continue();
			}
		});

		const btn = deleteButton(page, todoText);
		await btn.click({ force: true });

		await page.waitForTimeout(6000);

		await expect(page.locator(`text=${todoText}`).first()).toBeVisible({ timeout: 5000 });
		await expect(page.locator("text=Couldn't delete that task — try again.")).toBeVisible({
			timeout: 3000,
		});
	});

	test('count badge updates after delete', async ({ page }) => {
		const todoText = `Count update ${Date.now()}`;
		await createTodo(page, todoText);

		const countBadge = page.locator('[role="status"][aria-label="Todo count"]');
		const initialCountText = await countBadge.textContent();
		const initialNumber = Number.parseInt(initialCountText?.replace(/\D/g, '') || '0', 10);

		const btn = deleteButton(page, todoText);
		await btn.click({ force: true });

		await page.waitForTimeout(500);

		const expectedRemaining = initialNumber - 1;
		await expect(countBadge).toContainText(`${expectedRemaining}`, { timeout: 3000 });
	});

	test('empty state shows when last todo is deleted', async ({ page }) => {
		await page.route('**/api/todos', (route) => {
			if (route.request().method() === 'GET') {
				route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify([
						{
							id: 'test-empty-id',
							description: 'Last todo',
							isCompleted: false,
							createdAt: new Date().toISOString(),
							dueDate: null,
						},
					]),
				});
			} else {
				route.continue();
			}
		});

		await page.reload();
		await page.waitForLoadState('networkidle');

		await expect(page.locator('text=Last todo').first()).toBeVisible({ timeout: 5000 });

		const btn = deleteButton(page, 'Last todo');
		await btn.click({ force: true });

		await page.waitForTimeout(300);

		await expect(page.locator('text=No tasks yet')).toBeVisible({ timeout: 3000 });
	});

	test('multiple deletes: new delete replaces old toast', async ({ page }) => {
		const todo1 = `Multi A ${Date.now()}`;
		await createTodo(page, todo1);
		await page.waitForTimeout(100);
		const todo2 = `Multi B ${Date.now()}`;
		await createTodo(page, todo2);

		const btn1 = deleteButton(page, todo1);
		await btn1.click({ force: true });

		await expect(page.locator('[data-testid="undo-toast"]')).toBeVisible({ timeout: 3000 });

		const btn2 = deleteButton(page, todo2);
		await btn2.click({ force: true });

		await expect(page.locator('[data-testid="undo-toast"]')).toBeVisible({ timeout: 3000 });
		const toasts = page.locator('[data-testid="undo-toast"]');
		await expect(toasts).toHaveCount(1);
	});
});
