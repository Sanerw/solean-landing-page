import { expect, test, type Page } from '@playwright/test';

/**
 * One walk, the way a person takes it: the landing page, the questionnaire, and out to the
 * shop. Every part of this has its own spec already, so what this one is for is the seams
 * between them, which no single-feature spec can see.
 *
 * Nothing is seeded. Storage arrives the way a visitor's does, by answering.
 */

const CONTINUE = { name: 'Continue' } as const;

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
	await page.getByRole('link', { name: 'Check your eligibility' }).first().click();

	// The entry replaces itself with the first step, so Back must never land on it again.
	await expect(page).toHaveURL('/questionnaire/page30');
	await expect(page.getByRole('button', CONTINUE)).toBeEnabled();

	await answer(page, 'page30', async () => {
		await page.getByRole('textbox').fill('walker@example.com');
	});
	await answer(page, 'page27', async () => {
		await page.getByLabel('Bitte gib Deinen Vornamen an.').fill('Jonas');
		await page.getByLabel('Bitte gib Deinen Nachnamen an.').fill('Weber');
	});
	await answer(page, 'page26', async () => {
		await page.getByRole('textbox').fill('1990-05-14');
	});
	await answer(page, 'page3', async () => {
		await page.getByRole('radio', { name: 'Weiblich' }).click();
	});
	await answer(page, 'page4', async () => {
		await page.getByRole('radio', { name: 'Nein' }).click();
	});
	await answer(page, 'page2', async () => {
		await page.getByLabel('Größe (cm)').fill('178');
		await page.getByLabel('Gewicht (kg)').fill('90');
	});

	// The projection reads the weight two steps back, which is the seam between a survey page
	// and a Solean interlude.
	await passInterlude(page, 'projection');

	await answer(page, 'page1', async () => {
		await page.getByRole('checkbox', { name: 'Knie- oder Hüftarthrose' }).click();
	});
	await answer(page, 'page16', async () => {
		await page.getByRole('checkbox', { name: 'Keine der Genannten' }).click();
	});
	await passInterlude(page, 'motivation');
	await answer(page, 'page18', async () => {
		await page.getByRole('radio', { name: 'Andere' }).click();
		await page.getByRole('textbox').fill('Metformin 500mg');
	});
	await answer(page, 'page22', async () => {
		await page.getByRole('radio', { name: 'Ja' }).click();
	});
	await answer(page, 'page23', async () => {
		await page.getByRole('textbox').fill('Leichte Übelkeit in der ersten Woche.');
	});

	// The submission happened on that last Continue, and the recommendation follows from it.
	await expect(page).toHaveURL('/questionnaire/complete');
	await expect(page.getByRole('heading', { name: 'Congratulations, you did it!' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Your treatment.' })).toBeVisible();

	await page.getByRole('button', { name: 'Place your order' }).click();

	// The last seam, and the only one that leaves the app.
	await expect(page.getByRole('heading', { name: 'Fixture checkout' })).toBeVisible();
	await expect(page.getByTestId('prefill')).toHaveText('walker@example.com');
});

test('back from the recommendation leaves the questionnaire rather than breaking it', async ({
	page
}) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'Check your eligibility' }).first().click();
	await expect(page).toHaveURL('/questionnaire/page30');

	// One step in is enough: what is under test is where the shell's Back points once the
	// answers are gone, not the walk itself.
	await page.getByRole('textbox').fill('walker@example.com');
	await page.getByRole('button', CONTINUE).click();
	await expect(page).toHaveURL('/questionnaire/page27');

	// The browser's own Back, across the entry that replaced itself. It must not reappear.
	await page.goBack();
	await expect(page).toHaveURL('/questionnaire/page30');
	await page.goBack();
	await expect(page).toHaveURL('/');
});
