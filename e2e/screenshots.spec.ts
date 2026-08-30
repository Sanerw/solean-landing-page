import { expect, test } from '@playwright/test';

/**
 * Not an assertion suite: it captures the screens the model currently produces so they can be
 * compared with the artboards by eye. It stops where feature 10 picks up, at the first
 * question type that has no renderer.
 */
test('capture the questionnaire screens', async ({ page }) => {
	const shot = (name: string) => page.screenshot({ path: `screens/${name}.png`, fullPage: true });

	await page.goto('/questionnaire/page30');
	await shot('01-first-question');

	await page.goto('/questionnaire/page3');
	await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
	await page.getByRole('radio', { name: 'Weiblich' }).click();
	await shot('02-single-choice');

	await page.goto('/questionnaire/page26');
	await shot('03-unrenderable-question');

	await page.goto('/questionnaire/motivation');
	await shot('04-motivation');

	await page.goto('/questionnaire/complete');
	await shot('05-complete');
});
