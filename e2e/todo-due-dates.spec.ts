import { expect, test } from '@playwright/test';

import { TodoPage } from './fixtures/todo-page';

const API_BASE = 'http://localhost:3000';

function localIsoDate(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

function futureDate(daysFromNow: number): string {
	const d = new Date();
	d.setDate(d.getDate() + daysFromNow);
	return localIsoDate(d);
}

async function deleteTodoById(request: import('@playwright/test').APIRequestContext, id: string) {
	await request.delete(`${API_BASE}/api/todos/${id}`);
}

test.describe('Todo Due Dates', () => {
	test.describe.configure({ mode: 'serial' });

	let todoPage: TodoPage;

	test.beforeEach(async ({ page }) => {
		todoPage = new TodoPage(page);
		await todoPage.goto();
	});

	test.afterEach(async ({ request }) => {
		await todoPage.cleanup(request);
	});

	test('create todo with due date → badge appears with expected label', async () => {
		const text = `Dated todo ${Date.now()}`;
		const todayIso = localIsoDate(new Date());

		await todoPage.addTodo(text, todayIso);

		const todos = await todoPage.getVisibleTodos();
		const found = todos.find((t) => t.text === text);
		expect(found).toBeDefined();
		expect(found?.dueDate).toBeTruthy();
		expect(found?.dueDate).toContain('Today');
	});

	test('change due date on existing todo → badge updates', async () => {
		const text = `Change date ${Date.now()}`;
		const firstDate = futureDate(3);
		const secondDate = futureDate(10);

		await todoPage.addTodo(text, firstDate);

		let todos = await todoPage.getVisibleTodos();
		const initialDue = todos.find((t) => t.text === text)?.dueDate;
		expect(initialDue).toBeTruthy();

		const bar = todoPage.page
			.locator(`text=${text}`)
			.first()
			.locator('xpath=ancestor::div[contains(@class,"todo-card-bar")]');
		const changeDueBtn = bar.getByRole('button', {
			name: `Change due date for ${text}`,
		});
		await changeDueBtn.click();
		await expect(todoPage.page.locator('[role="grid"]:visible')).toBeVisible();

		const dayBtn = todoPage.page
			.locator(`[role="grid"]:visible [data-day="${secondDate}"] button`)
			.first();
		await expect(dayBtn).toBeVisible({ timeout: 5000 });
		await dayBtn.click();

		await expect(changeDueBtn).not.toHaveText(initialDue ?? '', { timeout: 10000 });

		todos = await todoPage.getVisibleTodos();
		const updatedDue = todos.find((t) => t.text === text)?.dueDate;
		expect(updatedDue).toBeTruthy();
		expect(updatedDue).not.toBe(initialDue);
	});

	test('sort by due date → verify order (soonest first, nulls last)', async ({ request }) => {
		const ts = Date.now();
		const soonText = `due-soon-${ts}`;
		const laterText = `due-later-${ts}`;
		const noneText = `due-none-${ts}`;

		const createdIds: string[] = [];

		const r1 = await request.post(`${API_BASE}/api/todos`, {
			data: { description: laterText, dueDate: '2026-12-31' },
		});
		createdIds.push((await r1.json()).id);

		const r2 = await request.post(`${API_BASE}/api/todos`, {
			data: { description: soonText, dueDate: '2026-01-15' },
		});
		createdIds.push((await r2.json()).id);

		const r3 = await request.post(`${API_BASE}/api/todos`, {
			data: { description: noneText },
		});
		createdIds.push((await r3.json()).id);

		await todoPage.page.reload();
		await todoPage.page.waitForLoadState('domcontentloaded');
		await todoPage.page.locator('h1').waitFor({ state: 'visible', timeout: 5000 });
		await todoPage.page
			.locator('#todo-list ul li')
			.first()
			.waitFor({ state: 'visible', timeout: 10000 });

		await todoPage.sortBy('Status');
		await todoPage.sortBy('Due');

		const todos = await todoPage.getVisibleTodos();
		const descriptions = todos.map((t) => t.text);

		const soonIdx = descriptions.indexOf(soonText);
		const laterIdx = descriptions.indexOf(laterText);
		const noneIdx = descriptions.indexOf(noneText);

		expect(soonIdx).toBeGreaterThanOrEqual(0);
		expect(laterIdx).toBeGreaterThanOrEqual(0);
		expect(noneIdx).toBeGreaterThanOrEqual(0);

		expect(soonIdx).toBeLessThan(laterIdx);
		expect(laterIdx).toBeLessThan(noneIdx);

		for (const id of createdIds) {
			await deleteTodoById(request, id);
		}
	});
});
