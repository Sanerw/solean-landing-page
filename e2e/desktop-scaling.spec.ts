import { expect, test, type Page } from '@playwright/test';
import { UI } from './ui-labels';

/**
 * The root font-size step that makes the site grow past 1280px, and the one promise that comes
 * with it: the viewports below the step keep exactly the rendering they had.
 *
 * The site is drawn on a 1920px canvas but carried no `2xl:` utility anywhere, so every surface
 * rendered around 0.6x its artboard on a large desktop. The fix is two guarded media queries in
 * `src/routes/layout.css` rather than a `2xl:` prefix on ~150 class strings, because every
 * Tailwind size is a `rem` and stepping the root scales type, spacing and control heights
 * together.
 *
 * What makes this worth a spec is that the queries constrain **height** as well as width, which
 * looks like a mistake and is not. The product hero is built so the consultation CTA sits above
 * the fold, and width alone cannot honour that: 1536x864 is what a 1920x1080 monitor reports at
 * Windows 125% display scaling, and stepping it pushes the CTA off the screen. Someone
 * simplifying these to plain `min-width` queries, or swapping `scaled:` for `2xl:`, would break
 * that silently on a very common screen. These assertions are what fails instead.
 */
const STEPS = [
	// Below the step. These two must not move at all.
	{ width: 1280, height: 720, root: 16, why: 'below the width threshold' },
	{ width: 1440, height: 900, root: 16, why: 'the 13 inch laptop the hero was tuned for' },
	{ width: 1536, height: 864, root: 16, why: '1920x1080 at Windows 125% scaling: too short' },
	// Stepped.
	{ width: 1600, height: 900, root: 18, why: 'wide enough, and tall enough for the first step' },
	{ width: 1920, height: 1080, root: 20, why: 'the canvas the artboards are drawn on' },
	{ width: 2560, height: 1440, root: 20, why: 'the step is capped, not proportional' }
] as const;

/** The height guard alone, held against the width it would otherwise be paired with. */
const SHORT_BUT_WIDE = [
	{ width: 1920, height: 900, root: 18, why: 'wide enough for the second step, too short for it' },
	{ width: 2560, height: 800, root: 16, why: 'too short for either step' }
] as const;

async function rootFontSize(page: Page): Promise<number> {
	return page.evaluate(() =>
		Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
	);
}

for (const step of STEPS) {
	test(`the root steps to ${step.root}px at ${step.width}x${step.height}`, async ({ page }) => {
		await page.setViewportSize({ width: step.width, height: step.height });
		await page.goto('/treatments/mounjaro');
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

		expect(await rootFontSize(page), `${step.width}x${step.height}: ${step.why}`).toBe(step.root);
	});
}

for (const step of SHORT_BUT_WIDE) {
	test(`the height guard holds at ${step.width}x${step.height}`, async ({ page }) => {
		await page.setViewportSize({ width: step.width, height: step.height });
		await page.goto('/treatments/mounjaro');
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

		expect(await rootFontSize(page), `${step.width}x${step.height}: ${step.why}`).toBe(step.root);
	});
}

/**
 * The reason the guards exist, asserted directly rather than through the root size. A step that
 * pushes this button off the screen has taken the page's only call to action with it.
 */
for (const viewport of [
	{ width: 1440, height: 900 },
	{ width: 1536, height: 864 },
	{ width: 1600, height: 900 },
	{ width: 1920, height: 1080 },
	{ width: 2560, height: 1440 }
]) {
	test(`the consultation CTA stays above the fold at ${viewport.width}x${viewport.height}`, async ({
		page
	}) => {
		await page.setViewportSize(viewport);
		await page.goto('/treatments/mounjaro');

		// The offer card's own button. The sticky bar carries the same label, but it is the
		// narrow artboard's answer and is `md:hidden`, so the role selector never reaches it at
		// these widths: a hidden element is not in the accessibility tree.
		const cta = page.getByRole('link', { name: UI.consultationCta });
		await expect(cta).toBeVisible();

		const bottom = await cta.evaluate((element) => element.getBoundingClientRect().bottom);
		expect(
			Math.round(bottom),
			`the consultation CTA must sit above the fold at ${viewport.width}x${viewport.height}`
		).toBeLessThanOrEqual(viewport.height);
	});
}

/**
 * Scaling the root scales every `rem` on the page, so the widest fixed element grows with it.
 * The largest viewport is where a column ladder that no longer fits would show up first.
 */
test('the stepped pages do not overflow sideways at 2560', async ({ page }) => {
	await page.setViewportSize({ width: 2560, height: 1440 });

	for (const path of ['/', '/learn', '/treatments/mounjaro']) {
		await page.goto(path);
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		await page.getByRole('contentinfo').scrollIntoViewIfNeeded();
		await page.waitForTimeout(300);

		const report = await page.evaluate(() => {
			const root = document.documentElement;
			const wide = Array.from(document.querySelectorAll('*'))
				.filter((element) => element.getBoundingClientRect().right > root.clientWidth + 0.5)
				.slice(0, 5)
				.map((element) => element.getAttribute('data-slot') ?? element.tagName.toLowerCase());

			return { clientWidth: root.clientWidth, scrollWidth: root.scrollWidth, wide };
		});

		expect(
			report.scrollWidth,
			`${path} must not overflow at 2560. Widest: ${report.wide.join(', ') || 'none'}`
		).toBeLessThanOrEqual(report.clientWidth);
	}
});

/**
 * Step 2's half. The dose segment is the one control whose padding had to follow the root step
 * rather than ride on it, because `md:py-3` tightens it to buy back the height the "/ Monat"
 * suffix costs. `scaled:py-4` puts it back, and `scaled:` carries the same height guard as the
 * root step, so swapping it for `2xl:` would change 1536x864.
 */
test('the dose segment grows with the step and not before it', async ({ page }) => {
	// Waits on the root size rather than on the clock: the tile's height is downstream of the
	// step, so measuring before the stylesheet has settled reads the previous viewport's tile.
	const heightAt = async (width: number, height: number, root: number): Promise<number> => {
		await page.setViewportSize({ width, height });
		await page.goto('/treatments/mounjaro');
		const segment = page.getByRole('radio').first();
		await expect(segment).toBeVisible();
		await expect
			.poll(() => rootFontSize(page), { message: `root font-size at ${width}x${height}` })
			.toBe(root);

		return segment.evaluate((element) => Math.round(element.getBoundingClientRect().height));
	};

	const laptop = await heightAt(1440, 900, 16);
	const scaledShort = await heightAt(1536, 864, 16);
	const stepped = await heightAt(1920, 1080, 20);

	expect(scaledShort, 'a short 1536 viewport keeps the laptop rendering').toBe(laptop);
	expect(stepped, 'the stepped viewport draws the artboard tile').toBeGreaterThan(laptop);
});
