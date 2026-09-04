import { expect, test, type Page } from '@playwright/test';
import { UI } from './ui-labels';
import { stepIsInteractive, walkAndSubmit, walkTo } from './answers';
import { selectDateOfBirth } from './date-picker';

/**
 * What holds the walk together around the questions: answers that live for exactly as long
 * as the page asking for them, and a step that cannot be opened before the answers before it
 * are in.
 */

const firstName = (page: Page) => page.locator('#q-firstName');
const surname = (page: Page) => page.locator('#q-lastName');

/** Every key this app could be writing. The assertion is that it writes none of them. */
function soleanKeys(page: Page): Promise<string[]> {
	return page.evaluate(() =>
		Object.keys(window.sessionStorage).filter((key) => key.startsWith('solean:'))
	);
}

test('nothing a visitor answers is written down', async ({ page }) => {
	await walkTo(page, 'your-details');
	await firstName(page).fill('Jonas');
	await surname(page).fill('Weber');
	// Required from feature 24a, unlike RxScale's own e-mail question, so the screen does not
	// advance without it.
	await page.locator('#q-email').fill('jonas@example.com');

	// Answered, and still nothing stored. These are real medical answers, and the guarantee is
	// that they exist in the page and in the submission, nowhere else.
	expect(await soleanKeys(page)).toEqual([]);

	await page.getByRole('button', { name: UI.continue }).click();
	await expect(page).toHaveURL('/questionnaire/medication-history');
	expect(await soleanKeys(page)).toEqual([]);
});

test('a refresh starts the questionnaire over', async ({ page }) => {
	await walkTo(page, 'allergies');

	await page.reload();

	// Back to the beginning with the answers gone.
	await expect(page).toHaveURL('/questionnaire/about-you');
	await stepIsInteractive(page);
	// The walk answered these on the way through, and they are not here any more.
	await expect(page.locator('#q-heightCm')).toHaveValue('');
	await expect(page.locator('#q-weightKg')).toHaveValue('');
});

test('a step the answers do not reach sends you to the one they do', async ({ page }) => {
	await page.goto('/questionnaire/side-effects');

	// An empty session reaches exactly one step: the first.
	await expect(page).toHaveURL('/questionnaire/about-you');
	await stepIsInteractive(page);
});

test('the completion screen is not a place you can jump to', async ({ page }) => {
	await page.goto('/questionnaire/complete');

	await expect(page).toHaveURL('/questionnaire/about-you');
});

test('a step already answered can be reopened and changed', async ({ page }) => {
	// One screen past the one being reopened, so there is something to come back from.
	await walkTo(page, 'your-details');

	// Back, the way a visitor goes back: a link, so the session the answers live in survives.
	// The projection sits between the two screens, so this takes two presses.
	await page.getByRole('link', { name: UI.back, exact: true }).click();
	await expect(page).toHaveURL('/questionnaire/projection');
	await page.getByRole('link', { name: UI.back, exact: true }).click();
	await expect(page).toHaveURL('/questionnaire/about-you');
	await stepIsInteractive(page);

	await expect(page.getByRole('radio', { name: 'Männlich', exact: true })).toBeChecked();
	await page.getByRole('radio', { name: 'Weiblich', exact: true }).click();
	await expect(page.getByRole('radio', { name: 'Weiblich', exact: true })).toBeChecked();
});

/** The progress bar's accessible name, in the language the app is serving. */
function progressLabel(current: number, total: number): string {
	return `${UI.progressPrefix}${current} von ${total}`;
}

async function questionLabel(page: Page): Promise<string | null> {
	await stepIsInteractive(page);

	return page.locator(`[aria-label^="${UI.progressPrefix}"]`).first().getAttribute('aria-label');
}

test('the progress denominator follows the branch the answers open', async ({ page }) => {
	await walkTo(page, 'about-you');

	// Eight screens is what the definition asks before any conditional one is opened, and
	// `about-you` is the first of them.
	expect(await questionLabel(page)).toBe(progressLabel(1, 8));

	// A BMI inside the 27 to 30 band, which opens the weight-related conditions screen, and a
	// female visitor, which opens the pregnancy screen. Two more for the visitor to answer.
	await page.getByRole('radio', { name: 'Weiblich', exact: true }).click();
	await selectDateOfBirth(page);
	await page.locator('#q-heightCm').fill('178');
	await page.locator('#q-weightKg').fill('90');
	await page.getByRole('button', { name: UI.continue }).click();

	await expect(page).toHaveURL('/questionnaire/projection');
	expect(await questionLabel(page)).toBe(progressLabel(1, 10));
});

test('the completion screen reads the whole questionnaire as done', async ({ page }) => {
	await walkAndSubmit(page);

	await expect(page.getByRole('heading', { level: 1 })).toHaveText(UI.chooseTreatment);
	// Eight, which is the branch this walk actually opens: a male visitor with a BMI of 34 who
	// has never taken anything sees none of the four conditional screens. The denominator is
	// the walk, not a fixed length the definition does not have.
	await expect
		.poll(() => page.locator(`[aria-label^="${UI.progressPrefix}"]`).first().getAttribute('aria-label'))
		.toBe(progressLabel(8, 8));
});
