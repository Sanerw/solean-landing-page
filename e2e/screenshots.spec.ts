import { expect, test } from '@playwright/test';
import { EVERY_ANSWER, seedAnswers } from './answers';
import { selectDateOfBirth } from './date-picker';
import { confirmPlan } from './recommendation';

/**
 * Not an assertion suite: it walks the fixture questionnaire once and captures the screen
 * each question type produces, so they can be compared with the artboards by eye. The walk
 * is what makes the later screens reachable at all, since a page behind a `visibleIf` only
 * joins the step plan once the answer it depends on is in the engine, and a reload would
 * throw those answers away.
 */
test('capture the questionnaire screens', async ({ page }) => {
	const shot = (name: string) => page.screenshot({ path: `screens/${name}.png`, fullPage: true });
	// The step id as well as the button state: Continue is enabled on the screen just left
	// behind too, so waiting on it alone would type the next answer into the previous page.
	const ready = async (step: string) => {
		await expect(page).toHaveURL(`/questionnaire/${step}`);
		await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
	};
	const advance = () => page.getByRole('button', { name: 'Continue' }).click();

	await page.goto('/questionnaire');
	await ready('page30');
	await shot('01-text-and-notice');
	await advance();

	await ready('page27');
	await page.getByLabel('Bitte gib Deinen Vornamen an.').fill('Jonas');
	await page.getByLabel('Bitte gib Deinen Nachnamen an.').fill('Weber');
	await shot('02-short-text');
	await advance();

	await ready('page26');
	await page.getByLabel('Bitte gib Dein Geburtsdatum an').click();
	await expect(page.locator('[data-slot="popover-content"]')).toHaveCSS('opacity', '1');
	await shot('03-date-picker-open');
	await page.keyboard.press('Escape');
	await selectDateOfBirth(page);
	await shot('03-date-of-birth');
	await advance();

	await ready('page3');
	await page.getByRole('radio', { name: 'Weiblich' }).click();
	await shot('04-single-choice');
	await advance();

	// The branch the answer above opens.
	await ready('page4');
	await page.getByRole('radio', { name: 'Nein' }).click();
	await shot('05-conditional-question');
	await advance();

	await ready('page2');
	// A BMI between 27 and 30, which is what the conditions question below is behind.
	await page.getByLabel('Größe (cm)').fill('178');
	await page.getByLabel('Gewicht (kg)').fill('90');
	await shot('06-composite-input');
	await advance();

	// Solean's own screens, both drawn from what has been answered by the time they appear.
	await expect(page).toHaveURL('/questionnaire/projection');
	await shot('07-projection');
	await advance();

	await ready('page1');
	await page.getByRole('checkbox', { name: 'Knie- oder Hüftarthrose' }).click();
	await shot('08-multiple-choice');
	await advance();

	await ready('page16');
	await page.getByRole('checkbox', { name: 'Keine der Genannten' }).click();
	await shot('09-allergies');
	await advance();

	await expect(page).toHaveURL('/questionnaire/motivation');
	await shot('10-motivation');
	await advance();

	await ready('page18');
	await page.getByRole('radio', { name: 'Andere' }).click();
	await page.getByRole('textbox').fill('Metformin 500mg');
	await shot('11-other-free-text');
	await advance();

	await ready('page22');
	await page.getByRole('radio', { name: 'Ja' }).click();
	await advance();

	await ready('page23');
	await page.getByRole('textbox').fill('Leichte Übelkeit in der ersten Woche.');
	await shot('12-long-free-text');
	await advance();

	await expect(page).toHaveURL('/questionnaire/complete');
	await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
	await shot('13-recommendation-choice');

	await confirmPlan(page);
	await expect(page.getByRole('button', { name: 'Go to checkout' })).toBeVisible();
	await shot('14-recommendation');
});

/**
 * The two ways a submission fails. Both are screens a person can actually land on, so they
 * are captured beside the rest rather than only asserted.
 */
test('capture the submission failures', async ({ page }) => {
	const shot = (name: string) => page.screenshot({ path: `screens/${name}.png`, fullPage: true });

	for (const [marker, name] of [
		['TRIGGER-400', '15-submission-rejected'],
		['TRIGGER-502', '16-submission-unavailable']
	] as const) {
		await seedAnswers(page, { ...EVERY_ANSWER, EMail: marker });
		await page.goto('/questionnaire/page22');
		await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
		await page.getByRole('button', { name: 'Continue' }).click();
		await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
		await shot(name);
	}
});
