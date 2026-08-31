import { expect, test, type Page } from '@playwright/test';
import { walkTo } from './answers';

/**
 * The flow the model drives. Everything asserted here comes from the fixture questionnaire,
 * never from content this app owns: the questions, their branching and their error messages
 * are RxScale's.
 */

/**
 * A step needs the engine for validation, branching and navigation, so it is not interactive
 * until hydration. The Continue action is disabled until then, which makes it the honest
 * signal to wait on: an option clicked earlier is ignored, exactly as it would be for someone
 * on a slow connection.
 */
async function stepIsInteractive(page: Page): Promise<void> {
	await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
}

async function questionCount(page: Page): Promise<{ current: number; total: number }> {
	const label = await page.locator('[aria-label^="Question "]').first().getAttribute('aria-label');
	const match = label?.match(/Question (\d+) of (\d+)/);
	if (!match) throw new Error(`No question count on this step: ${label}`);

	return { current: Number(match[1]), total: Number(match[2]) };
}

test('a required question refuses to advance, with the message from the model', async ({
	page
}) => {
	await walkTo(page, 'page3');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText(
		'Welches biologische Geschlecht hast Du?'
	);

	await page.getByRole('button', { name: 'Continue' }).click();

	await expect(
		page.getByText('Der Arzt benötigt diese Angaben zur Erstellung Deines Rezeptes.')
	).toBeVisible();
	await expect(page).toHaveURL('/questionnaire/page3');
});

test('branching follows the visibleIf in the model', async ({ page }) => {
	await walkTo(page, 'page3');
	await page.getByRole('radio', { name: 'Weiblich' }).click();
	await page.getByRole('button', { name: 'Continue' }).click();

	// The pregnancy question is conditional on this answer.
	await expect(page).toHaveURL('/questionnaire/page4');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('schwanger');
});

test('the other branch skips the question it does not apply to', async ({ page }) => {
	await walkTo(page, 'page3');
	await page.getByRole('radio', { name: 'Männlich' }).click();
	await page.getByRole('button', { name: 'Continue' }).click();

	await expect(page).toHaveURL('/questionnaire/page2');
});

test('an interlude does not count as a question', async ({ page }) => {
	// The motivation screen follows the allergy question, so that is the count it holds.
	await walkTo(page, 'page16');
	// The count has to be read after hydration: the server renders the plan of an unanswered
	// questionnaire, because the answers reach the browser and nowhere else.
	const before = await questionCount(page);

	// Answered and continued rather than navigated to. A `goto` is a fresh load, and a fresh
	// load now has no answers at all, so it would bounce back to the first open question.
	await page.getByRole('checkbox', { name: 'Keine der Genannten' }).click();
	await page.getByRole('button', { name: 'Continue' }).click();

	await expect(page).toHaveURL('/questionnaire/motivation');
	await expect(page.getByRole('heading', { level: 1 })).toContainText(
		'This is where life starts to change.'
	);
	await stepIsInteractive(page);
	expect(await questionCount(page)).toEqual(before);

	await page.getByRole('button', { name: 'Continue' }).click();

	await expect
		.poll(async () => (await questionCount(page)).current)
		.toBe(before.current + 1);
	expect((await questionCount(page)).total).toBe(before.total);
});
