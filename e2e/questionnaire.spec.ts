import { expect, test } from '@playwright/test';

/**
 * One representative path through the funnel. It is the smoke test because it needs the
 * whole stack to be alive: server render, hydration, the service-driven resume redirect,
 * schema validation, the atomic sessionStorage write, and real navigation between steps.
 */
test('the questionnaire resumes, validates, and advances', async ({ page }) => {
	await page.goto('/questionnaire');

	// The server cannot read sessionStorage, so the destination is resolved in the browser.
	await expect(page).toHaveURL('/questionnaire/about-you');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tell us about yourself');
	await expect(page.getByText('Question 1 of 8')).toBeVisible();

	// Continuing with nothing answered must not navigate and must say why.
	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page.getByText('Select an option to continue.')).toBeVisible();
	await expect(page).toHaveURL('/questionnaire/about-you');

	// exact: the default name match is a substring, and "Female" contains "Male".
	await page.getByRole('radio', { name: 'Male', exact: true }).click();
	await page.getByLabel('Height').fill('178');
	await page.getByLabel('Weight').fill('96');
	await page.getByRole('button', { name: 'Continue' }).click();

	await expect(page).toHaveURL('/questionnaire/your-details');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText("Let's save your progress");
	await expect(page.getByText('Question 2 of 8')).toBeVisible();
});
