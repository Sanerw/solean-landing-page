import { expect, test } from '@playwright/test';
import { walkTo } from './answers';

/**
 * German compounds the choices: "Gewichtsverlustoperation" is one word wider than the card
 * holding it. The wording is Solean's from feature 24a, but it is a clinical term rather than
 * marketing copy, so shortening it is not the fix; the card has to wrap it.
 *
 * Measured rather than eyeballed. A title whose `scrollWidth` exceeds its `clientWidth` is
 * painting outside its own box, which is what running into the neighbouring column looks
 * like, and no screenshot assertion states it that plainly.
 */
async function spillingTitles(page: import('@playwright/test').Page) {
	return page.evaluate(() =>
		[...document.querySelectorAll('[data-slot="field-title"]')]
			.filter((title) => title.scrollWidth > title.clientWidth + 1)
			.map((title) => ({
				text: title.textContent?.trim().slice(0, 60) ?? '',
				client: title.clientWidth,
				scroll: title.scrollWidth
			}))
	);
}

test('a choice too long for its card wraps inside it', async ({ page }) => {
	await walkTo(page, 'medical-conditions');

	// Asserted on both tests: without it a walk that stepped past the screen would report no
	// spilling titles because there were no titles at all.
	await expect(
		page.getByRole('checkbox', { name: /Gewichtsverlustoperation/ })
	).toBeVisible();

	expect(await spillingTitles(page)).toEqual([]);
});

// The same card at the width where the text has least room to wrap into.
test('it wraps on a narrow phone too', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 720 });
	await walkTo(page, 'medical-conditions');

	await expect(
		page.getByRole('checkbox', { name: /Gewichtsverlustoperation/ })
	).toBeVisible();
	expect(await spillingTitles(page)).toEqual([]);
});
