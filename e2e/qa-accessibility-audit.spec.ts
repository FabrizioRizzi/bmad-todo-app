import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { TodoPage } from './fixtures/todo-page';

test.describe('WCAG AA Accessibility Audit', () => {
	let todoPage: TodoPage;

	test.beforeEach(async ({ page }) => {
		todoPage = new TodoPage(page);
		await todoPage.goto();
	});

	test.afterEach(async ({ request }) => {
		await todoPage.cleanup(request);
	});

	test('empty state passes axe-core WCAG AA', async ({ page }) => {
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.analyze();

		logViolations(results.violations);
		expect(results.violations).toEqual([]);
	});

	test('populated list passes axe-core WCAG AA', async ({ page }) => {
		await todoPage.addTodo('Audit task one');
		await todoPage.addTodo('Audit task two');

		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.analyze();

		logViolations(results.violations);
		expect(results.violations).toEqual([]);
	});

	test('completed todo state passes axe-core WCAG AA', async ({ page }) => {
		await todoPage.addTodo('Complete me for audit');
		await todoPage.completeTodo(0);

		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.analyze();

		logViolations(results.violations);
		expect(results.violations).toEqual([]);
	});

	test('filter views pass axe-core WCAG AA', async ({ page }) => {
		await todoPage.addTodo('Filter audit active');
		await todoPage.addTodo('Filter audit completed');
		await todoPage.completeTodo(1);

		for (const filter of ['Active', 'Completed', 'All'] as const) {
			await todoPage.filterBy(filter);
			await page.waitForTimeout(400);

			const results = await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
				.analyze();

			logViolations(results.violations, `Filter: ${filter}`);
			expect(results.violations, `Violations found in ${filter} filter view`).toEqual([]);
		}
	});

	test('error banner state passes axe-core WCAG AA', async ({ page }) => {
		await page.route('**/api/todos', (route) => {
			if (route.request().method() === 'POST') {
				return route.fulfill({ status: 500, body: 'Server Error' });
			}
			return route.continue();
		});

		const input = page.locator('[placeholder="Add a new task..."]');
		await input.fill('Trigger error');
		await input.press('Enter');
		await page.waitForTimeout(1000);

		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.analyze();

		logViolations(results.violations, 'Error banner visible');
		expect(results.violations).toEqual([]);
	});
});

function logViolations(violations: import('axe-core').Result[], context = '') {
	if (violations.length === 0) return;
	const prefix = context ? `[${context}] ` : '';
	console.log(`\n${prefix}${violations.length} accessibility violation(s):\n`);
	for (const v of violations) {
		console.log(`  Rule: ${v.id} (${v.impact})`);
		console.log(`  Help: ${v.help}`);
		console.log(`  URL:  ${v.helpUrl}`);
		console.log(`  Nodes: ${v.nodes.length}`);
		for (const node of v.nodes.slice(0, 3)) {
			console.log(`    - ${node.html.slice(0, 120)}`);
		}
		console.log('');
	}
}
