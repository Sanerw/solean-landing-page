import { expect, test, type Page } from '@playwright/test';
import { seedAnswers, THROUGH_GENDER } from './answers';

/**
 * Solean's own screens between the model's questions. Unlike the questions, this content is
 * ours, so what is asserted here is our copy and our arithmetic. The projection's numbers
 * come from the model built in feature 8c applied to the weight the user actually gave.
 */

async function answerWeight(page: Page, sizeCm: string, weightKg: string): Promise<void> {
	// The weight question is only reachable once the questions before it are answered.
	await seedAnswers(page, THROUGH_GENDER);
	await page.goto('/questionnaire/page2');
	await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
	await page.getByLabel('Größe (cm)').fill(sizeCm);
	await page.getByLabel('Gewicht (kg)').fill(weightKg);
	await page.getByRole('button', { name: 'Continue' }).click();
}

test('the projection is built from the weight the user gave', async ({ page }) => {
	await answerWeight(page, '178', '90');

	await expect(page).toHaveURL('/questionnaire/projection');

	// 90 kg through the 8c model, not the 96 kg the artboard was drawn at.
	await expect(page.getByLabel('Projected weight')).toContainText('77 kg');

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
		.locator('[aria-label^="Question "]')
		.first()
		.getAttribute('aria-label');

	// The weight question's own number, held rather than advanced. The total is 9 rather than
	// the 8 the walk started with because this BMI is what makes the conditions page visible.
	expect(label).toBe('Question 5 of 9');
});
