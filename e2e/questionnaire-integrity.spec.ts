import { expect, test, type Page } from '@playwright/test';
import { UI } from './ui-labels';
import { stepIsInteractive, walkAndSubmit, walkTo } from './answers';
import { selectDateOfBirth } from './date-picker';

/**
 * What holds the walk together around the questions: answers that survive a reload and a
 * return visit, and a step that cannot be opened before the answers before it are in.
 */

const firstName = (page: Page) => page.locator('#q-firstName');
const surname = (page: Page) => page.locator('#q-lastName');

/**
 * What this app has written down about a visitor, wherever it could have written it.
 * Filtered to our own keys: SvelteKit keeps scroll positions in session storage.
 */
function storedKeys(page: Page): Promise<string[]> {
	return page.evaluate(() =>
		[...Object.keys(window.sessionStorage), ...Object.keys(window.localStorage)].filter((key) =>
			key.includes('solean')
		)
	);
}

/**
 * Answers are kept on the device from feature 24e so somebody can come back to an unfinished
 * questionnaire, and `localStorage` rather than a cookie is what keeps them off the wire: a
 * cookie is sent to the server on every request, and medical answers would then sit in the
 * host's access logs.
 */
test('the answers are kept on this device and nowhere else', async ({ page }) => {
	await walkTo(page, 'your-details');
	await firstName(page).fill('Jonas');
	await surname(page).fill('Weber');
	await page.locator('#q-email').fill('jonas@example.com');
	await page.getByRole('button', { name: UI.continue }).click();
	await expect(page).toHaveURL('/questionnaire/medication-history');

	expect(await storedKeys(page)).toEqual(['solean.questionnaire.session']);

	// Never a cookie. Two exist and both are meant to: the analytics decision and the locale.
	// What may not be in one is an answer, so the assertion is on the contents as well as on
	// which cookies are set at all.
	const cookies = await page.context().cookies();
	expect(cookies.map((cookie) => cookie.name).sort()).toEqual([
		'PARAGLIDE_LOCALE',
		'solean_analytics_consent'
	]);
	expect(cookies.some((cookie) => cookie.value.includes('Jonas'))).toBe(false);
});

test('a refresh keeps the answers and the place in the walk', async ({ page }) => {
	await walkTo(page, 'allergies');

	await page.reload();

	// Where the answers reach, not back at the beginning: the walk is derived from them.
	await expect(page).toHaveURL('/questionnaire/allergies');
	await stepIsInteractive(page);

	// Back to a screen the walk answered on the way through, with the answers still in it.
	await page.goto('/questionnaire/about-you');
	await stepIsInteractive(page);
	await expect(page.locator('#q-heightCm')).toHaveValue('180');
	await expect(page.locator('#q-weightKg')).toHaveValue('110');
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
	await page.getByRole('link', { name: UI.back, exact: true }).click();
	await expect(page).toHaveURL('/questionnaire/about-you');
	await stepIsInteractive(page);

	await expect(page.getByRole('radio', { name: 'Männlich', exact: true })).toBeChecked();
	await page.getByRole('radio', { name: 'Weiblich', exact: true }).click();
	await expect(page.getByRole('radio', { name: 'Weiblich', exact: true })).toBeChecked();
});

/** The eyebrow's wording, in the language the app is serving. */
function progressLabel(current: number, total: number): string {
	return `${UI.progressPrefix}${current} von ${total}`;
}

async function questionLabel(page: Page): Promise<string | null> {
	await stepIsInteractive(page);

	return (await page.locator(UI.progressEyebrow).first().textContent())?.trim() ?? null;
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

	await expect(page).toHaveURL('/questionnaire/your-details');
	expect(await questionLabel(page)).toBe(progressLabel(2, 10));
});

test('the completion screen reads the whole questionnaire as done', async ({ page }) => {
	await walkAndSubmit(page);

	await expect(page.getByRole('heading', { level: 1 })).toHaveText(UI.chooseTreatment);
	// Eight, which is the branch this walk actually opens: a male visitor with a BMI of 34 who
	// has never taken anything sees none of the four conditional screens. The denominator is
	// the walk, not a fixed length the definition does not have.
	await expect
		.poll(async () =>
			(await page.locator(UI.progressEyebrow).first().textContent())?.trim() ?? null
		)
		.toBe(progressLabel(8, 8));
});
