import { expect, test } from '@playwright/test';

import { TodoPage } from './fixtures/todo-page';

function indexOfTodo(todos: { text: string }[], text: string): number {
	const idx = todos.findIndex((t) => t.text === text);
	if (idx === -1) throw new Error(`Todo "${text}" not found in visible list`);
	return idx;
}

test.describe('Todo CRUD Lifecycle', () => {
	let todoPage: TodoPage;

	test.beforeEach(async ({ page }) => {
		todoPage = new TodoPage(page);
		await todoPage.goto();
	});

	test.afterEach(async ({ request }) => {
		await todoPage.cleanup(request);
	});

	test('full CRUD lifecycle: create → verify → complete → verify → uncomplete → delete → undo toast → wait → verify deletion', async () => {
		const text = `CRUD lifecycle ${Date.now()}`;

		await todoPage.addTodo(text);
		let todos = await todoPage.getVisibleTodos();
		expect(todos.some((t) => t.text === text)).toBe(true);

		let idx = indexOfTodo(todos, text);
		await todoPage.completeTodo(idx);
		todos = await todoPage.getVisibleTodos();
		const completed = todos.find((t) => t.text === text);
		expect(completed?.isCompleted).toBe(true);

		idx = indexOfTodo(todos, text);
		await todoPage.uncompleteTodo(idx);
		todos = await todoPage.getVisibleTodos();
		const uncompleted = todos.find((t) => t.text === text);
		expect(uncompleted?.isCompleted).toBe(false);

		idx = indexOfTodo(todos, text);
		await todoPage.deleteTodo(idx);
		const undoToast = todoPage.getUndoToast();
		await expect(undoToast).toBeVisible({ timeout: 3000 });

		await todoPage.waitForUndoToExpire();

		await todoPage.page.reload();
		await todoPage.page.waitForLoadState('domcontentloaded');
		todos = await todoPage.getVisibleTodos();
		expect(todos.some((t) => t.text === text)).toBe(false);
	});

	test('create multiple todos and verify they all appear', async () => {
		const ts = Date.now();
		const texts = [`Multi A ${ts}`, `Multi B ${ts}`, `Multi C ${ts}`];

		for (const text of texts) {
			await todoPage.addTodo(text);
		}

		const todos = await todoPage.getVisibleTodos();
		for (const text of texts) {
			expect(todos.some((t) => t.text === text)).toBe(true);
		}
	});

	test('empty input does not create a todo', async () => {
		await todoPage.page.waitForLoadState('networkidle');

		const countBadge = todoPage.page.getByRole('status', { name: 'Todo count' });
		const initialCount = await countBadge.textContent();

		const input = todoPage.page.locator('[placeholder="Add a new task..."]');
		await input.press('Enter');

		await todoPage.page.waitForTimeout(500);
		const finalCount = await countBadge.textContent();
		expect(finalCount).toBe(initialCount);
	});
});
