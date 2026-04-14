import { expect, test } from '@playwright/test';

import { TodoPage } from './fixtures/todo-page';

function filterTab(page: import('@playwright/test').Page, label: 'All' | 'Active' | 'Completed') {
	return page.getByRole('tab', { name: new RegExp(`^${label},`) });
}

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function todoCheckbox(page: import('@playwright/test').Page, description: string) {
	return page.getByRole('checkbox', {
		name: new RegExp(`^Mark ${escapeRegExp(description)} as (?:complete|active)$`),
	});
}

function makeMockTodo(
	overrides: Partial<{
		id: string;
		description: string;
		isCompleted: boolean;
		dueDate: string | null;
	}>,
) {
	return {
		id: overrides.id ?? crypto.randomUUID(),
		description: overrides.description ?? 'Mock todo',
		isCompleted: overrides.isCompleted ?? false,
		createdAt: new Date().toISOString(),
		dueDate: overrides.dueDate ?? null,
	};
}

test.describe('Story 3.2 - Filter Todos by Status', () => {
	test.describe.configure({ mode: 'serial' });

	let todoPage: TodoPage;

	test.beforeEach(async ({ page }) => {
		todoPage = new TodoPage(page);
		await todoPage.goto();
	});

	test.afterEach(async ({ request }) => {
		await todoPage.cleanup(request);
	});

	test('renders three filter tabs with All selected by default', async ({ page }) => {
		const tablist = page.locator('[role="tablist"]');
		await expect(tablist).toBeVisible();

		const allTab = filterTab(page, 'All');
		const activeTab = filterTab(page, 'Active');
		const completedTab = filterTab(page, 'Completed');

		await expect(allTab).toBeVisible();
		await expect(activeTab).toBeVisible();
		await expect(completedTab).toBeVisible();

		await expect(allTab).toHaveAttribute('aria-selected', 'true');
		await expect(activeTab).toHaveAttribute('aria-selected', 'false');
		await expect(completedTab).toHaveAttribute('aria-selected', 'false');
	});

	test('tabs expose tab semantics and aria-controls for the todo list', async ({ page }) => {
		for (const label of ['All', 'Active', 'Completed'] as const) {
			const tab = filterTab(page, label);
			await expect(tab).toHaveAttribute('aria-controls', 'todo-list');
		}
		await expect(page.locator('#todo-list')).toBeAttached();
	});

	test('Active filter hides completed todos after transition', async ({ page }) => {
		const activeText = `Active only ${Date.now()}`;
		const doneText = `Done item ${Date.now()}`;

		await todoPage.addTodo(activeText);
		await todoPage.addTodo(doneText);

		await todoCheckbox(page, doneText).click();
		await expect(todoCheckbox(page, doneText)).toBeChecked({ timeout: 5000 });

		await filterTab(page, 'Active').click();

		await expect(page.locator(`text=${activeText}`).first()).toBeVisible({ timeout: 5000 });
		await expect(page.locator(`text=${doneText}`).first()).toBeHidden({ timeout: 5000 });
	});

	test('Completed filter hides active todos after transition', async ({ page }) => {
		const keepActive = `Still open ${Date.now()}`;
		const finished = `Finished ${Date.now()}`;

		await todoPage.addTodo(keepActive);
		await todoPage.addTodo(finished);

		await todoCheckbox(page, finished).click();
		await expect(todoCheckbox(page, finished)).toBeChecked({ timeout: 5000 });

		await filterTab(page, 'Completed').click();

		await expect(page.locator(`text=${finished}`).first()).toBeVisible({ timeout: 5000 });
		await expect(page.locator(`text=${keepActive}`).first()).toBeHidden({ timeout: 5000 });
	});

	test('All filter shows every todo again', async ({ page }) => {
		const a = `All A ${Date.now()}`;
		const b = `All B ${Date.now()}`;

		await todoPage.addTodo(a);
		await todoPage.addTodo(b);

		await todoCheckbox(page, b).click();
		await expect(todoCheckbox(page, b)).toBeChecked({ timeout: 5000 });

		await filterTab(page, 'Active').click();
		await expect(page.locator(`text=${b}`).first()).toBeHidden({ timeout: 5000 });

		await filterTab(page, 'All').click();

		await expect(page.locator(`text=${a}`).first()).toBeVisible({ timeout: 5000 });
		await expect(page.locator(`text=${b}`).first()).toBeVisible({ timeout: 5000 });
	});

	test('Active filter empty state when no active todos exist', async ({ page }) => {
		const ts = Date.now();
		await page.route('**/api/todos', (route) => {
			if (route.request().method() === 'GET') {
				route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify([
						makeMockTodo({
							id: `mock-done-${ts}`,
							description: `Only completed ${ts}`,
							isCompleted: true,
						}),
					]),
				});
			} else {
				route.continue();
			}
		});

		await page.reload();
		await page.waitForLoadState('domcontentloaded');
		await page.locator('h1').waitFor({ state: 'visible', timeout: 5000 });

		await filterTab(page, 'Active').click();

		const listRegion = page.locator('#todo-list');
		await expect(listRegion.getByText('No active tasks')).toBeVisible({ timeout: 5000 });
		await expect(
			listRegion.getByText('Add a task above to get started.', { exact: true }),
		).toBeVisible();
	});

	test('Completed filter empty state when no completed todos exist', async ({ page }) => {
		const ts = Date.now();
		await page.route('**/api/todos', (route) => {
			if (route.request().method() === 'GET') {
				route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify([
						makeMockTodo({
							id: `mock-active-${ts}`,
							description: `Nothing done ${ts}`,
							isCompleted: false,
						}),
					]),
				});
			} else {
				route.continue();
			}
		});

		await page.reload();
		await page.waitForLoadState('domcontentloaded');
		await page.locator('h1').waitFor({ state: 'visible', timeout: 5000 });

		await filterTab(page, 'Completed').click();

		const listRegion = page.locator('#todo-list');
		await expect(listRegion.getByText('No completed tasks')).toBeVisible({ timeout: 5000 });
		await expect(
			listRegion.getByText('Tasks you complete will appear here.', { exact: true }),
		).toBeVisible();
	});

	test('announces task count in polite live region when filter changes', async ({ page }) => {
		const ts = Date.now();

		await page.route('**/api/todos', (route) => {
			if (route.request().method() === 'GET') {
				route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify([
						makeMockTodo({ description: `Live one ${ts}`, isCompleted: false }),
						makeMockTodo({ description: `Live two ${ts}`, isCompleted: true }),
					]),
				});
			} else {
				route.continue();
			}
		});

		await page.reload();
		await page.waitForLoadState('domcontentloaded');
		await page.locator('h1').waitFor({ state: 'visible', timeout: 5000 });

		const liveRegion = page.locator('[data-testid="filter-announcement"]');

		await filterTab(page, 'Active').click();
		await expect(liveRegion).toHaveText('1 tasks shown', { timeout: 5000 });

		await filterTab(page, 'Completed').click();
		await expect(liveRegion).toHaveText('1 tasks shown', { timeout: 5000 });
	});
});
