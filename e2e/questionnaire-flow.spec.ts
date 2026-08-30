import { expect, test, type Page } from '@playwright/test';

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
	await page.goto('/questionnaire/page3');
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
	await page.goto('/questionnaire/page3');
	await stepIsInteractive(page);
	await page.getByRole('radio', { name: 'Weiblich' }).click();
	await page.getByRole('button', { name: 'Continue' }).click();

	// The pregnancy question is conditional on this answer.
	await expect(page).toHaveURL('/questionnaire/page4');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('schwanger');
});

test('the other branch skips the question it does not apply to', async ({ page }) => {
	await page.goto('/questionnaire/page3');
	await stepIsInteractive(page);
	await page.getByRole('radio', { name: 'Männlich' }).click();
	await page.getByRole('button', { name: 'Continue' }).click();

	await expect(page).toHaveURL('/questionnaire/page2');
});

test('an interlude does not count as a question', async ({ page }) => {
	await page.goto('/questionnaire/page2');
	const before = await questionCount(page);

	await page.goto('/questionnaire/motivation');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Halfway done');
	expect(await questionCount(page)).toEqual(before);

	await page.getByRole('button', { name: 'Continue' }).click();

	await expect
		.poll(async () => (await questionCount(page)).current)
		.toBe(before.current + 1);
	expect((await questionCount(page)).total).toBe(before.total);
});
