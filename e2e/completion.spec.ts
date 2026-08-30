import { expect, test, type Page } from '@playwright/test';

const advance = (page: Page, label = 'Continue') =>
	page.getByRole('button', { name: label, exact: false }).click();

/** Answers every question up to, but not including, the treatment preference. */
async function answerThroughQuestionSeven(page: Page) {
	await page.goto('/questionnaire/about-you');
	await page.getByRole('radio', { name: 'Male', exact: true }).click();
	await page.getByLabel('Height').fill('178');
	await page.getByLabel('Weight').fill('96');
	await advance(page);

	await page.getByLabel('First name').fill('Jonas');
	await page.getByLabel('Last name').fill('Weber');
	await page.getByLabel('E-mail address').fill('jonas@example.com');
	await advance(page);

	await page.getByRole('checkbox', { name: 'None of these' }).click();
	await advance(page);

	await expect(page).toHaveURL('/questionnaire/your-projection');
	await advance(page);

	await page.getByRole('checkbox', { name: 'None of the above' }).click();
	await advance(page);

	await page.getByRole('checkbox', { name: 'None of the above' }).click();
	await page.getByRole('radio', { name: 'No', exact: true }).click();
	await advance(page);

	await expect(page).toHaveURL('/questionnaire/almost-there');
	await advance(page);

	await page.getByRole('radio', { name: 'No', exact: true }).click();
	await page.getByRole('checkbox', { name: 'None of the above' }).click();
	await advance(page);

	await page.getByRole('checkbox', { name: 'None of the above' }).click();
	await page.getByRole('radio', { name: 'No', exact: true }).click();
	await advance(page);

	await expect(page).toHaveURL('/questionnaire/treatment-preference');
}

const session = (page: Page) =>
	page.evaluate(() => JSON.parse(sessionStorage.getItem('solean.journey') ?? '{}'));

test('the funnel completes and carries the chosen treatment', async ({ page }) => {
	await answerThroughQuestionSeven(page);

	await expect(page.getByText('Question 8 of 8')).toBeVisible();
	// Before a choice the action stays neutral.
	await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeVisible();

	await page.getByRole('radio', { name: 'Wegovy', exact: true }).click();
	// The reference names the choice in the action; it must name the one actually selected.
	await expect(page.getByRole('button', { name: 'Continue with Wegovy' })).toBeVisible();
	await page.getByRole('button', { name: 'Continue with Wegovy' }).click();

	await expect(page).toHaveURL('/questionnaire/complete');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Congratulations, you did it!');
	// The schema owns the total; the completion screen must not state a second number.
	await expect(page.getByText('All 8 steps complete')).toBeVisible();

	const after = await session(page);
	expect(after.questionnaire.completed).toBe(true);
	expect(after.selectedTreatmentId).toBe('wegovy');
});

test('an invalid edit does not silently save, and the treatment can be changed', async ({
	page
}) => {
	await answerThroughQuestionSeven(page);
	await page.getByRole('radio', { name: 'Mounjaro', exact: true }).click();
	await page.getByRole('button', { name: 'Continue with Mounjaro' }).click();
	await expect(page).toHaveURL('/questionnaire/complete');
	expect((await session(page)).selectedTreatmentId).toBe('mounjaro');

	// Go back and unpick question 4. Continue must refuse, and nothing may be written: a
	// half-edited step that saved would leave the funnel reporting a completion it lost.
	await page.goto('/questionnaire/medical-conditions');
	await page.getByRole('checkbox', { name: 'None of the above' }).click();
	await advance(page);
	await expect(page).toHaveURL('/questionnaire/medical-conditions');
	await expect(page.getByText('Choose an option, or select "None of the above".')).toBeVisible();

	const blocked = await session(page);
	expect(blocked.questionnaire.completed).toBe(true);
	expect(blocked.questionnaire.answers.byQuestionId['medical-conditions']).toBeTruthy();

	// Changing the treatment rewrites the carried id in the same atomic save.
	await page.goto('/questionnaire/treatment-preference');
	await page.getByRole('radio', { name: 'Wegovy Pill', exact: true }).click();
	await page.getByRole('button', { name: 'Continue with Wegovy Pill' }).click();

	const after = await session(page);
	expect(after.selectedTreatmentId).toBe('wegovy-pill');
	expect(after.questionnaire.completed).toBe(true);
});
