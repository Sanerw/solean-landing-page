import { expect, test, type Page } from '@playwright/test';
import { UI } from './ui-labels';
import { walkTo } from './answers';
import { selectDateOfBirth } from './date-picker';

/**
 * Solean's own screens between the questions. From feature 24d the questions are ours too,
 * but the distinction still holds: an interlude asks nothing and so never moves the count.
 * The projection's numbers come from the model built in feature 8c applied to the weight the
 * visitor actually gave.
 */

/**
 * The weight shares a screen with the sex and the date of birth from feature 24d, so all four
 * have to be answered before the projection can be reached.
 */
async function answerWeight(page: Page, sizeCm: string, weightKg: string): Promise<void> {
	await walkTo(page, 'about-you');
	await page.getByRole('radio', { name: 'Männlich', exact: true }).click();
	await selectDateOfBirth(page);
	await page.locator('#q-heightCm').fill(sizeCm);
	await page.locator('#q-weightKg').fill(weightKg);
	await page.getByRole('button', { name: UI.continue }).click();
}

test('the projection is built from the weight the user gave', async ({ page }) => {
	await answerWeight(page, '178', '90');

	await expect(page).toHaveURL('/questionnaire/projection');

	// 90 kg through the 8c model, not the 96 kg the artboard was drawn at.
	await expect(page.getByLabel(UI.projectedWeight)).toContainText('77 kg');

	const row = (milestone: string) => page.getByRole('row').filter({ hasText: milestone });
	await expect(row('Now')).toContainText('90 kg');
	await expect(row('3 months')).toContainText('83 kg');
	await expect(row('6 months')).toContainText('77 kg');
	await expect(row('12 months')).toContainText('73 kg');
});

test('the projection does not count as a question', async ({ page }) => {
	await answerWeight(page, '178', '90');
	await expect(page).toHaveURL('/questionnaire/projection');

	const label = await page
		.locator(`[aria-label^="${UI.progressPrefix}"]`)
		.first()
		.getAttribute('aria-label');

	// The first screen's own number, held rather than advanced. The total is 9 rather than the
	// 8 an empty questionnaire shows, because a BMI of 28.4 opens the weight-related
	// conditions screen that a higher one does not.
	expect(label).toBe(`${UI.progressPrefix}1 von 9`);
});
