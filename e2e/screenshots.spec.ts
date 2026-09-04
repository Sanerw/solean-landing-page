import { expect, test } from '@playwright/test';
import { UI } from './ui-labels';
import {
	LAST_STEP,
	REJECTED_SUBMISSION,
	UNAVAILABLE_SUBMISSION,
	walkTo
} from './answers';
import { openCalendar, selectDateOfBirth } from './date-picker';
import { checkoutButton } from './recommendation';

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
	// behind too, so waiting on it alone would type the next answer into the previous screen.
	const ready = async (step: string) => {
		await expect(page).toHaveURL(`/questionnaire/${step}`);
		await expect(page.getByRole('button', { name: UI.continue })).toBeEnabled();
	};
	const advance = () => page.getByRole('button', { name: UI.continue }).click();

	// One capture per control kind rather than per question. From feature 24d several of
	// RxScale's pages are one screen of ours, so the sex, the date of birth and both
	// measurements are photographed together on `about-you` instead of one at a time.
	await page.goto('/questionnaire');
	await ready('about-you');
	await shot('01-about-you-empty');

	await openCalendar(page);
	await expect(page.locator('[data-slot="popover-content"]')).toHaveCSS('opacity', '1');
	await shot('02-date-picker-open');
	await page.keyboard.press('Escape');

	await selectDateOfBirth(page);
	await page.getByRole('radio', { name: 'Weiblich', exact: true }).click();
	// A BMI between 27 and 30, which is what the weight-related conditions screen is behind.
	await page.locator('#q-heightCm').fill('178');
	await page.locator('#q-weightKg').fill('90');
	await shot('03-about-you-answered');
	await advance();

	// Solean's own screen, drawn from what has been answered by the time it appears.
	await expect(page).toHaveURL('/questionnaire/projection');
	await shot('04-projection');
	await advance();

	await ready('weight-related-conditions');
	await page.getByRole('checkbox', { name: 'Knie- oder Hüftarthrose', exact: true }).click();
	await shot('05-multiple-choice');
	await advance();

	await ready('your-details');
	await page.locator('#q-firstName').fill('Jonas');
	await page.locator('#q-lastName').fill('Weber');
	await page.locator('#q-email').fill('jonas@example.com');
	await shot('06-text-inputs');
	await advance();

	// Mounjaro rather than "Andere": only a medication RxScale tracks a dose for opens the
	// dose question and the side-effect screen after it.
	await ready('medication-history');
	await page.getByRole('radio', { name: 'Mounjaro', exact: true }).click();
	await page.getByRole('radio', { name: '2,5 mg', exact: true }).click();
	await page.locator('#q-pastMedicationDuration').fill('12');
	await page.locator('#q-pastMedicationLastDose').fill('August 2026');
	await shot('07-dependent-options');
	await advance();

	await ready('side-effects');
	await page.getByRole('radio', { name: 'Ja', exact: true }).click();
	await advance();

	await ready('side-effects');
	await page.locator('#q-sideEffectsDescription').fill('Leichte Übelkeit in der ersten Woche.');
	await shot('08-long-free-text');
	await advance();

	await ready('pregnancy');
	await page.getByRole('checkbox', { name: 'Keine der Genannten', exact: true }).click();
	await shot('09-conditional-screen');
	await advance();

	// The free text an "other" reveals, captured where the default walk actually passes one.
	await ready('medical-conditions');
	await page.getByRole('checkbox', { name: 'Andere', exact: true }).click();
	await page.locator('#q-diseases-other-text').fill('Sarkoidose');
	await shot('09b-other-free-text');
	await advance();

	await ready('health-history');
	await page.getByRole('checkbox', { name: 'Keine der Genannten', exact: true }).click();
	await page.getByRole('radio', { name: 'Nein', exact: true }).click();
	await advance();

	await ready('eating-disorders');
	await page.getByRole('radio', { name: 'Nein', exact: true }).click();
	await page.getByRole('checkbox', { name: 'Keine der Genannten', exact: true }).click();
	await advance();

	await expect(page).toHaveURL('/questionnaire/motivation');
	await shot('10-motivation');
	await advance();

	await ready('allergies');
	await page.getByRole('checkbox', { name: 'Keine der Genannten', exact: true }).click();
	await page.getByRole('radio', { name: 'Nein', exact: true }).click();
	await shot('11-allergies');
	await advance();

	await ready('disclaimers');
	await page.getByRole('checkbox', { name: 'Bestätigen', exact: true }).click();
	await page.getByRole('checkbox', { name: 'Ich verstehe', exact: true }).click();
	await shot('12-consent');
	await advance();

	await expect(page).toHaveURL('/questionnaire/complete');
	await expect(checkoutButton(page)).toBeEnabled();
	await shot('13-recommendation-choice');

	// The other purchase, which is a panel of its own and never on screen beside the prices
	// of the treatments.
	await page.getByRole('tab', { name: UI.modePrescription }).click();
	await shot('13b-recommendation-prescriptions');
	await page.getByRole('tab', { name: UI.modeTreatment }).click();
});

/**
 * The two ways a submission fails. Both are screens a person can actually land on, so they
 * are captured beside the rest rather than only asserted.
 */
test('capture the submission failures', async ({ page }) => {
	const shot = (name: string) => page.screenshot({ path: `screens/${name}.png`, fullPage: true });

	for (const [marker, name] of [
		[REJECTED_SUBMISSION, '15-submission-rejected'],
		[UNAVAILABLE_SUBMISSION, '16-submission-unavailable']
	] as const) {
		// The marker rides in on the e-mail rather than a free text: the screen it used to use
		// is closed for this walk, and the fixture matches the marker anywhere in the payload.
		//
		// Walked to the last screen and submitted by hand rather than through `COMPLETE_STEP`:
		// the submission is meant to fail here, so the visitor stays where they were and a walk
		// asserting it reached the end would fail with it.
		await walkTo(page, LAST_STEP, { email: `${marker}@example.com` });
		await page.getByRole('checkbox', { name: 'Bestätigen', exact: true }).click();
		await page.getByRole('checkbox', { name: 'Ich verstehe', exact: true }).click();
		await page.getByRole('button', { name: UI.continue }).click();
		await expect(page.getByRole('button', { name: UI.tryAgain })).toBeVisible();
		await shot(name);
	}
});
