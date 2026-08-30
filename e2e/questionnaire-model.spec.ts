import { expect, test } from '@playwright/test';
import { FIXTURE_ELEMENTS, FIXTURE_IDENTIFIER, FIXTURE_PAGES } from './fixture';

test('the dev surface reports what the fetched model contains', async ({ page }) => {
	await page.goto('/dev/questionnaire');

	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Questionnaire model');
	await expect(page.getByText(FIXTURE_IDENTIFIER)).toBeVisible();
	await expect(page.getByText(String(FIXTURE_PAGES), { exact: true })).toBeVisible();
	await expect(page.getByText(String(FIXTURE_ELEMENTS), { exact: true })).toBeVisible();

	// One row per element in the document, not per question the engine parsed.
	await expect(page.getByRole('row')).toHaveCount(FIXTURE_ELEMENTS + 1);
	await expect(page.getByText('radiogroup × 3')).toBeVisible();

	// The engine silently discards a type it does not know, so the surface has to say so.
	await expect(page.getByText('survey-core dropped 1 element')).toBeVisible();
	await expect(page.getByRole('cell', { name: 'os-date-picker' })).toBeVisible();
});

test('the model is fetched once per entry to the flow', async ({ page }) => {
	const modelRequests: string[] = [];
	page.on('request', (request) => {
		if (request.url().includes('/anamnesis/')) modelRequests.push(request.url());
	});

	await page.goto('/');
	await page.locator('a[href="/questionnaire"]').first().click();
	await expect(page).toHaveURL('/questionnaire/about-you');

	// A second step, so the assertion is about the layout load and not about a single page.
	await page.getByRole('radio', { name: 'Male', exact: true }).click();
	await page.getByLabel('Height').fill('178');
	await page.getByLabel('Weight').fill('96');
	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page).toHaveURL('/questionnaire/your-details');

	expect(modelRequests).toHaveLength(1);
});

test('the questionnaire refuses to open when the model cannot be fetched', async ({ page }) => {
	await page.goto('/');
	await page.route('**/anamnesis/**', (route) => route.abort());

	await page.locator('a[href="/questionnaire"]').first().click();

	await expect(page.getByRole('heading', { level: 1 })).toHaveText(
		'We cannot open the questionnaire'
	);
	await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
	// No fallback questionnaire behind the failure.
	await expect(page.getByRole('radio')).toHaveCount(0);
});
