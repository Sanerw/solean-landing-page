import { expect, test } from '@playwright/test';

/** Answers question 1 with a known weight, so the projection has real input to work from. */
async function answerAboutYou(page: import('@playwright/test').Page, weightKg: string) {
	await page.goto('/questionnaire/about-you');
	await page.getByRole('radio', { name: 'Male', exact: true }).click();
	await page.getByLabel('Height').fill('178');
	await page.getByLabel('Weight').fill(weightKg);
	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page).toHaveURL('/questionnaire/your-details');
}

async function answerYourDetails(page: import('@playwright/test').Page) {
	await page.getByLabel('First name').fill('Jonas');
	await page.getByLabel('Last name').fill('Weber');
	await page.getByLabel('E-mail address').fill('jonas@example.com');
	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page).toHaveURL('/questionnaire/pregnancy');
}

async function answerPregnancy(page: import('@playwright/test').Page) {
	await page.getByRole('checkbox', { name: 'None of these' }).click();
	await page.getByRole('button', { name: 'Continue' }).click();
}

test('the projection is built from the weight the patient entered', async ({ page }) => {
	await answerAboutYou(page, '96');
	await answerYourDetails(page);
	await answerPregnancy(page);

	await expect(page).toHaveURL('/questionnaire/your-projection');

	// The headline is an <output>, so the status role addresses it without matching the
	// same figure where it also appears in the chart pills and the data table.
	const projected = page.getByRole('status', { name: 'Projected weight' });

	await expect(projected).toHaveText('82 kg');
	await expect(page.getByText('in 6 months with Solean')).toBeVisible();

	await page.getByRole('tab', { name: '12 months' }).click();
	await expect(projected).toHaveText('78 kg');
	await expect(page.getByText('in 12 months with Solean')).toBeVisible();

	await page.getByRole('tab', { name: '3 months' }).click();
	await expect(projected).toHaveText('88 kg');

	// An interstitial carries its own eyebrow, not a question number, so the count lives on
	// the progress bar. It must still read the preceding question: an interstitial never
	// advances it.
	await expect(page.getByRole('progressbar')).toHaveAccessibleName('Question 3 of 8');
	await expect(page.getByText('Your projection', { exact: true })).toBeVisible();

	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page).toHaveURL('/questionnaire/medical-conditions');
	await expect(page.getByText('Question 4 of 8')).toBeVisible();
	await expect(page.getByRole('progressbar')).toHaveAccessibleName('Question 4 of 8');
});

test('a weight stored in another unit falls back instead of charting a wrong number', async ({
	page
}) => {
	await answerAboutYou(page, '96');
	await answerYourDetails(page);
	await answerPregnancy(page);
	await expect(page).toHaveURL('/questionnaire/your-projection');

	// Clearing storage entirely cannot reach this screen, because the guard sends an
	// unanswered session back to question 1. A stored answer in a unit the model does not
	// handle still validates, so the step stays reachable and the fallback is what shows.
	await page.evaluate(() => {
		const raw = sessionStorage.getItem('solean.journey');
		if (!raw) throw new Error('expected a stored journey session');
		const session = JSON.parse(raw);
		session.questionnaire.answers.byQuestionId['about-you'].weight.unit = 'lb';
		sessionStorage.setItem('solean.journey', JSON.stringify(session));
	});
	await page.reload();

	await expect(page).toHaveURL('/questionnaire/your-projection');
	await expect(page.getByText('We need your weight to show this')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Back to question 1' })).toBeVisible();
});
