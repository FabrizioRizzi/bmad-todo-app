import { expect, test } from '@playwright/test';

import { TodoTracker } from './fixtures/test-cleanup';

const API_BASE = 'http://localhost:3000';
const tracker = new TodoTracker();

function filterTab(page: import('@playwright/test').Page, label: 'All' | 'Active' | 'Completed') {
	return page.getByRole('tab', { name: new RegExp(`^${label},`) });
}

function dueSortButton(page: import('@playwright/test').Page) {
	return page.getByRole('button', { name: /Sort by due date/ });
}

function statusSortButton(page: import('@playwright/test').Page) {
	return page.getByRole('button', { name: /Sort by status/ });
}

async function todoDescriptionsInOrder(page: import('@playwright/test').Page): Promise<string[]> {
	const checkboxes = page.locator('#todo-list ul li input[type="checkbox"]');
	const count = await checkboxes.count();
	const out: string[] = [];
	for (let i = 0; i < count; i++) {
		const aria = await checkboxes.nth(i).getAttribute('aria-label');
		const m = aria?.match(/^Mark (.+) as (?:complete|active)$/);
		if (m) out.push(m[1]);
	}
	return out;
}

function orderSubset(fullOrder: string[], subset: readonly string[]): string[] {
	const set = new Set(subset);
	return fullOrder.filter((d) => set.has(d));
}

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function todoCheckbox(page: import('@playwright/test').Page, description: string) {
	return page.getByRole('checkbox', {
		name: new RegExp(`^Mark ${escapeRegExp(description)} as (?:complete|active)$`),
	});
}

test.describe('Story 3.3 - Sort Todos', () => {
	test.describe.configure({ mode: 'serial' });

	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('domcontentloaded');
		await page.locator('h1').waitFor({ state: 'visible', timeout: 5000 });
	});

	test.afterEach(async ({ request }) => {
		await tracker.cleanup(request);
	});

	test('sort toolbar shows Sort by, Due (default pressed), and Status on All filter', async ({
		page,
	}) => {
		const todoText = `placeholder ${Date.now()}`;
		const input = page.locator('[placeholder="Add a new task..."]');
		await input.fill(todoText);
		await input.press('Enter');
		tracker.track(todoText);
		await page.locator('#todo-list').waitFor({ state: 'visible', timeout: 10000 });

		const toolbar = page.getByRole('toolbar', { name: 'Sort options' });
		await expect(toolbar).toBeVisible();
		await expect(toolbar.getByText('Sort by', { exact: true })).toBeVisible();

		const due = dueSortButton(page);
		const status = statusSortButton(page);
		await expect(due).toBeVisible();
		await expect(status).toBeVisible();
		await expect(due).toHaveAttribute('aria-pressed', 'true');
		await expect(status).toHaveAttribute('aria-pressed', 'false');
	});

	test('due sort: soonest due first, todos without due date last', async ({ page, request }) => {
		const ts = Date.now();
		const dLate = `due-late-${ts}`;
		const dEarly = `due-early-${ts}`;
		const dNone = `due-none-${ts}`;

		await request.post(`${API_BASE}/api/todos`, {
			data: { description: dLate, dueDate: '2026-12-31' },
		});
		tracker.track(dLate);
		await request.post(`${API_BASE}/api/todos`, {
			data: { description: dEarly, dueDate: '2026-01-15' },
		});
		tracker.track(dEarly);
		await request.post(`${API_BASE}/api/todos`, {
			data: { description: dNone },
		});
		tracker.track(dNone);

		await page.reload();
		await page.waitForLoadState('domcontentloaded');
		await page.locator('h1').waitFor({ state: 'visible', timeout: 5000 });
		await page.locator('#todo-list ul li').first().waitFor({ state: 'visible', timeout: 10000 });

		await expect(dueSortButton(page)).toHaveAttribute('aria-pressed', 'true');
		const order = await todoDescriptionsInOrder(page);
		expect(orderSubset(order, [dEarly, dLate, dNone])).toEqual([dEarly, dLate, dNone]);
	});

	test('clicking Due when active toggles direction (soonest vs latest among dated items)', async ({
		page,
		request,
	}) => {
		const ts = Date.now();
		const a = `flip-a-${ts}`;
		const b = `flip-b-${ts}`;
		await request.post(`${API_BASE}/api/todos`, {
			data: { description: a, dueDate: '2026-03-01' },
		});
		tracker.track(a);
		await request.post(`${API_BASE}/api/todos`, {
			data: { description: b, dueDate: '2026-09-01' },
		});
		tracker.track(b);

		await page.reload();
		await page.waitForLoadState('domcontentloaded');
		await page.locator('h1').waitFor({ state: 'visible', timeout: 5000 });
		await page.locator('#todo-list ul li').first().waitFor({ state: 'visible', timeout: 10000 });

		expect(orderSubset(await todoDescriptionsInOrder(page), [a, b])).toEqual([a, b]);

		await dueSortButton(page).click();
		await expect(dueSortButton(page)).toContainText('Due ↓');
		expect(orderSubset(await todoDescriptionsInOrder(page), [a, b])).toEqual([b, a]);

		await dueSortButton(page).click();
		await expect(dueSortButton(page)).toContainText('Due ↑');
		expect(orderSubset(await todoDescriptionsInOrder(page), [a, b])).toEqual([a, b]);
	});

	test('status sort: active first, then toggle to completed first (stable within groups)', async ({
		page,
	}) => {
		const ts = Date.now();
		const first = `st-first-${ts}`;
		const second = `st-second-${ts}`;
		const third = `st-third-${ts}`;
		const input = page.locator('[placeholder="Add a new task..."]');

		for (const text of [first, second, third]) {
			await input.fill(text);
			await input.press('Enter');
			tracker.track(text);
			await page.locator(`text=${text}`).first().waitFor({ state: 'visible', timeout: 10000 });
		}

		await todoCheckbox(page, second).click();
		await expect(todoCheckbox(page, second)).toBeChecked({ timeout: 3000 });

		await statusSortButton(page).click();
		await expect(statusSortButton(page)).toHaveAttribute('aria-pressed', 'true');
		await expect(dueSortButton(page)).toHaveAttribute('aria-pressed', 'false');

		expect(orderSubset(await todoDescriptionsInOrder(page), [first, second, third])).toEqual([
			first,
			third,
			second,
		]);

		await statusSortButton(page).click();
		expect(orderSubset(await todoDescriptionsInOrder(page), [first, second, third])).toEqual([
			second,
			first,
			third,
		]);
	});

	test('Active and Completed filters hide Status sort; All shows it again', async ({ page }) => {
		const ts = Date.now();
		const todoText = `f-${ts}`;
		const input = page.locator('[placeholder="Add a new task..."]');
		await input.fill(todoText);
		await input.press('Enter');
		tracker.track(todoText);
		await page.locator(`text=${todoText}`).first().waitFor({ state: 'visible', timeout: 10000 });

		await expect(statusSortButton(page)).toBeVisible();

		await filterTab(page, 'Active').click();
		await expect(statusSortButton(page)).toHaveCount(0);
		await expect(dueSortButton(page)).toBeVisible();

		await filterTab(page, 'Completed').click();
		await expect(statusSortButton(page)).toHaveCount(0);

		await filterTab(page, 'All').click();
		await expect(statusSortButton(page)).toBeVisible();
	});

	test('switching filter to Active resets sort to due (Status hidden, Due pressed)', async ({
		page,
	}) => {
		const ts = Date.now();
		const first = `rs-first-${ts}`;
		const second = `rs-second-${ts}`;
		const input = page.locator('[placeholder="Add a new task..."]');

		await input.fill(first);
		await input.press('Enter');
		tracker.track(first);
		await page.locator(`text=${first}`).first().waitFor({ state: 'visible', timeout: 10000 });
		await input.fill(second);
		await input.press('Enter');
		tracker.track(second);
		await page.locator(`text=${second}`).first().waitFor({ state: 'visible', timeout: 10000 });

		await todoCheckbox(page, second).click();
		await expect(todoCheckbox(page, second)).toBeChecked({ timeout: 3000 });

		await statusSortButton(page).click();
		await expect(statusSortButton(page)).toHaveAttribute('aria-pressed', 'true');

		await filterTab(page, 'Active').click();
		await expect(statusSortButton(page)).toHaveCount(0);
		await expect(dueSortButton(page)).toHaveAttribute('aria-pressed', 'true');

		await filterTab(page, 'All').click();
		await expect(statusSortButton(page)).toBeVisible();
		await expect(statusSortButton(page)).toHaveAttribute('aria-pressed', 'false');
	});
});
