import { expect, test, type Page } from '@playwright/test';
import { UI } from './ui-labels';
import { walkTo } from './answers';
import { selectDateOfBirth } from './date-picker';

/**
 * The flow our own definition drives. From feature 24d the questions, their branching and
 * their validation messages are Solean's, not RxScale's: the model is a contract the answers
 * are mapped onto at submission, and nothing is fetched on the way in.
 */

async function stepIsInteractive(page: Page): Promise<void> {
	await expect(page.getByRole('button', { name: UI.continue })).toBeEnabled();
}

async function questionCount(page: Page): Promise<{ current: number; total: number }> {
	const label = await page
		.locator(`[aria-label^="${UI.progressPrefix}"]`)
		.first()
		.getAttribute('aria-label');
	// The label is localised; the two numbers in it are not, so they are what is read.
	const match = label?.match(/(\d+)\D+(\d+)/);
	if (!match) throw new Error(`No question count on this step: ${label}`);

	return { current: Number(match[1]), total: Number(match[2]) };
}

test('a required question refuses to advance, with our own message', async ({ page }) => {
	await page.goto('/questionnaire');
	await expect(page).toHaveURL('/questionnaire/about-you');
	await stepIsInteractive(page);

	await page.getByRole('button', { name: UI.continue }).click();

	await expect(page.getByText(UI.required).first()).toBeVisible();
	await expect(page).toHaveURL('/questionnaire/about-you');
});

test('a measurement outside the plausible range refuses too', async ({ page }) => {
	await page.goto('/questionnaire');
	await stepIsInteractive(page);

	await page.getByRole('radio', { name: 'Männlich', exact: true }).click();
	await selectDateOfBirth(page);
	await page.locator('#q-heightCm').fill('300');
	await page.locator('#q-weightKg').fill('110');
	await page.getByRole('button', { name: UI.continue }).click();

	await expect(page.getByText(UI.outOfRange).first()).toBeVisible();
	await expect(page).toHaveURL('/questionnaire/about-you');
});

test('branching opens the pregnancy screen for a female visitor', async ({ page }) => {
	// Several screens later than the sex question, because our definition asks the medication
	// history first. The walk is what proves the branch, not the adjacency.
	await walkTo(page, 'pregnancy', { gender: 'Weiblich' });

	await expect(page).toHaveURL('/questionnaire/pregnancy');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('schwanger');
});

test('the other branch never shows that screen', async ({ page }) => {
	await walkTo(page, 'medical-conditions', { gender: 'Männlich' });

	// A male visitor walks from the medication history straight to the conditions.
	await expect(page).toHaveURL('/questionnaire/medical-conditions');
});

test('an interlude does not count as a question', async ({ page }) => {
	// The motivation screen follows the eating-disorder screen, so that is the count it holds.
	await walkTo(page, 'eating-disorders');
	const before = await questionCount(page);

	// Answered and continued rather than navigated to. A `goto` is a fresh load, and a fresh
	// load has no answers at all, so it would bounce back to the first open question.
	await page.getByRole('radio', { name: 'Nein', exact: true }).click();
	await page.getByRole('checkbox', { name: 'Keine der Genannten', exact: true }).click();
	await page.getByRole('button', { name: UI.continue }).click();

	await expect(page).toHaveURL('/questionnaire/motivation');
	await expect(page.getByRole('heading', { level: 1 })).toContainText(UI.motivationHeadline);
	await stepIsInteractive(page);
	expect(await questionCount(page)).toEqual(before);

	await page.getByRole('button', { name: UI.continue }).click();

	await expect.poll(async () => (await questionCount(page)).current).toBe(before.current + 1);
	expect((await questionCount(page)).total).toBe(before.total);
});
