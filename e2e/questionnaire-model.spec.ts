import { expect, test } from '@playwright/test';
import { FIXTURE_ELEMENTS, FIXTURE_IDENTIFIER, FIXTURE_PAGES } from './fixture';

test('the dev surface reports what the fetched model contains', async ({ page }) => {
	await page.goto('/dev/questionnaire');

	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Questionnaire model');
	await expect(page.getByText(FIXTURE_IDENTIFIER)).toBeVisible();
	await expect(page.getByText(new RegExp(`steps from ${FIXTURE_PAGES} pages`))).toBeVisible();

	// One row per element in the document, not per question the engine parsed.
	await expect(page.getByRole('row')).toHaveCount(FIXTURE_ELEMENTS + 1);
	await expect(page.getByText('radiogroup × 4')).toBeVisible();

	// RxScale's own widget type is registered, so the engine keeps it and its page instead of
	// dropping both while parsing.
	await expect(page.getByText(/survey-core dropped/)).toHaveCount(0);
	await expect(page.getByRole('cell', { name: 'os-date-picker', exact: true })).toBeVisible();
	await expect(page.getByText(/of \d+ questions have a renderer/)).toBeVisible();
});

test('the model is fetched once per entry to the flow', async ({ page }) => {
	const modelRequests: string[] = [];
	page.on('request', (request) => {
		if (request.url().includes('/anamnesis/')) modelRequests.push(request.url());
	});

	await page.goto('/');
	await page.locator('a[href="/questionnaire"]').first().click();

	// The entry resolves the first step from the model, so the id comes from the document.
	await expect(page).toHaveURL('/questionnaire/page30');

	// A second step, so the assertion is about the layout load and not about a single page.
	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page).toHaveURL('/questionnaire/page27');

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
