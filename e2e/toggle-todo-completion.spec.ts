import { expect, test } from '@playwright/test';

test.describe('Story 2.1 - Toggle Todo Completion', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('domcontentloaded');
		await page.locator('h1').waitFor({ state: 'visible', timeout: 5000 });
	});

	function todoCheckbox(page: import('@playwright/test').Page, description: string) {
		return page.locator(
			`input[type="checkbox"][aria-label="Toggle completion for: ${description}"]`,
		);
	}

	function todoCard(page: import('@playwright/test').Page, description: string) {
		return page
			.locator(`text=${description}`)
			.first()
			.locator('xpath=ancestor::div[contains(@class,"todo-card-bar")]');
	}

	test('displays checkbox on todo items', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');
		const todoText = `Checkbox ${Date.now()}`;
		await input.fill(todoText);
		await input.press('Enter');
		await page.locator(`text=${todoText}`).first().waitFor({ state: 'visible', timeout: 5000 });

		const checkbox = todoCheckbox(page, todoText);
		await expect(checkbox).toBeVisible();
		await expect(checkbox).not.toBeChecked();
	});

	test('toggles todo completion active to completed', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');
		const todoText = `Todo ${Date.now()}`;
		await input.fill(todoText);
		await input.press('Enter');
		await page.locator(`text=${todoText}`).first().waitFor({ state: 'visible', timeout: 5000 });

		const checkbox = todoCheckbox(page, todoText);
		await expect(checkbox).not.toBeChecked();
		await checkbox.click();

		await expect(checkbox).toBeChecked({ timeout: 3000 });
		await expect(todoCard(page, todoText)).toHaveClass(/todo-card-completed/);
	});

	test('toggles todo completion completed to active', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');
		const todoText = `Revert ${Date.now()}`;
		await input.fill(todoText);
		await input.press('Enter');
		await page.locator(`text=${todoText}`).first().waitFor({ state: 'visible', timeout: 5000 });

		const checkbox = todoCheckbox(page, todoText);
		await checkbox.click();
		await expect(checkbox).toBeChecked({ timeout: 3000 });

		await checkbox.click();
		await expect(checkbox).not.toBeChecked({ timeout: 3000 });
		await expect(todoCard(page, todoText)).not.toHaveClass(/todo-card-completed/);
	});

	test('shows error message when toggle API fails', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');
		const todoText = `API Error ${Date.now()}`;
		await input.fill(todoText);
		await input.press('Enter');
		await page.locator(`text=${todoText}`).first().waitFor({ state: 'visible', timeout: 5000 });

		await page.route('**/api/todos/**', (route) => {
			if (route.request().method() === 'PATCH') {
				route.abort('failed');
			} else {
				route.continue();
			}
		});

		const checkbox = todoCheckbox(page, todoText);
		await checkbox.click();

		const errorMsg = page.locator("text=Couldn't update that task");
		await expect(errorMsg).toBeVisible({ timeout: 3000 });
	});

	test('reverts optimistic update on error', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');
		const todoText = `Revert err ${Date.now()}`;
		await input.fill(todoText);
		await input.press('Enter');
		await page.locator(`text=${todoText}`).first().waitFor({ state: 'visible', timeout: 5000 });

		await page.route('**/api/todos/**', (route) => {
			if (route.request().method() === 'PATCH') {
				route.abort('failed');
			} else {
				route.continue();
			}
		});

		const checkbox = todoCheckbox(page, todoText);
		await checkbox.click();

		await page
			.locator("text=Couldn't update that task")
			.waitFor({ state: 'visible', timeout: 3000 });

		await expect(checkbox).not.toBeChecked();
		await expect(todoCard(page, todoText)).not.toHaveClass(/todo-card-completed/);
	});

	test('multiple todos toggle independently', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');

		const todo1 = `Indep A ${Date.now()}`;
		await input.fill(todo1);
		await input.press('Enter');
		await page.locator(`text=${todo1}`).first().waitFor({ state: 'visible', timeout: 5000 });

		await page.waitForTimeout(200);

		const todo2 = `Indep B ${Date.now()}`;
		await input.fill(todo2);
		await input.press('Enter');
		await page.locator(`text=${todo2}`).first().waitFor({ state: 'visible', timeout: 5000 });

		const cb1 = todoCheckbox(page, todo1);
		const cb2 = todoCheckbox(page, todo2);

		await cb1.click();
		await expect(cb1).toBeChecked({ timeout: 3000 });
		await expect(cb2).not.toBeChecked();
	});

	test('checkbox has accessibility attributes', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');
		const todoText = `Accessibility ${Date.now()}`;
		await input.fill(todoText);
		await input.press('Enter');
		await page.locator(`text=${todoText}`).first().waitFor({ state: 'visible', timeout: 5000 });

		const checkbox = todoCheckbox(page, todoText);
		await expect(checkbox).toHaveAttribute('aria-label', `Toggle completion for: ${todoText}`);
		await expect(checkbox).toHaveAttribute('type', 'checkbox');
	});
});
