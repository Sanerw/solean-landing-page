import { expect, test, type Page } from '@playwright/test';

/**
 * The marketing surfaces at the widths people actually use. Nothing opened `/` or the learn
 * article below 1440 before this, so a phone-only layout defect had nowhere to be caught.
 *
 * Vertical scrolling is normal here at every width: these are long pages by design, unlike a
 * questionnaire step. Horizontal scrolling never is.
 */
const NARROW = [
	{ width: 390, height: 844 },
	{ width: 768, height: 1024 }
] as const;

/**
 * The one symptom that matters: the page itself scrolls sideways. An element wider than the
 * viewport is not the defect on its own, because a wide table inside an `overflow-x` wrapper
 * or a clipped visually-hidden one is exactly how those are meant to be built. The names are
 * collected only to say which element to look at when the page really does overflow.
 */
async function noHorizontalOverflow(page: Page, where: string): Promise<void> {
	const report = await page.evaluate(() => {
		const root = document.documentElement;
		const wide = Array.from(document.querySelectorAll('*'))
			.filter((element) => element.getBoundingClientRect().right > root.clientWidth + 0.5)
			.slice(0, 5)
			.map((element) => {
				const box = element.getBoundingClientRect();
				const name = element.getAttribute('data-slot') ?? element.tagName.toLowerCase();

				return `${name} right=${Math.round(box.right)} width=${Math.round(box.width)}`;
			});

		return { clientWidth: root.clientWidth, scrollWidth: root.scrollWidth, wide };
	});

	expect(
		report.scrollWidth,
		`${where} must not overflow horizontally. Widest elements: ${report.wide.join(', ') || 'none'}`
	).toBeLessThanOrEqual(report.clientWidth);
}

for (const viewport of NARROW) {
	test(`the landing page fits at ${viewport.width}`, async ({ page }) => {
		await page.setViewportSize(viewport);
		await page.goto('/');

		// Every band, because the projection chart and the bento are the two places with
		// geometry that does not simply reflow.
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		await page.getByRole('contentinfo').scrollIntoViewIfNeeded();
		await page.waitForTimeout(300);

		await noHorizontalOverflow(page, `the landing page at ${viewport.width}`);
	});

	test(`the learn article fits at ${viewport.width}`, async ({ page }) => {
		await page.setViewportSize(viewport);
		await page.goto('/learn/blog/mounjaro-vs-wegovy');

		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		await page.getByRole('contentinfo').scrollIntoViewIfNeeded();
		await page.waitForTimeout(300);

		await noHorizontalOverflow(page, `the learn article at ${viewport.width}`);
	});
}

test('the mobile navigation opens and closes', async ({ page }) => {
	await page.setViewportSize(NARROW[0]);
	await page.goto('/');

	await page.getByRole('button', { name: 'Open menu' }).click();
	const menu = page.getByRole('dialog');
	await expect(menu.getByRole('navigation', { name: 'Main' })).toBeVisible();

	// Open is not enough: a sheet that cannot be dismissed traps a phone user on one screen.
	await menu.getByRole('button', { name: 'Close' }).click();
	await expect(menu).toBeHidden();
	await noHorizontalOverflow(page, 'the landing page after the menu closes');
});

/**
 * The comparison table is the one element on either surface that cannot simply reflow: it has
 * five columns of prose and a `min-w-lg` floor. It is meant to scroll inside its own wrapper,
 * which is why the page does not. Asserted because both halves of that are load-bearing: drop
 * the wrapper's `overflow-x` and the page scrolls sideways, drop the floor and the columns
 * squash into unreadable slivers.
 */
test('the comparison table scrolls inside itself rather than squashing or moving the page', async ({
	page
}) => {
	await page.setViewportSize(NARROW[0]);
	await page.goto('/learn/blog/mounjaro-vs-wegovy');

	const table = page.locator('table').first();
	await table.scrollIntoViewIfNeeded();

	const measured = await table.evaluate((element) => {
		const wrapper = element.parentElement;

		return {
			tableWidth: Math.round(element.getBoundingClientRect().width),
			wrapperWidth: Math.round(wrapper?.getBoundingClientRect().width ?? 0),
			wrapperScrollWidth: wrapper?.scrollWidth ?? 0,
			overflowX: wrapper ? getComputedStyle(wrapper).overflowX : 'none'
		};
	});

	expect(measured.overflowX, 'the table wrapper must scroll horizontally').toBe('auto');
	expect(
		measured.wrapperScrollWidth,
		'the table must be wider than its wrapper, or it has been squashed rather than scrolled'
	).toBeGreaterThan(measured.wrapperWidth);
	await noHorizontalOverflow(page, 'the learn article beside its table');
});

test('the table of contents is reachable on a phone', async ({ page }) => {
	await page.setViewportSize(NARROW[0]);
	await page.goto('/learn/blog/mounjaro-vs-wegovy');

	// Two columns on a phone rather than the desktop's sticky rail, and every entry has to be
	// a real link: the article is long enough that scrolling to a section by hand is the
	// difference between reading it and leaving.
	const toc = page.getByRole('navigation', { name: 'On this page' });
	await expect(toc).toBeVisible();
	await expect(toc.getByRole('link').first()).toBeVisible();
});
