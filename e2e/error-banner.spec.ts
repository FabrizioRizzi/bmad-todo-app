import { expect, test } from '@playwright/test';

test.describe('Story 2.3 - Error Banner Component', () => {
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

	function errorBanner(page: import('@playwright/test').Page) {
		return page.locator('[data-testid="error-banner"]');
	}

	test('shows create error banner with correct message when create fails', async ({ page }) => {
		await page.route('**/api/todos', (route) => {
			if (route.request().method() === 'POST') {
				route.fulfill({
					status: 500,
					body: JSON.stringify({
						statusCode: 500,
						error: 'Internal Server Error',
						message: 'fail',
					}),
				});
			} else {
				route.continue();
			}
		});

		const input = page.locator('[placeholder="Add a new task..."]');
		await input.fill('Failing task');
		await input.press('Enter');

		const banner = errorBanner(page);
		await expect(banner).toBeVisible({ timeout: 5000 });
		await expect(banner).toContainText(
			"Couldn't add that task — check your connection and try again.",
		);
	});

	test('shows toggle error banner with correct message when toggle fails', async ({ page }) => {
		const todoText = `Toggle err ${Date.now()}`;
		await createTodo(page, todoText);

		await page.route('**/api/todos/**', (route) => {
			if (route.request().method() === 'PATCH') {
				route.fulfill({
					status: 500,
					body: JSON.stringify({
						statusCode: 500,
						error: 'Internal Server Error',
						message: 'fail',
					}),
				});
			} else {
				route.continue();
			}
		});

		const checkbox = page.locator(
			`input[type="checkbox"][aria-label="Toggle completion for: ${todoText}"]`,
		);
		await checkbox.click();

		const banner = errorBanner(page);
		await expect(banner).toBeVisible({ timeout: 5000 });
		await expect(banner).toContainText("Couldn't update that task — try again.");
	});

	test('shows delete error banner with correct message when delete fails', async ({ page }) => {
		const todoText = `Delete err ${Date.now()}`;
		await createTodo(page, todoText);

		await page.route('**/api/todos/*', (route) => {
			if (route.request().method() === 'DELETE') {
				route.fulfill({
					status: 500,
					body: JSON.stringify({
						statusCode: 500,
						error: 'Internal Server Error',
						message: 'fail',
					}),
				});
			} else {
				route.continue();
			}
		});

		const deleteBtn = page.locator(`button[aria-label="Delete: ${todoText}"]`);
		await deleteBtn.click({ force: true });

		// Wait for undo timer to expire so DELETE is actually sent
		await page.waitForTimeout(6000);

		const banner = errorBanner(page);
		await expect(banner).toBeVisible({ timeout: 5000 });
		await expect(banner).toContainText("Couldn't delete that task — try again.");
	});

	test('error banner has role="alert" and aria-live="assertive"', async ({ page }) => {
		await page.route('**/api/todos', (route) => {
			if (route.request().method() === 'POST') {
				route.fulfill({
					status: 500,
					body: JSON.stringify({
						statusCode: 500,
						error: 'Internal Server Error',
						message: 'fail',
					}),
				});
			} else {
				route.continue();
			}
		});

		const input = page.locator('[placeholder="Add a new task..."]');
		await input.fill('A11y test');
		await input.press('Enter');

		const banner = errorBanner(page);
		await expect(banner).toBeVisible({ timeout: 5000 });
		await expect(banner).toHaveAttribute('role', 'alert');
		await expect(banner).toHaveAttribute('aria-live', 'assertive');
	});

	test('error banner contains warning icon', async ({ page }) => {
		await page.route('**/api/todos', (route) => {
			if (route.request().method() === 'POST') {
				route.fulfill({
					status: 500,
					body: JSON.stringify({
						statusCode: 500,
						error: 'Internal Server Error',
						message: 'fail',
					}),
				});
			} else {
				route.continue();
			}
		});

		const input = page.locator('[placeholder="Add a new task..."]');
		await input.fill('Icon test');
		await input.press('Enter');

		const banner = errorBanner(page);
		await expect(banner).toBeVisible({ timeout: 5000 });

		const warningIcon = banner.locator('span[aria-hidden="true"]');
		await expect(warningIcon).toBeVisible();
		await expect(warningIcon).toContainText('⚠');
	});

	test('error banner is positioned between input and todo list', async ({ page }) => {
		await page.route('**/api/todos', (route) => {
			if (route.request().method() === 'POST') {
				route.fulfill({
					status: 500,
					body: JSON.stringify({
						statusCode: 500,
						error: 'Internal Server Error',
						message: 'fail',
					}),
				});
			} else {
				route.continue();
			}
		});

		const input = page.locator('[placeholder="Add a new task..."]');
		await input.fill('Position test');
		await input.press('Enter');

		const banner = errorBanner(page);
		await expect(banner).toBeVisible({ timeout: 5000 });

		const inputSection = page.locator('section[aria-label="Add new todo"]');
		const todoSection = page.locator('section[aria-label="Todo list"]');

		const inputBox = await inputSection.boundingBox();
		const bannerBox = await banner.boundingBox();
		const todoBox = await todoSection.boundingBox();

		if (!inputBox || !bannerBox || !todoBox) {
			throw new Error('Could not get bounding boxes for layout assertion');
		}

		// Banner should be below input section and above todo list section
		expect(bannerBox.y).toBeGreaterThan(inputBox.y);
		expect(bannerBox.y).toBeLessThan(todoBox.y);
	});

	test('auto-dismisses after 8 seconds', async ({ page }) => {
		await page.route('**/api/todos', (route) => {
			if (route.request().method() === 'POST') {
				route.fulfill({
					status: 500,
					body: JSON.stringify({
						statusCode: 500,
						error: 'Internal Server Error',
						message: 'fail',
					}),
				});
			} else {
				route.continue();
			}
		});

		const input = page.locator('[placeholder="Add a new task..."]');
		await input.fill('Auto dismiss test');
		await input.press('Enter');

		const banner = errorBanner(page);
		await expect(banner).toBeVisible({ timeout: 5000 });

		// Should still be visible after 5 seconds
		await page.waitForTimeout(5000);
		await expect(banner).toBeVisible();

		// Should be gone after 8+ seconds total (wait 4 more = 9 total)
		await page.waitForTimeout(4000);
		await expect(banner).not.toBeVisible({ timeout: 3000 });
	});

	test('dismisses on successful action', async ({ page }) => {
		let postCallCount = 0;

		await page.route('**/api/todos', (route) => {
			if (route.request().method() === 'POST') {
				postCallCount++;
				if (postCallCount === 1) {
					route.fulfill({
						status: 500,
						body: JSON.stringify({
							statusCode: 500,
							error: 'Internal Server Error',
							message: 'fail',
						}),
					});
				} else {
					route.continue();
				}
			} else {
				route.continue();
			}
		});

		const input = page.locator('[placeholder="Add a new task..."]');

		// First attempt fails
		await input.fill('Fail first');
		await input.press('Enter');

		const banner = errorBanner(page);
		await expect(banner).toBeVisible({ timeout: 5000 });

		// Second attempt succeeds — banner should dismiss
		await input.fill(`Success ${Date.now()}`);
		await input.press('Enter');

		await expect(banner).not.toBeVisible({ timeout: 5000 });
	});

	test('new error replaces previous error (no stacking)', async ({ page }) => {
		const todoText = `Replace err ${Date.now()}`;
		await createTodo(page, todoText);

		// First: fail a create
		await page.route('**/api/todos', (route) => {
			if (route.request().method() === 'POST') {
				route.fulfill({
					status: 500,
					body: JSON.stringify({
						statusCode: 500,
						error: 'Internal Server Error',
						message: 'fail',
					}),
				});
			} else {
				route.continue();
			}
		});

		// Also fail toggle
		await page.route('**/api/todos/**', (route) => {
			if (route.request().method() === 'PATCH') {
				route.fulfill({
					status: 500,
					body: JSON.stringify({
						statusCode: 500,
						error: 'Internal Server Error',
						message: 'fail',
					}),
				});
			} else {
				route.continue();
			}
		});

		const input = page.locator('[placeholder="Add a new task..."]');
		await input.fill('Stacking test');
		await input.press('Enter');

		const banner = errorBanner(page);
		await expect(banner).toBeVisible({ timeout: 5000 });
		await expect(banner).toContainText("Couldn't add that task");

		// Now trigger a toggle error
		const checkbox = page.locator(
			`input[type="checkbox"][aria-label="Toggle completion for: ${todoText}"]`,
		);
		await checkbox.click();

		// Banner should now show toggle error, not create error
		await expect(banner).toContainText("Couldn't update that task — try again.");

		// Only one banner should exist
		const banners = page.locator('[data-testid="error-banner"]');
		await expect(banners).toHaveCount(1);
	});

	test('error banner preserves input value on create failure', async ({ page }) => {
		await page.route('**/api/todos', (route) => {
			if (route.request().method() === 'POST') {
				route.fulfill({
					status: 500,
					body: JSON.stringify({
						statusCode: 500,
						error: 'Internal Server Error',
						message: 'fail',
					}),
				});
			} else {
				route.continue();
			}
		});

		const input = page.locator('[placeholder="Add a new task..."]');
		const testValue = 'Preserve me';

		await input.fill(testValue);
		await input.press('Enter');

		await expect(errorBanner(page)).toBeVisible({ timeout: 5000 });

		// Input should still have the value so user can retry
		await expect(input).toHaveValue(testValue);
	});
});
