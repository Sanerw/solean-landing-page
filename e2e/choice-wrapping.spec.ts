import { expect, test } from '@playwright/test';
import { walkTo } from './answers';

/**
 * The model writes the choices, and German compounds them: "Gewichtsverlustoperation/
 * Gewichtsreduktionschirurgie" is one word wider than the card holding it. Nothing here can
 * shorten that text, so the card has to wrap it.
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
	await walkTo(page, 'page1');

	await expect(
		page.getByRole('checkbox', { name: /Gewichtsverlustoperation/ })
	).toBeVisible();

	expect(await spillingTitles(page)).toEqual([]);
});

// The same card at the width where the text has least room to wrap into.
test('it wraps on a narrow phone too', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 720 });
	await walkTo(page, 'page1');

	expect(await spillingTitles(page)).toEqual([]);
});
