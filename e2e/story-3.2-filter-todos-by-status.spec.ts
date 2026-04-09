import { expect, test } from '@playwright/test';

const API_BASE = 'http://localhost:3000';

/** Reset shared dev DB so filter counts and empty states are deterministic. */
async function clearAllTodos(request: import('@playwright/test').APIRequestContext) {
	const listRes = await request.get(`${API_BASE}/api/todos`);
	if (!listRes.ok()) return;
	const todos = (await listRes.json()) as { id: string }[];
	for (const t of todos) {
		await request.delete(`${API_BASE}/api/todos/${t.id}`);
	}
}

function filterLiveRegion(page: import('@playwright/test').Page) {
	return page.locator('[aria-live="polite"].sr-only');
}

function filterTab(page: import('@playwright/test').Page, label: 'All' | 'Active' | 'Completed') {
	// Accessible name is aria-label: "{label}, {count} tasks"
	return page.getByRole('tab', { name: new RegExp(`^${label},`) });
}

function todoCheckbox(page: import('@playwright/test').Page, description: string) {
	return page.locator(`input[type="checkbox"][aria-label="Toggle completion for: ${description}"]`);
}

test.describe('Story 3.2 - Filter Todos by Status', () => {
	// Serial + API cleanup: these tests assume a known global todo list; parallel workers would share state.
	test.describe.configure({ mode: 'serial' });

	test.beforeEach(async ({ page, request }) => {
		await clearAllTodos(request);
		await page.goto('/');
		await page.waitForLoadState('domcontentloaded');
		await page.locator('h1').waitFor({ state: 'visible', timeout: 5000 });
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
		const input = page.locator('[placeholder="Add a new task..."]');
		const activeText = `Active only ${Date.now()}`;
		const doneText = `Done item ${Date.now()}`;

		await input.fill(activeText);
		await input.press('Enter');
		await page.locator(`text=${activeText}`).first().waitFor({ state: 'visible', timeout: 10000 });

		await input.fill(doneText);
		await input.press('Enter');
		await page.locator(`text=${doneText}`).first().waitFor({ state: 'visible', timeout: 10000 });

		await todoCheckbox(page, doneText).click();
		await expect(todoCheckbox(page, doneText)).toBeChecked({ timeout: 3000 });

		await filterTab(page, 'Active').click();

		await expect(page.locator(`text=${activeText}`).first()).toBeVisible({ timeout: 5000 });
		await expect(page.locator(`text=${doneText}`).first()).toBeHidden({ timeout: 5000 });
	});

	test('Completed filter hides active todos after transition', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');
		const keepActive = `Still open ${Date.now()}`;
		const finished = `Finished ${Date.now()}`;

		await input.fill(keepActive);
		await input.press('Enter');
		await page.locator(`text=${keepActive}`).first().waitFor({ state: 'visible', timeout: 10000 });

		await input.fill(finished);
		await input.press('Enter');
		await page.locator(`text=${finished}`).first().waitFor({ state: 'visible', timeout: 10000 });

		await todoCheckbox(page, finished).click();
		await expect(todoCheckbox(page, finished)).toBeChecked({ timeout: 3000 });

		await filterTab(page, 'Completed').click();

		await expect(page.locator(`text=${finished}`).first()).toBeVisible({ timeout: 5000 });
		await expect(page.locator(`text=${keepActive}`).first()).toBeHidden({ timeout: 5000 });
	});

	test('All filter shows every todo again', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');
		const a = `All A ${Date.now()}`;
		const b = `All B ${Date.now()}`;

		await input.fill(a);
		await input.press('Enter');
		await page.locator(`text=${a}`).first().waitFor({ state: 'visible', timeout: 10000 });

		await input.fill(b);
		await input.press('Enter');
		await page.locator(`text=${b}`).first().waitFor({ state: 'visible', timeout: 10000 });

		await todoCheckbox(page, b).click();
		await expect(todoCheckbox(page, b)).toBeChecked({ timeout: 3000 });

		await filterTab(page, 'Active').click();
		await expect(page.locator(`text=${b}`).first()).toBeHidden({ timeout: 5000 });

		await filterTab(page, 'All').click();

		await expect(page.locator(`text=${a}`).first()).toBeVisible({ timeout: 5000 });
		await expect(page.locator(`text=${b}`).first()).toBeVisible({ timeout: 5000 });
	});

	test('Active filter empty state when no active todos exist', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');
		const solo = `Only completed ${Date.now()}`;

		await input.fill(solo);
		await input.press('Enter');
		await page.locator(`text=${solo}`).first().waitFor({ state: 'visible', timeout: 10000 });

		await todoCheckbox(page, solo).click();
		await expect(todoCheckbox(page, solo)).toBeChecked({ timeout: 3000 });

		await filterTab(page, 'Active').click();

		await expect(page.getByRole('status', { name: 'No active tasks' })).toBeVisible({
			timeout: 5000,
		});
		await expect(page.getByText('Add a task above to get started.', { exact: true })).toBeVisible();
	});

	test('Completed filter empty state when no completed todos exist', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');
		const open = `Nothing done ${Date.now()}`;

		await input.fill(open);
		await input.press('Enter');
		await page.locator(`text=${open}`).first().waitFor({ state: 'visible', timeout: 10000 });

		await filterTab(page, 'Completed').click();

		await expect(page.getByRole('status', { name: 'No completed tasks' })).toBeVisible({
			timeout: 5000,
		});
		await expect(
			page.getByText('Tasks you complete will appear here.', { exact: true }),
		).toBeVisible();
	});

	test('announces task count in polite live region when filter changes', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');
		const one = `Live one ${Date.now()}`;
		const two = `Live two ${Date.now()}`;

		await input.fill(one);
		await input.press('Enter');
		await page.locator(`text=${one}`).first().waitFor({ state: 'visible', timeout: 10000 });

		await input.fill(two);
		await input.press('Enter');
		await page.locator(`text=${two}`).first().waitFor({ state: 'visible', timeout: 10000 });

		await todoCheckbox(page, two).click();
		await expect(todoCheckbox(page, two)).toBeChecked({ timeout: 3000 });

		await filterTab(page, 'Active').click();
		await expect(filterLiveRegion(page)).toHaveText('1 tasks shown', { timeout: 5000 });

		await filterTab(page, 'Completed').click();
		await expect(filterLiveRegion(page)).toHaveText('1 tasks shown', { timeout: 5000 });
	});
});
