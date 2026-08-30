import { expect, test, type Page } from '@playwright/test';
import {
	answersKey,
	EVERY_ANSWER,
	seedAnswers,
	THROUGH_ALLERGY,
	THROUGH_DOB,
	THROUGH_NAME
} from './answers';

/**
 * What holds the walk together around the questions: answers that survive a reload, a model
 * change that discards them, and a step that cannot be opened before the answers before it
 * are in.
 */

async function ready(page: Page): Promise<void> {
	await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
}

const firstName = (page: Page) => page.getByLabel('Bitte gib Deinen Vornamen an.');
const surname = (page: Page) => page.getByLabel('Bitte gib Deinen Nachnamen an.');

test('answers survive a refresh', async ({ page }) => {
	await page.goto('/questionnaire/page27');
	await ready(page);
	await firstName(page).fill('Jonas');
	await surname(page).fill('Weber');

	await page.reload();
	await ready(page);

	await expect(firstName(page)).toHaveValue('Jonas');
	await expect(surname(page)).toHaveValue('Weber');
});

test('a new version of the model discards the answers to the old one', async ({ page }) => {
	await seedAnswers(page, { FirstName: 'Ghost', Surname: 'Answer' }, '0');

	await page.goto('/questionnaire/page27');
	await ready(page);

	await expect(firstName(page)).toHaveValue('');

	const stored = await page.evaluate(() =>
		Object.keys(window.sessionStorage).filter((key) => key.startsWith('solean:questionnaire:'))
	);
	expect(stored).not.toContain(answersKey('0'));
});

test('the answers are stored under the questionnaire and its version', async ({ page }) => {
	await page.goto('/questionnaire/page27');
	await ready(page);
	await firstName(page).fill('Jonas');

	await expect
		.poll(() => page.evaluate(() => Object.keys(window.sessionStorage)))
		.toContain(answersKey());
});

test('a seeded resume opens the step those answers reach', async ({ page }) => {
	await seedAnswers(page, THROUGH_NAME);

	await page.goto('/questionnaire/page27');
	await ready(page);

	await expect(firstName(page)).toHaveValue('Jonas');
});

test('a step the answers do not reach sends you to the one they do', async ({ page }) => {
	await page.goto('/questionnaire/page23');

	// The name question is the first thing this fixture requires, so that is as far as an
	// empty session reaches.
	await expect(page).toHaveURL('/questionnaire/page27');
	await ready(page);
	await expect(firstName(page)).toBeVisible();
});

test('the completion screen is not a place you can jump to', async ({ page }) => {
	await page.goto('/questionnaire/complete');

	await expect(page).toHaveURL('/questionnaire/page27');
});

test('a resumed session reaches the step its answers justify', async ({ page }) => {
	await seedAnswers(page, THROUGH_ALLERGY);

	await page.goto('/questionnaire/complete');

	// Everything up to the medication question is answered, and that is where it stops.
	await expect(page).toHaveURL('/questionnaire/page18');
});

test('a step already answered can be reopened and changed', async ({ page }) => {
	await seedAnswers(page, THROUGH_ALLERGY);

	await page.goto('/questionnaire/page3');
	await ready(page);

	await expect(page.getByRole('radio', { name: 'Männlich' })).toBeChecked();
	await page.getByRole('radio', { name: 'Weiblich' }).click();
	await expect(page.getByRole('radio', { name: 'Weiblich' })).toBeChecked();
});

async function questionLabel(page: Page): Promise<string | null> {
	await ready(page);

	return page.locator('[aria-label^="Question "]').first().getAttribute('aria-label');
}

test('the progress denominator follows the branch the answers open', async ({ page }) => {
	await seedAnswers(page, THROUGH_DOB);
	await page.goto('/questionnaire/page3');

	// Eight questions is what this fixture asks before any conditional page is opened.
	expect(await questionLabel(page)).toBe('Question 4 of 8');

	await page.getByRole('radio', { name: 'Weiblich' }).click();
	await page.getByRole('button', { name: 'Continue' }).click();

	// The pregnancy question is now one of them, and it is the visitor's to answer.
	await expect(page).toHaveURL('/questionnaire/page4');
	expect(await questionLabel(page)).toBe('Question 5 of 9');
});

test('the completion screen reads the whole questionnaire as done', async ({ page }) => {
	await seedAnswers(page, EVERY_ANSWER);

	await page.goto('/questionnaire/complete');

	await expect(page.getByRole('heading', { level: 1 })).toHaveText('That is every question');
	await expect
		.poll(() => page.locator('[aria-label^="Question "]').first().getAttribute('aria-label'))
		.toBe('Question 9 of 9');
});
