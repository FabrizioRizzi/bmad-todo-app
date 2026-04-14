import { expect, test } from '@playwright/test';

import { TodoPage } from './fixtures/todo-page';

function indexOfTodo(todos: { text: string }[], text: string): number {
	const idx = todos.findIndex((t) => t.text === text);
	if (idx === -1) throw new Error(`Todo "${text}" not found`);
	return idx;
}

test.describe('Todo Filtering', () => {
	test.describe.configure({ mode: 'serial' });

	let todoPage: TodoPage;

	test.beforeEach(async ({ page }) => {
		todoPage = new TodoPage(page);
		await todoPage.goto();
	});

	test.afterEach(async ({ request }) => {
		await todoPage.cleanup(request);
	});

	test('filter Active → only active visible, filter Completed → only completed visible, filter All → all visible', async () => {
		const ts = Date.now();
		const activeText = `Active item ${ts}`;
		const completedText = `Done item ${ts}`;

		await todoPage.addTodo(activeText);
		await todoPage.addTodo(completedText);

		const todos = await todoPage.getVisibleTodos();
		const completedIdx = indexOfTodo(todos, completedText);
		await todoPage.completeTodo(completedIdx);

		await todoPage.filterBy('Active');
		await expect(todoPage.page.locator(`text=${completedText}`).first()).toBeHidden({
			timeout: 5000,
		});
		await expect(todoPage.page.locator(`text=${activeText}`).first()).toBeVisible({
			timeout: 5000,
		});

		await todoPage.filterBy('Completed');
		await expect(todoPage.page.locator(`text=${activeText}`).first()).toBeHidden({
			timeout: 5000,
		});
		await expect(todoPage.page.locator(`text=${completedText}`).first()).toBeVisible({
			timeout: 5000,
		});

		await todoPage.filterBy('All');
		await expect(todoPage.page.locator(`text=${activeText}`).first()).toBeVisible({
			timeout: 5000,
		});
		await expect(todoPage.page.locator(`text=${completedText}`).first()).toBeVisible({
			timeout: 5000,
		});
	});

	test('filtered empty states: no active tasks, no completed tasks', async () => {
		const ts = Date.now();
		const listRegion = todoPage.page.locator('#todo-list');

		// Mock API to return only one completed todo
		await todoPage.page.route('**/api/todos', (route) => {
			if (route.request().method() === 'GET') {
				route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify([
						{
							id: `mock-completed-${ts}`,
							description: `Only done ${ts}`,
							isCompleted: true,
							createdAt: new Date().toISOString(),
							dueDate: null,
						},
					]),
				});
			} else {
				route.continue();
			}
		});

		await todoPage.page.reload();
		await todoPage.page.waitForLoadState('domcontentloaded');
		await todoPage.page.locator('h1').waitFor({ state: 'visible', timeout: 5000 });

		await todoPage.filterBy('Active');
		await expect(listRegion.getByText('No active tasks')).toBeVisible({ timeout: 5000 });

		// Now mock API to return only one active todo
		await todoPage.page.unroute('**/api/todos');
		await todoPage.page.route('**/api/todos', (route) => {
			if (route.request().method() === 'GET') {
				route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify([
						{
							id: `mock-active-${ts}`,
							description: `Only active ${ts}`,
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

		await todoPage.page.reload();
		await todoPage.page.waitForLoadState('domcontentloaded');
		await todoPage.page.locator('h1').waitFor({ state: 'visible', timeout: 5000 });

		await todoPage.filterBy('Completed');
		await expect(listRegion.getByText('No completed tasks')).toBeVisible({ timeout: 5000 });
	});
});
