import { expect, type Locator, type Page } from '@playwright/test';

const API_BASE = 'http://localhost:3000';

export interface VisibleTodo {
	text: string;
	isCompleted: boolean;
	dueDate: string | null;
}

export class TodoPage {
	readonly page: Page;
	private readonly input: Locator;
	private readonly createdDescriptions: string[] = [];

	constructor(page: Page) {
		this.page = page;
		this.input = page.locator('[placeholder="Add a new task..."]');
	}

	async goto() {
		await this.page.goto('/');
		await this.page.waitForLoadState('domcontentloaded');
		await this.page.locator('h1').waitFor({ state: 'visible', timeout: 5000 });
	}

	async addTodo(text: string, dueDate?: string) {
		if (dueDate) {
			await this.page.getByRole('button', { name: 'Set due date', exact: true }).click();
			await this.pickCalendarDay(dueDate);
		}
		await this.input.fill(text);
		await this.input.press('Enter');
		await this.page.locator(`text=${text}`).first().waitFor({ state: 'visible', timeout: 10000 });
		this.createdDescriptions.push(text);
	}

	async completeTodo(index: number) {
		const todos = await this.getVisibleTodos();
		const todo = todos[index];
		if (!todo) throw new Error(`No visible todo at index ${index}`);
		if (todo.isCompleted) throw new Error(`Todo at index ${index} is already completed`);
		const checkbox = this.todoCheckbox(todo.text, false);
		await checkbox.click();
		const completedCheckbox = this.todoCheckbox(todo.text, true);
		await expect(completedCheckbox).toBeChecked({ timeout: 5000 });
	}

	async uncompleteTodo(index: number) {
		const todos = await this.getVisibleTodos();
		const todo = todos[index];
		if (!todo) throw new Error(`No visible todo at index ${index}`);
		if (!todo.isCompleted) throw new Error(`Todo at index ${index} is not completed`);
		const checkbox = this.todoCheckbox(todo.text, true);
		await checkbox.click();
		const uncompleted = this.todoCheckbox(todo.text, false);
		await expect(uncompleted).not.toBeChecked({ timeout: 5000 });
	}

	async deleteTodo(index: number) {
		const todos = await this.getVisibleTodos();
		const todo = todos[index];
		if (!todo) throw new Error(`No visible todo at index ${index}`);
		const label = `Delete: ${this.truncateForAria(todo.text)}`;
		const btn = this.page.locator(`button[aria-label="${label}"]`);
		await btn.click({ force: true });
	}

	async filterBy(status: 'All' | 'Active' | 'Completed') {
		const tab = this.page.getByRole('tab', { name: new RegExp(`^${status},`) });
		await tab.click();
	}

	async sortBy(option: 'Due' | 'Status') {
		if (option === 'Due') {
			await this.page.getByRole('button', { name: /Sort by due date/ }).click();
		} else {
			await this.page.getByRole('button', { name: /Sort by status/ }).click();
		}
	}

	async getVisibleTodos(): Promise<VisibleTodo[]> {
		const checkboxes = this.page.locator('#todo-list ul li input[type="checkbox"]');
		const count = await checkboxes.count();
		const todos: VisibleTodo[] = [];

		for (let i = 0; i < count; i++) {
			const cb = checkboxes.nth(i);
			const ariaLabel = await cb.getAttribute('aria-label');

			const match = ariaLabel?.match(/^Mark (.+) as (complete|active)$/);
			if (!match) continue;

			const text = match[1];
			const isCompleted = match[2] === 'active';

			const bar = this.todoCardBar(text);
			let dueDate: string | null = null;

			const changeDueBtn = bar.getByRole('button', {
				name: `Change due date for ${text}`,
			});
			if ((await changeDueBtn.count()) > 0) {
				dueDate = (await changeDueBtn.textContent()) ?? null;
			}

			todos.push({ text, isCompleted, dueDate });
		}

		return todos;
	}

	async getErrorBanner(): Promise<string | null> {
		const banner = this.page.locator('[data-testid="error-banner"]');
		if ((await banner.count()) === 0) return null;
		const visible = await banner.isVisible();
		if (!visible) return null;
		return (await banner.textContent()) ?? null;
	}

	getUndoToast(): Locator {
		return this.page.locator('[data-testid="undo-toast"]');
	}

	async waitForUndoToExpire() {
		const deleteResponse = this.page.waitForResponse(
			(resp) =>
				resp.url().includes('/api/todos/') && resp.request().method() === 'DELETE' && resp.ok(),
			{ timeout: 10000 },
		);
		await deleteResponse;
		await expect(this.getUndoToast()).not.toBeVisible({ timeout: 3000 });
	}

	async cleanup(request: import('@playwright/test').APIRequestContext) {
		if (this.createdDescriptions.length === 0) return;
		const res = await request.get(`${API_BASE}/api/todos`);
		if (!res.ok()) return;
		const todos = (await res.json()) as { id: string; description: string }[];
		const toDelete = todos.filter((t) => this.createdDescriptions.includes(t.description));
		for (const t of toDelete) {
			await request.delete(`${API_BASE}/api/todos/${t.id}`);
		}
		this.createdDescriptions.length = 0;
	}

	async getEmptyState(): Promise<string | null> {
		const status = this.page.getByRole('status');
		if ((await status.count()) === 0) return null;
		const emptyText = this.page.locator('text=No tasks yet');
		if ((await emptyText.count()) > 0 && (await emptyText.first().isVisible())) {
			return 'No tasks yet';
		}
		return null;
	}

	private truncateForAria(text: string, max = 120): string {
		return text.length > max ? `${text.slice(0, max - 1).trimEnd()}...` : text;
	}

	private todoCheckbox(text: string, isCompleted: boolean): Locator {
		const state = isCompleted ? 'active' : 'complete';
		return this.page.getByRole('checkbox', {
			name: `Mark ${text} as ${state}`,
		});
	}

	private todoCardBar(text: string): Locator {
		return this.page
			.locator(`text=${text}`)
			.first()
			.locator('xpath=ancestor::div[contains(@class,"todo-card-bar")]');
	}

	private async pickCalendarDay(isoDate: string) {
		const btn = this.page.locator(`[role="grid"]:visible [data-day="${isoDate}"] button`).first();
		await expect(btn).toBeVisible({ timeout: 5000 });
		await btn.click();
	}
}
