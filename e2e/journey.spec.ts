import { expect, test, type Page } from '@playwright/test';
import { UI } from './ui-labels';
import { selectDateOfBirth } from './date-picker';
import { orderPlan } from './recommendation';

/**
 * One walk, the way a person takes it: the landing page, the questionnaire, and out to the
 * shop. Every part of this has its own spec already, so what this one is for is the seams
 * between them, which no single-feature spec can see.
 *
 * Nothing is seeded. Storage arrives the way a visitor's does, by answering.
 */

const CONTINUE = { name: UI.continue } as const;

async function answer(page: Page, step: string, fill: () => Promise<void>): Promise<void> {
	await expect(page).toHaveURL(`/questionnaire/${step}`);
	await fill();
	await page.getByRole('button', CONTINUE).click();
}

async function passInterlude(page: Page, step: string): Promise<void> {
	await expect(page).toHaveURL(`/questionnaire/${step}`);
	await expect(page.getByRole('button', CONTINUE)).toBeEnabled();
	await page.getByRole('button', CONTINUE).click();
}

test('a visitor walks from the landing page to the shop', async ({ page }) => {
	await page.goto('/');

	// The seam the marketing side owns: a link out of `(marketing)` into `(questionnaire)`.
	await page.getByRole('link', { name: UI.checkEligibility }).first().click();

	// The entry replaces itself with the first step, so Back must never land on it again.
	await expect(page).toHaveURL('/questionnaire/about-you');
	await expect(page.getByRole('button', CONTINUE)).toBeEnabled();

	// A female visitor with a BMI of 28.4, which opens both of the conditional screens this
	// walk passes through.
	await answer(page, 'about-you', async () => {
		await page.getByRole('radio', { name: 'Weiblich', exact: true }).click();
		await selectDateOfBirth(page);
		await page.locator('#q-heightCm').fill('178');
		await page.locator('#q-weightKg').fill('90');
	});

	// The projection reads the weight from the screen just answered, which is the seam between
	// a question screen and a Solean interlude.
	await passInterlude(page, 'projection');

	await answer(page, 'weight-related-conditions', async () => {
		await page.getByRole('checkbox', { name: 'Knie- oder Hüftarthrose', exact: true }).click();
	});
	await answer(page, 'your-details', async () => {
		await page.locator('#q-firstName').fill('Jonas');
		await page.locator('#q-lastName').fill('Weber');
		await page.locator('#q-email').fill('walker@example.com');
	});
	await answer(page, 'medication-history', async () => {
		await page.getByRole('radio', { name: 'Mounjaro', exact: true }).click();
		await page.getByRole('radio', { name: '2,5 mg', exact: true }).click();
		await page.locator('#q-pastMedicationDuration').fill('12');
		await page.locator('#q-pastMedicationLastDose').fill('August 2026');
	});
	await answer(page, 'side-effects', async () => {
		await page.getByRole('radio', { name: 'Ja', exact: true }).click();
	});
	await answer(page, 'side-effects', async () => {
		await page.locator('#q-sideEffectsDescription').fill('Leichte Übelkeit in der ersten Woche.');
	});
	await answer(page, 'pregnancy', async () => {
		await page.getByRole('checkbox', { name: 'Keine der Genannten', exact: true }).click();
	});
	await answer(page, 'medical-conditions', async () => {
		await page.getByRole('checkbox', { name: 'Keine der Genannten', exact: true }).click();
	});
	await answer(page, 'health-history', async () => {
		await page.getByRole('checkbox', { name: 'Keine der Genannten', exact: true }).click();
		await page.getByRole('radio', { name: 'Nein', exact: true }).click();
	});
	await answer(page, 'eating-disorders', async () => {
		await page.getByRole('radio', { name: 'Nein', exact: true }).click();
		await page.getByRole('checkbox', { name: 'Keine der Genannten', exact: true }).click();
	});
	await passInterlude(page, 'motivation');
	await answer(page, 'allergies', async () => {
		await page.getByRole('checkbox', { name: 'Keine der Genannten', exact: true }).click();
		await page.getByRole('radio', { name: 'Nein', exact: true }).click();
	});
	await answer(page, 'disclaimers', async () => {
		await page.getByRole('checkbox', { name: 'Bestätigen', exact: true }).click();
		await page.getByRole('checkbox', { name: 'Ich verstehe', exact: true }).click();
	});

	// The submission happened on that last Continue, and the recommendation follows from it.
	await expect(page).toHaveURL('/questionnaire/complete');
	await expect(page.getByRole('heading', { name: UI.chooseTreatment })).toBeVisible();
	await expect(page.getByRole('tab', { name: UI.modeTreatment })).toBeVisible();

	// The plan RxScale pre-selected is taken as offered: what this walk is about is that the
	// questionnaire reaches the shop, not which plan was picked.
	await orderPlan(page);

	// The last seam, and the only one that leaves the app.
	await expect(page.getByRole('heading', { name: 'Fixture checkout' })).toBeVisible();
	await expect(page.getByTestId('prefill')).toHaveText('walker@example.com');
});

test('back from the recommendation leaves the questionnaire rather than breaking it', async ({
	page
}) => {
	await page.goto('/');
	await page.getByRole('link', { name: UI.checkEligibility }).first().click();
	await expect(page).toHaveURL('/questionnaire/about-you');

	// One screen in is enough: what is under test is where Back points, not the walk itself.
	await page.getByRole('radio', { name: 'Männlich', exact: true }).click();
	await selectDateOfBirth(page);
	await page.locator('#q-heightCm').fill('180');
	await page.locator('#q-weightKg').fill('110');
	await page.getByRole('button', CONTINUE).click();
	await expect(page).toHaveURL('/questionnaire/projection');

	// The browser's own Back, across the entry that replaced itself. It must not reappear.
	await page.goBack();
	await expect(page).toHaveURL('/questionnaire/about-you');
	await page.goBack();
	await expect(page).toHaveURL('/');
});
