import { expect, test } from '@playwright/test';

import { TodoTracker } from './fixtures/test-cleanup';

const API_BASE = 'http://localhost:3000';
const tracker = new TodoTracker();

function localIsoDate(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

function twoUpcomingDueDates(): { first: string; second: string } {
	const a = new Date();
	a.setDate(a.getDate() + 3);
	const b = new Date();
	b.setDate(b.getDate() + 10);
	return { first: localIsoDate(a), second: localIsoDate(b) };
}

function todoCardBar(page: import('@playwright/test').Page, description: string) {
	return page
		.locator(`text=${description}`)
		.first()
		.locator('xpath=ancestor::div[contains(@class,"todo-card-bar")]');
}

function addInputDueDateButton(page: import('@playwright/test').Page) {
	return page.getByRole('button', { name: 'Set due date', exact: true });
}

async function pickCalendarDay(page: import('@playwright/test').Page, isoDate: string) {
	const btn = page.locator(`[role="grid"]:visible [data-day="${isoDate}"] button`).first();
	await expect(btn).toBeVisible({ timeout: 5000 });
	await btn.click();
}

test.describe('Story 3.1 - Due date support', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('domcontentloaded');
		await page.locator('h1').waitFor({ state: 'visible', timeout: 5000 });
	});

	test.afterEach(async ({ request }) => {
		await tracker.cleanup(request);
	});

	test('opens AddInput date picker, creates todo with Today badge, resets calendar control', async ({
		page,
	}) => {
		const todoText = `Due today ${Date.now()}`;
		const todayIso = localIsoDate(new Date());

		await addInputDueDateButton(page).click();
		await expect(page.locator('[role="grid"]:visible')).toBeVisible();
		await pickCalendarDay(page, todayIso);

		const input = page.locator('[placeholder="Add a new task..."]');
		await input.fill(todoText);
		await input.press('Enter');
		tracker.track(todoText);

		await page.locator(`text=${todoText}`).first().waitFor({ state: 'visible', timeout: 10000 });

		const bar = todoCardBar(page, todoText);
		await expect(
			bar.getByRole('button', { name: `Change due date for ${todoText}` }),
		).toContainText('Today');

		await expect(input).toHaveValue('');
		const setDueBtn = addInputDueDateButton(page);
		await expect(setDueBtn.locator('svg')).toBeVisible();
	});

	test('todo without due date shows set-due-date control on the card', async ({ page }) => {
		const todoText = `No date ${Date.now()}`;
		const input = page.locator('[placeholder="Add a new task..."]');
		await input.fill(todoText);
		await input.press('Enter');
		tracker.track(todoText);
		await page.locator(`text=${todoText}`).first().waitFor({ state: 'visible', timeout: 10000 });

		const bar = todoCardBar(page, todoText);
		await expect(bar.getByRole('button', { name: `Set due date for ${todoText}` })).toBeVisible();
		await expect(
			bar.getByRole('button', { name: `Set due date for ${todoText}` }).locator('svg'),
		).toBeVisible();
	});

	test('inline change due date updates badge', async ({ page }) => {
		const todoText = `Inline due ${Date.now()}`;
		const { first: isoFirst, second: isoSecond } = twoUpcomingDueDates();

		await addInputDueDateButton(page).click();
		await pickCalendarDay(page, isoFirst);

		const input = page.locator('[placeholder="Add a new task..."]');
		await input.fill(todoText);
		await input.press('Enter');
		tracker.track(todoText);
		await page.locator(`text=${todoText}`).first().waitFor({ state: 'visible', timeout: 10000 });

		const changeBtn = todoCardBar(page, todoText).getByRole('button', {
			name: `Change due date for ${todoText}`,
		});
		const before = await changeBtn.textContent();
		await changeBtn.click();
		await expect(page.locator('[role="grid"]:visible')).toBeVisible();
		await pickCalendarDay(page, isoSecond);

		await expect(changeBtn).not.toHaveText(before ?? '', { timeout: 10000 });
	});

	test('clears due date from card popover', async ({ page }) => {
		const todoText = `Clear due ${Date.now()}`;
		const now = new Date();
		const iso12 = localIsoDate(new Date(now.getFullYear(), now.getMonth(), 12));

		await addInputDueDateButton(page).click();
		await pickCalendarDay(page, iso12);

		const input = page.locator('[placeholder="Add a new task..."]');
		await input.fill(todoText);
		await input.press('Enter');
		tracker.track(todoText);
		await page.locator(`text=${todoText}`).first().waitFor({ state: 'visible', timeout: 10000 });

		await todoCardBar(page, todoText)
			.getByRole('button', { name: `Change due date for ${todoText}` })
			.click();
		await page.getByRole('button', { name: 'Clear due date' }).click();

		await expect(
			todoCardBar(page, todoText).getByRole('button', { name: `Set due date for ${todoText}` }),
		).toBeVisible();
	});

	test('active todo with past due shows Overdue styling', async ({ page, request }) => {
		const todoText = `Overdue e2e ${Date.now()}`;
		const res = await request.post(`${API_BASE}/api/todos`, {
			data: { description: todoText, dueDate: '2020-06-01' },
		});
		expect(res.ok()).toBeTruthy();
		tracker.track(todoText);

		await page.reload();
		await page.waitForLoadState('domcontentloaded');
		await page.locator('h1').waitFor({ state: 'visible', timeout: 5000 });

		const bar = todoCardBar(page, todoText);
		await expect(bar).toHaveClass(/todo-card-overdue/);
		await expect(
			bar.getByRole('button', { name: `Change due date for ${todoText}` }),
		).toContainText('Overdue');
	});

	test('completed todo with past due does not show overdue styling', async ({ page, request }) => {
		const todoText = `Done overdue ${Date.now()}`;
		const createRes = await request.post(`${API_BASE}/api/todos`, {
			data: { description: todoText, dueDate: '2020-06-01' },
		});
		expect(createRes.ok()).toBeTruthy();
		tracker.track(todoText);
		const created = (await createRes.json()) as { id: string };

		const patchRes = await request.patch(`${API_BASE}/api/todos/${created.id}`, {
			data: { isCompleted: true },
		});
		expect(patchRes.ok()).toBeTruthy();

		await page.reload();
		await page.waitForLoadState('domcontentloaded');
		await page.locator('h1').waitFor({ state: 'visible', timeout: 5000 });

		const bar = todoCardBar(page, todoText);
		await expect(bar).not.toHaveClass(/todo-card-overdue/);
	});

	test('shows error when due date PATCH fails', async ({ page }) => {
		const todoText = `Due patch err ${Date.now()}`;
		const now = new Date();
		const iso5 = localIsoDate(new Date(now.getFullYear(), now.getMonth(), 5));
		const iso8 = localIsoDate(new Date(now.getFullYear(), now.getMonth(), 8));

		await addInputDueDateButton(page).click();
		await pickCalendarDay(page, iso5);

		const input = page.locator('[placeholder="Add a new task..."]');
		await input.fill(todoText);
		await input.press('Enter');
		tracker.track(todoText);
		await page.locator(`text=${todoText}`).first().waitFor({ state: 'visible', timeout: 10000 });

		await page.route('**/api/todos/**', (route) => {
			if (route.request().method() === 'PATCH') {
				const raw = route.request().postData();
				try {
					const body = raw ? (JSON.parse(raw) as { dueDate?: unknown }) : {};
					if ('dueDate' in body) {
						route.abort('failed');
						return;
					}
				} catch {
					/* fall through */
				}
			}
			route.continue();
		});

		await todoCardBar(page, todoText)
			.getByRole('button', { name: `Change due date for ${todoText}` })
			.click();
		await pickCalendarDay(page, iso8);

		const banner = page.locator('[data-testid="error-banner"]');
		await expect(banner).toBeVisible({ timeout: 10000 });
		await expect(banner).toContainText("Couldn't update the due date — try again.");
	});
});
