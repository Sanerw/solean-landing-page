import { expect, test, type Page } from '@playwright/test';
import { anamnesisKey, EVERY_ANSWER, seedAnswers, WITH_EMAIL, writeAnswers } from './answers';
import { confirmPlan } from './recommendation';

/**
 * The submission itself. The fixture server answers the three documented outcomes, and asks
 * for the two failures through a marker typed into an answer, so every request under test is
 * a real one rather than a stubbed route.
 */

const LAST_STEP = '/questionnaire/page22';

function submissions(page: Page): string[] {
	const posts: string[] = [];
	page.on('request', (request) => {
		if (request.method() === 'POST' && request.url().includes('/submissions')) {
			posts.push(request.url());
		}
	});

	return posts;
}

async function atLastStep(page: Page, answers: Record<string, unknown>): Promise<void> {
	await seedAnswers(page, answers);
	await page.goto(LAST_STEP);
	await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
}

test('the last question sends the answers and lands on the recommendation', async ({ page }) => {
	const posts = submissions(page);
	await atLastStep(page, EVERY_ANSWER);

	await page.getByRole('button', { name: 'Continue' }).click();

	await expect(page).toHaveURL('/questionnaire/complete');
	expect(posts).toHaveLength(1);

	const uid = await page.evaluate((key) => window.sessionStorage.getItem(key), anamnesisKey());
	expect(uid).toMatch(/^anam-fixture-/);
});

test('a rejected submission stays on the question and shows what the service said', async ({
	page
}) => {
	await atLastStep(page, { ...EVERY_ANSWER, EMail: 'TRIGGER-400' });

	await page.getByRole('button', { name: 'Continue' }).click();

	await expect(page.getByText('Your answers were not accepted')).toBeVisible();
	// The fixture's own messages, in the documented list shape.
	await expect(page.getByText('dob must be a valid date')).toBeVisible();
	await expect(page).toHaveURL(LAST_STEP);

	const uid = await page.evaluate((key) => window.sessionStorage.getItem(key), anamnesisKey());
	expect(uid).toBeNull();
});

test('an unavailable validator says nothing was saved, and the retry goes through', async ({
	page
}) => {
	const posts = submissions(page);

	// Written into the open page rather than seeded per navigation, because this test goes on
	// to change the answer that carries the marker.
	await page.goto('/questionnaire/page30');
	await writeAnswers(page, { ...EVERY_ANSWER, EMail: 'TRIGGER-502' });
	await page.goto(LAST_STEP);
	await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();

	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page.getByText('We could not send your answers')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Try again' })).toBeEnabled();
	await expect(page).toHaveURL(LAST_STEP);
	expect(posts).toHaveLength(1);

	// Pressing it again is the retry, and it reaches the service a second time.
	await page.getByRole('button', { name: 'Try again' }).click();
	await expect(page.getByText('We could not send your answers')).toBeVisible();
	expect(posts).toHaveLength(2);

	// Take the marker back out, the way anyone would: at the question that holds it.
	await page.goto('/questionnaire/page30');
	await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
	await page.getByRole('textbox').fill('jonas@example.com');

	await page.goto(LAST_STEP);
	await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
	await page.getByRole('button', { name: 'Continue' }).click();

	await expect(page).toHaveURL('/questionnaire/complete');
	expect(posts).toHaveLength(3);
});

test('one anamnesis per session, whatever the visitor does next', async ({ page }) => {
	const posts = submissions(page);
	await atLastStep(page, EVERY_ANSWER);
	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page).toHaveURL('/questionnaire/complete');

	await page.reload();
	await expect(page).toHaveURL('/questionnaire/complete');

	// The questionnaire is over: a doctor has these answers and editing them changes nothing.
	await page.goto('/questionnaire/page3');
	await expect(page).toHaveURL('/questionnaire/complete');

	await page.goto('/questionnaire');
	await expect(page).toHaveURL('/questionnaire/complete');

	expect(posts).toHaveLength(1);
});

test('reaching the end is not the same as having sent it', async ({ page }) => {
	await seedAnswers(page, EVERY_ANSWER);

	await page.goto('/questionnaire/complete');

	// Every answer is in, but nothing has been submitted, so this lands where sending happens.
	await expect(page).toHaveURL(LAST_STEP);
});

test('the recommendation presents what RxScale offers, prices included', async ({ page }) => {
	await atLastStep(page, WITH_EMAIL);
	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page).toHaveURL('/questionnaire/complete');

	// Both purchases are offered, and never on the same list: a prescription with no
	// medication costs a fraction of a treatment, and the two prices side by side would read
	// as a discount on one purchase rather than as two.
	await expect(page.getByRole('tab', { name: 'Treatment' })).toBeVisible();
	await expect(page.getByRole('tab', { name: 'Prescription only' })).toBeVisible();

	// Straight off the recommendation. Nothing on this screen is written down here any more.
	await expect(page.getByText('249.00 EUR')).toBeVisible();
	// The other purchase's price is not on screen beside it, which is the whole point of the
	// split, and the button names back what confirming would buy.
	await expect(page.getByText('49.90 EUR')).toBeHidden();
	await expect(page.getByRole('button', { name: 'Continue with Fixture Treatment' })).toBeEnabled();

	// RxScale names its own default, and it is the one that arrives selected.
	// The name is the plan, the dose and the price: a `<button role="radio">` is not named by
	// the label that wraps it, so this is what a screen reader actually announces.
	await expect(
		page.getByRole('radio', { name: 'Fixture Treatment 0.25 mg 249.00 EUR' })
	).toBeChecked();

	await page.getByRole('tab', { name: 'Prescription only' }).click();
	await expect(page.getByText('49.90 EUR')).toBeVisible();
	await expect(page.getByText('249.00 EUR')).toBeHidden();

	// Switching brings its own default: the treatment must not stay chosen while a list of
	// prescriptions is on screen, or Continue would confirm merchandise nobody can see.
	await expect(
		page.getByRole('radio', { name: 'Fixture Treatment 0.25 mg Digital-Rezept 49.90 EUR' })
	).toBeChecked();

	await page.getByRole('tab', { name: 'Treatment' }).click();

	// Confirming the choice is what opens the order screen, and the handoff itself is covered
	// by its own spec.
	await confirmPlan(page);

	// The count comes from the plan, not from the artboard, which says eight whatever the
	// model asks.
	await expect(page.getByText('All 9 steps complete')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Go to checkout' })).toBeEnabled();
});
