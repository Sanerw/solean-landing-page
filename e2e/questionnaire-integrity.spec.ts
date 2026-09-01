import { expect, test, type Page } from '@playwright/test';
import { UI } from './ui-labels';
import { stepIsInteractive, walkAndSubmit, walkTo } from './answers';

/**
 * What holds the walk together around the questions: answers that live for exactly as long
 * as the page asking for them, and a step that cannot be opened before the answers before it
 * are in.
 */

const firstName = (page: Page) => page.getByLabel('Bitte gib Deinen Vornamen an.');
const surname = (page: Page) => page.getByLabel('Bitte gib Deinen Nachnamen an.');

/** Every key this app could be writing. The assertion is that it writes none of them. */
function soleanKeys(page: Page): Promise<string[]> {
	return page.evaluate(() =>
		Object.keys(window.sessionStorage).filter((key) => key.startsWith('solean:'))
	);
}

test('nothing a visitor answers is written down', async ({ page }) => {
	await walkTo(page, 'page27');
	await firstName(page).fill('Jonas');
	await surname(page).fill('Weber');

	// Answered, and still nothing stored. These are real medical answers, and the guarantee is
	// that they exist in the page and in the submission, nowhere else.
	expect(await soleanKeys(page)).toEqual([]);

	await page.getByRole('button', { name: UI.continue }).click();
	await expect(page).toHaveURL('/questionnaire/page26');
	expect(await soleanKeys(page)).toEqual([]);
});

test('a refresh starts the questionnaire over', async ({ page }) => {
	await walkTo(page, 'page16');

	await page.reload();

	// Back to the beginning with the answers gone. The first question asks for an e-mail and
	// requires nothing, and a fresh load still starts there: skipping it would look like the
	// questionnaire had dropped a question.
	await expect(page).toHaveURL('/questionnaire/page30');
	await stepIsInteractive(page);
	// The walk answered this one on the way through, and the answer is not here any more.
	await expect(page.getByRole('textbox')).toHaveValue('');
});

test('a step the answers do not reach sends you to the one they do', async ({ page }) => {
	await page.goto('/questionnaire/page23');

	// An empty session reaches exactly one step: the first.
	await expect(page).toHaveURL('/questionnaire/page30');
	await stepIsInteractive(page);
});

test('the completion screen is not a place you can jump to', async ({ page }) => {
	await page.goto('/questionnaire/complete');

	await expect(page).toHaveURL('/questionnaire/page30');
});

test('a step already answered can be reopened and changed', async ({ page }) => {
	await walkTo(page, 'page2');

	// Back, the way a visitor goes back: a link, so the session the answers live in survives.
	await page.getByRole('link', { name: UI.back, exact: true }).click();
	await expect(page).toHaveURL('/questionnaire/page3');
	await stepIsInteractive(page);

	await expect(page.getByRole('radio', { name: 'Männlich' })).toBeChecked();
	await page.getByRole('radio', { name: 'Weiblich' }).click();
	await expect(page.getByRole('radio', { name: 'Weiblich' })).toBeChecked();
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
	await walkTo(page, 'page3');

	// Eight questions is what this fixture asks before any conditional page is opened.
	expect(await questionLabel(page)).toBe(progressLabel(4, 8));

	await page.getByRole('radio', { name: 'Weiblich' }).click();
	await page.getByRole('button', { name: UI.continue }).click();

	// The pregnancy question is now one of them, and it is the visitor's to answer.
	await expect(page).toHaveURL('/questionnaire/page4');
	expect(await questionLabel(page)).toBe(progressLabel(5, 9));
});

test('the completion screen reads the whole questionnaire as done', async ({ page }) => {
	await walkAndSubmit(page);

	await expect(page.getByRole('heading', { level: 1 })).toHaveText(UI.chooseTreatment);
	// Ten, because the walk answers "Andere" to the medication question, and that opens the
	// side-effects pages behind it. The denominator is the branch actually walked, not a fixed
	// length the model does not have.
	await expect
		.poll(() => page.locator(`[aria-label^="${UI.progressPrefix}"]`).first().getAttribute('aria-label'))
		.toBe(progressLabel(10, 10));
});
