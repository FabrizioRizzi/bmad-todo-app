import { expect, test } from '@playwright/test';

test.describe('Story 4.1 - Keyboard navigation and focus', () => {
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

	async function createTodo(page: import('@playwright/test').Page, text: string) {
		const input = page.locator('[placeholder="Add a new task..."]');
		await input.fill(text);
		await input.press('Enter');
		await page.locator(`text=${text}`).first().waitFor({ state: 'visible', timeout: 5000 });
	}

	test('Tab order from add field reaches filter tablist then sort controls', async ({ page }) => {
		const input = page.locator('[placeholder="Add a new task..."]');
		await input.focus();
		await expect(input).toBeFocused();

		await page.keyboard.press('Tab');
		const dueTrigger = page.getByRole('button', { name: 'Set due date', exact: true });
		await expect(dueTrigger).toBeFocused();

		await page.keyboard.press('Tab');
		await expect(page.getByRole('button', { name: /add task/i })).toBeFocused();

		await page.keyboard.press('Tab');
		const allTab = page.getByRole('tab', { name: /all,.*tasks/i });
		await expect(allTab).toBeFocused();

		await page.keyboard.press('Tab');
		await expect(page.getByRole('button', { name: /sort by due date/i })).toBeFocused();
	});

	test('ArrowRight moves between filter tabs without changing view until Enter', async ({
		page,
	}) => {
		await page.getByRole('tab', { name: /all,.*tasks/i }).focus();
		await page.keyboard.press('ArrowRight');
		await expect(page.getByRole('tab', { name: /active,.*tasks/i })).toBeFocused();
		await expect(page.getByRole('tab', { name: /all,.*tasks/i })).toHaveAttribute(
			'aria-selected',
			'true',
		);
		await page.keyboard.press('Enter');
		await expect(page.getByRole('tab', { name: /active,.*tasks/i })).toHaveAttribute(
			'aria-selected',
			'true',
		);
	});

	test('Escape dismisses visible undo toast', async ({ page }) => {
		const todoText = `Kb esc ${Date.now()}`;
		await createTodo(page, todoText);

		await page.locator(`button[aria-label="Delete: ${todoText}"]`).click({ force: true });
		await expect(page.locator('[data-testid="undo-toast"]')).toBeVisible({ timeout: 3000 });

		await page.keyboard.press('Escape');
		await expect(page.locator('[data-testid="undo-toast"]')).not.toBeVisible({ timeout: 3000 });
	});

	test('Space toggles completion when checkbox is focused', async ({ page }) => {
		const label = `Space toggle ${Date.now()}`;
		await createTodo(page, label);
		const checkbox = todoCheckbox(page, label);
		await checkbox.focus();
		await expect(checkbox).toBeFocused();
		await page.keyboard.press('Space');
		await expect(checkbox).toBeChecked({ timeout: 5000 });
	});

	test('after deleting first of two todos, focus lands on remaining checkbox', async ({ page }) => {
		const t1 = `First ${Date.now()}`;
		const t2 = `Second ${Date.now()}`;
		await createTodo(page, t1);
		await createTodo(page, t2);

		await page.locator(`button[aria-label="Delete: ${t1}"]`).click({ force: true });

		const secondRow = page.getByRole('listitem').filter({ hasText: t2 });
		await expect(secondRow.getByRole('checkbox')).toBeFocused({ timeout: 5000 });
	});
});
