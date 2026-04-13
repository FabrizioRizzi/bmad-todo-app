import { expect, test } from '@playwright/test';

function escapeForRegex(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test.describe('Story 4.3 - Responsive layout & touch targets', () => {
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

	test.describe('Mobile viewport (320×568)', () => {
		test.use({ viewport: { width: 320, height: 568 } });

		test('no horizontal scroll at 320px width', async ({ page }) => {
			await createTodo(page, `Mobile test ${Date.now()}`);

			const overflow = await page.evaluate(() => {
				const main = document.querySelector('main');
				if (!main) return { scrollWidth: 0, clientWidth: 0 };
				return {
					scrollWidth: document.documentElement.scrollWidth,
					clientWidth: document.documentElement.clientWidth,
				};
			});

			expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
		});

		test('no horizontal scroll with long todo description at 320px', async ({ page }) => {
			const longText = 'A'.repeat(200);
			await createTodo(page, longText);

			const overflow = await page.evaluate(() => ({
				scrollWidth: document.documentElement.scrollWidth,
				clientWidth: document.documentElement.clientWidth,
			}));

			expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
		});

		test('delete button is visible on mobile (no hover needed)', async ({ page }) => {
			const todoText = `Mobile delete ${Date.now()}`;
			await createTodo(page, todoText);

			const deleteBtn = page.locator(`button[aria-label="Delete: ${todoText}"]`);
			await expect(deleteBtn).toBeVisible();
			await expect(deleteBtn).toHaveCSS('opacity', '0.5');
		});

		test('input is NOT auto-focused on mobile', async ({ page }) => {
			const input = page.locator('[placeholder="Add a new task..."]');
			await expect(input).not.toBeFocused();
		});

		test('filter tabs have adequate touch target height', async ({ page }) => {
			const allTab = page.getByRole('tab', { name: /all,.*tasks/i });
			const box = await allTab.boundingBox();
			expect(box).toBeTruthy();
			expect(box?.height).toBeGreaterThanOrEqual(44);
		});

		test('add button has adequate touch target size', async ({ page }) => {
			const addBtn = page.getByRole('button', { name: /add task/i });
			const box = await addBtn.boundingBox();
			expect(box).toBeTruthy();
			expect(box?.width).toBeGreaterThanOrEqual(44);
			expect(box?.height).toBeGreaterThanOrEqual(44);
		});

		test('checkbox has adequate touch target size', async ({ page }) => {
			const todoText = `Touch target ${Date.now()}`;
			await createTodo(page, todoText);

			await page.getByRole('checkbox', {
				name: new RegExp(`Mark ${escapeForRegex(todoText)} as`),
			});
			const wrapper = page.locator(`li:has-text("${todoText}") .relative`).first();
			const box = await wrapper.boundingBox();
			expect(box).toBeTruthy();
			expect(box?.width).toBeGreaterThanOrEqual(44);
			expect(box?.height).toBeGreaterThanOrEqual(44);
		});

		test('delete button has adequate touch target size', async ({ page }) => {
			const todoText = `Delete target ${Date.now()}`;
			await createTodo(page, todoText);

			const deleteBtn = page.locator(`button[aria-label="Delete: ${todoText}"]`);
			const box = await deleteBtn.boundingBox();
			expect(box).toBeTruthy();
			expect(box?.width).toBeGreaterThanOrEqual(44);
			expect(box?.height).toBeGreaterThanOrEqual(44);
		});
	});

	test.describe('Desktop viewport (1280×720)', () => {
		test.use({ viewport: { width: 1280, height: 720 } });

		test('input is auto-focused on desktop', async ({ page }) => {
			const input = page.locator('[placeholder="Add a new task..."]');
			await expect(input).toBeFocused({ timeout: 3000 });
		});

		test('content is centered with max-width on desktop', async ({ page }) => {
			const main = page.locator('main');
			const box = await main.boundingBox();
			expect(box).toBeTruthy();
			expect(box?.width).toBeLessThanOrEqual(640 + 64 + 2);
		});

		test('delete button is hidden until hover on desktop', async ({ page }) => {
			const todoText = `Desktop hover ${Date.now()}`;
			await createTodo(page, todoText);

			const deleteBtn = page.locator(`button[aria-label="Delete: ${todoText}"]`);
			await expect(deleteBtn).toHaveCSS('opacity', '0');

			const card = page.locator(`li:has-text("${todoText}") .todo-card-bar`);
			await card.hover();
			await expect(deleteBtn).not.toHaveCSS('opacity', '0');
		});
	});

	test.describe('Tablet viewport (768×1024)', () => {
		test.use({ viewport: { width: 768, height: 1024 } });

		test('delete button is visible on tablet (no hover needed)', async ({ page }) => {
			const todoText = `Tablet delete ${Date.now()}`;
			await createTodo(page, todoText);

			const deleteBtn = page.locator(`button[aria-label="Delete: ${todoText}"]`);
			await expect(deleteBtn).toBeVisible();
			const opacity = await deleteBtn.evaluate((el) => getComputedStyle(el).opacity);
			expect(Number.parseFloat(opacity)).toBeGreaterThan(0);
		});

		test('no horizontal scroll at tablet width', async ({ page }) => {
			await createTodo(page, `Tablet test ${Date.now()}`);

			const overflow = await page.evaluate(() => ({
				scrollWidth: document.documentElement.scrollWidth,
				clientWidth: document.documentElement.clientWidth,
			}));

			expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
		});
	});

	test.describe('Single column layout', () => {
		test('layout remains single column at mobile, tablet, and desktop', async ({ page }) => {
			const viewports = [
				{ width: 320, height: 568 },
				{ width: 768, height: 1024 },
				{ width: 1280, height: 720 },
			];

			for (const viewport of viewports) {
				await page.setViewportSize(viewport);
				await createTodo(page, `Column ${viewport.width} ${Date.now()}`);

				const main = page.locator('main');
				const display = await main.evaluate((el) => getComputedStyle(el).display);
				expect(display).not.toContain('grid');

				const flexDir = await main.evaluate((el) => getComputedStyle(el).flexDirection);
				expect(flexDir === 'column' || flexDir === '' || display === 'block').toBeTruthy();
			}
		});
	});
});
