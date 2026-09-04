import { expect, test, type Page } from '@playwright/test';
import { UI } from './ui-labels';
import { walkTo } from './answers';

/**
 * Solean's own screens between the questions. From feature 24d the questions are ours too,
 * but the distinction still holds: an interlude asks nothing and so never moves the count.
 * The projection's numbers come from the model built in feature 8c applied to the weight the
 * visitor actually gave.
 */

/**
 * The projection sits where the export draws it, after the fourth question, so reaching it
 * means walking the three screens between it and the measurements it draws.
 */
async function answerWeight(page: Page, heightCm: string, weightKg: string): Promise<void> {
	await walkTo(page, 'projection', { heightCm, weightKg });
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

	const label = (await page.locator(UI.progressEyebrow).first().textContent())?.trim();

	// The number of the screen before it, held rather than advanced. The total is 9 rather
	// than the 8 an empty questionnaire shows, because a BMI of 28.4 opens the weight-related
	// conditions screen that a higher one does not.
	expect(label).toBe(`${UI.progressPrefix}3 von 9`);
});
