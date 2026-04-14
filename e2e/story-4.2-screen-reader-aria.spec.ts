import { expect, test } from '@playwright/test';

import { TodoTracker } from './fixtures/test-cleanup';

const tracker = new TodoTracker();

test.describe('Story 4.2 - Screen Reader Support & ARIA', () => {
	function escapeRegExp(value: string) {
		return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	function todoCheckbox(page: import('@playwright/test').Page, description: string) {
		return page.getByRole('checkbox', {
			name: new RegExp(`^Mark ${escapeRegExp(description)} as (?:complete|active)$`),
		});
	}

	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('domcontentloaded');
		await page.locator('h1').waitFor({ state: 'visible', timeout: 5000 });
	});

	test.afterEach(async ({ request }) => {
		await tracker.cleanup(request);
	});

	async function createTodo(page: import('@playwright/test').Page, text: string) {
		const input = page.locator('[placeholder="Add a new task..."]');
		await input.fill(text);
		await input.press('Enter');
		await page.locator(`text=${text}`).first().waitFor({ state: 'visible', timeout: 5000 });
		tracker.track(text);
	}

	test('add button has aria-label "Add task"', async ({ page }) => {
		const addBtn = page.getByRole('button', { name: 'Add task' });
		await expect(addBtn).toBeVisible();
		await expect(addBtn).toHaveAttribute('aria-label', 'Add task');
	});

	test('delete button aria-label includes task text', async ({ page }) => {
		const todoText = `ARIA del ${Date.now()}`;
		await createTodo(page, todoText);

		const deleteBtn = page.locator(`button[aria-label="Delete: ${todoText}"]`);
		await expect(deleteBtn).toBeAttached();
	});

	test('checkbox label says "Mark [task] as complete" for active todo', async ({ page }) => {
		const todoText = `ARIA cb ${Date.now()}`;
		await createTodo(page, todoText);

		const checkbox = page.getByRole('checkbox', {
			name: `Mark ${todoText} as complete`,
		});
		await expect(checkbox).toBeVisible();
	});

	test('checkbox label says "Mark [task] as active" for completed todo', async ({ page }) => {
		const todoText = `ARIA done ${Date.now()}`;
		await createTodo(page, todoText);

		const checkbox = todoCheckbox(page, todoText);
		await checkbox.click();

		const updatedCheckbox = page.getByRole('checkbox', {
			name: `Mark ${todoText} as active`,
		});
		await expect(updatedCheckbox).toBeVisible({ timeout: 5000 });
		await expect(updatedCheckbox).toBeChecked();
	});

	test('due date trigger says "Set due date for [task]" when no date', async ({ page }) => {
		const todoText = `ARIA due ${Date.now()}`;
		await createTodo(page, todoText);

		const dueTrigger = page.getByRole('button', {
			name: `Set due date for ${todoText}`,
		});
		await expect(dueTrigger).toBeAttached();
	});

	test('filter tabs use tablist/tab roles with aria-selected', async ({ page }) => {
		const tablist = page.getByRole('tablist');
		await expect(tablist).toBeVisible();

		const allTab = page.getByRole('tab', { name: /all,.*tasks/i });
		const activeTab = page.getByRole('tab', { name: /active,.*tasks/i });
		const completedTab = page.getByRole('tab', { name: /completed,.*tasks/i });

		await expect(allTab).toHaveAttribute('aria-selected', 'true');
		await expect(activeTab).toHaveAttribute('aria-selected', 'false');
		await expect(completedTab).toHaveAttribute('aria-selected', 'false');

		await activeTab.click();
		await expect(activeTab).toHaveAttribute('aria-selected', 'true');
		await expect(allTab).toHaveAttribute('aria-selected', 'false');
	});

	test('sort toolbar has aria-label and buttons have aria-pressed', async ({ page }) => {
		const todoText = `ARIA sort ${Date.now()}`;
		await createTodo(page, todoText);

		const toolbar = page.getByRole('toolbar', { name: 'Sort options' });
		await expect(toolbar).toBeVisible();

		const dueBtn = page.getByRole('button', { name: /sort by due date/i });
		const statusBtn = page.getByRole('button', { name: /sort by status/i });
		await expect(dueBtn).toHaveAttribute('aria-pressed', 'true');
		await expect(statusBtn).toHaveAttribute('aria-pressed', 'false');

		await statusBtn.click();
		await expect(statusBtn).toHaveAttribute('aria-pressed', 'true');
		await expect(dueBtn).toHaveAttribute('aria-pressed', 'false');
	});

	test('filter change announces count in polite live region', async ({ page }) => {
		const todoText = `ARIA live ${Date.now()}`;
		await createTodo(page, todoText);

		await page.getByRole('tab', { name: /active,.*tasks/i }).click();

		const liveRegion = page.locator('[data-testid="filter-announcement"]');
		await expect(liveRegion).toHaveText(/\d+ tasks shown/, { timeout: 5000 });
	});

	test('"Task added" announced in polite live region after create', async ({ page }) => {
		const todoText = `ARIA announce ${Date.now()}`;
		await createTodo(page, todoText);

		const createLiveRegion = page.locator('[data-testid="create-announcement"]');
		await expect(createLiveRegion).toHaveText('Task added', { timeout: 5000 });
	});

	test('error banner uses role="alert" and aria-live="assertive"', async ({ page }) => {
		await page.route('**/api/todos', (route) => {
			if (route.request().method() === 'POST') {
				route.fulfill({
					status: 500,
					body: JSON.stringify({ statusCode: 500, message: 'fail' }),
				});
			} else {
				route.continue();
			}
		});

		const input = page.locator('[placeholder="Add a new task..."]');
		await input.fill('Error test');
		await input.press('Enter');

		const banner = page.locator('[data-testid="error-banner"]');
		await expect(banner).toBeVisible({ timeout: 5000 });
		await expect(banner).toHaveAttribute('role', 'alert');
		await expect(banner).toHaveAttribute('aria-live', 'assertive');
	});

	test('add section uses <form> element', async ({ page }) => {
		const form = page.locator('section[aria-label="Add new todo"] form');
		await expect(form).toBeAttached();
	});

	test('todo list renders as <ul> with <li> items', async ({ page }) => {
		const todoText = `ARIA list ${Date.now()}`;
		await createTodo(page, todoText);

		const ul = page.locator('#todo-list ul');
		await expect(ul).toBeVisible();

		const lis = ul.locator(':scope > li');
		const count = await lis.count();
		expect(count).toBeGreaterThanOrEqual(1);
	});
});
