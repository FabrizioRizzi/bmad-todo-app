import { expect, test } from '@playwright/test';

const API_BASE = 'http://localhost:3000';

/** Reset shared dev DB so list order and counts are deterministic. */
async function clearAllTodos(request: import('@playwright/test').APIRequestContext) {
	const listRes = await request.get(`${API_BASE}/api/todos`);
	if (!listRes.ok()) return;
	const todos = (await listRes.json()) as { id: string }[];
	for (const t of todos) {
		await request.delete(`${API_BASE}/api/todos/${t.id}`);
	}
}

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
		const m = aria?.match(/^Toggle completion for: (.+)$/);
		if (m) out.push(m[1]);
	}
	return out;
}

/** Preserve list order but keep only descriptions in `subset` (shared dev DB may contain other todos). */
function orderSubset(fullOrder: string[], subset: readonly string[]): string[] {
	const set = new Set(subset);
	return fullOrder.filter((d) => set.has(d));
}

function todoCheckbox(page: import('@playwright/test').Page, description: string) {
	return page.locator(`input[type="checkbox"][aria-label="Toggle completion for: ${description}"]`);
}

test.describe('Story 3.3 - Sort Todos', () => {
	test.describe.configure({ mode: 'serial' });

	test.beforeEach(async ({ page, request }) => {
		await clearAllTodos(request);
		await page.goto('/');
		await page.waitForLoadState('domcontentloaded');
		await page.locator('h1').waitFor({ state: 'visible', timeout: 5000 });
	});

	test('sort toolbar shows Sort by, Due (default pressed), and Status on All filter', async ({
		page,
	}) => {
		const input = page.locator('[placeholder="Add a new task..."]');
		await input.fill(`placeholder ${Date.now()}`);
		await input.press('Enter');
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

		// Creation order differs from display order after sort
		const r1 = await request.post(`${API_BASE}/api/todos`, {
			data: { description: dLate, dueDate: '2026-12-31' },
		});
		const r2 = await request.post(`${API_BASE}/api/todos`, {
			data: { description: dEarly, dueDate: '2026-01-15' },
		});
		const r3 = await request.post(`${API_BASE}/api/todos`, {
			data: { description: dNone },
		});
		expect(r1.ok() && r2.ok() && r3.ok()).toBeTruthy();

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
		await request.post(`${API_BASE}/api/todos`, {
			data: { description: b, dueDate: '2026-09-01' },
		});

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
		const input = page.locator('[placeholder="Add a new task..."]');
		await input.fill(`f-${ts}`);
		await input.press('Enter');
		await page.locator(`text=f-${ts}`).first().waitFor({ state: 'visible', timeout: 10000 });

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
		await page.locator(`text=${first}`).first().waitFor({ state: 'visible', timeout: 10000 });
		await input.fill(second);
		await input.press('Enter');
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
