import { expect, test, type Page } from '@playwright/test';
import { UI } from './ui-labels';
import {
	REJECTED_SUBMISSION,
	UNAVAILABLE_SUBMISSION,
	stepIsInteractive,
	walkAndSubmit,
	walkTo
} from './answers';
import { checkoutButton, choosePlan } from './recommendation';

/**
 * The submission itself. The fixture server answers the three documented outcomes, and asks
 * for the two failures through a marker typed into an answer, so every request under test is
 * a real one rather than a stubbed route.
 *
 * The marker rides in the last question's free text rather than the e-mail, because a walk
 * cannot be rewound to an earlier answer without reloading, and reloading is now the same as
 * starting over.
 */

/** The screen whose Continue is the submission: the two consents, from feature 24d. */
const LAST_STEP = 'disclaimers';
const SIDE_EFFECTS = 'Leichte Übelkeit in der ersten Woche.';

function submissions(page: Page): string[] {
	const posts: string[] = [];
	page.on('request', (request) => {
		if (request.method() === 'POST' && request.url().includes('/submissions')) {
			posts.push(request.url());
		}
	});

	return posts;
}

/**
 * The last screen, open and unanswered, with the marker already in the e-mail.
 *
 * The marker used to ride in on a free text at the end of the walk. From feature 24d the last
 * screen is the two consents, which take no text, and `side-effects` is closed unless a
 * tracked medication was named. The fixture matches the marker anywhere in the payload, so
 * the address carries it instead and the consents are what the test presses.
 */
async function atLastStep(page: Page, marker?: string): Promise<void> {
	await walkTo(page, LAST_STEP, marker ? { email: `${marker}@example.com` } : {});
	await expect(page).toHaveURL(`/questionnaire/${LAST_STEP}`);
}

/** The two consents, which are what a Continue on the last screen now needs. */
async function acceptConsents(page: Page): Promise<void> {
	await page.getByRole('checkbox', { name: 'Bestätigen', exact: true }).click();
	await page.getByRole('checkbox', { name: 'Ich verstehe', exact: true }).click();
}

test('the last question sends the answers and lands on the recommendation', async ({ page }) => {
	const posts = submissions(page);
	await atLastStep(page);
	await acceptConsents(page);

	await page.getByRole('button', { name: UI.continue }).click();

	await expect(page).toHaveURL('/questionnaire/complete');
	expect(posts).toHaveLength(1);
	// The uid it answered with is what this screen exists on, and it is held in memory alone.
	await expect(page.getByRole('heading', { name: UI.chooseTreatment })).toBeVisible();
});

test('a rejected submission stays on the question and shows what the service said', async ({
	page
}) => {
	await atLastStep(page, REJECTED_SUBMISSION);
	await acceptConsents(page);

	await page.getByRole('button', { name: UI.continue }).click();

	await expect(page.getByText(UI.submissionRejected)).toBeVisible();
	// The fixture's own messages, in the documented list shape.
	await expect(page.getByText('dob must be a valid date')).toBeVisible();
	await expect(page).toHaveURL(`/questionnaire/${LAST_STEP}`);
});

test('an unavailable validator says nothing was saved, and the retry goes through', async ({
	page
}) => {
	const posts = submissions(page);
	await atLastStep(page, UNAVAILABLE_SUBMISSION);
	await acceptConsents(page);

	await page.getByRole('button', { name: UI.continue }).click();
	await expect(page.getByText(UI.submissionFailed)).toBeVisible();
	await expect(page.getByRole('button', { name: UI.tryAgain })).toBeEnabled();
	await expect(page).toHaveURL(`/questionnaire/${LAST_STEP}`);
	expect(posts).toHaveLength(1);

	// Pressing it again is the retry, and it reaches the service a second time.
	await page.getByRole('button', { name: UI.tryAgain }).click();
	await expect(page.getByText(UI.submissionFailed)).toBeVisible();
	expect(posts).toHaveLength(2);
});

test('one anamnesis per session, whatever the visitor does next', async ({ page }) => {
	const posts = submissions(page);
	await walkAndSubmit(page);
	await expect(page).toHaveURL('/questionnaire/complete');

	// Back is a link, so the session survives it, and the questionnaire is over: a doctor has
	// these answers and reopening a question would change nothing.
	await page.getByRole('link', { name: UI.home, exact: true }).click();
	await expect(page).toHaveURL('/');
	await page.getByRole('link', { name: UI.checkEligibility }).first().click();
	await expect(page).toHaveURL('/questionnaire/complete');

	expect(posts).toHaveLength(1);
});

test('a reload after the submission starts the questionnaire over', async ({ page }) => {
	const posts = submissions(page);
	await walkAndSubmit(page);
	await expect(page).toHaveURL('/questionnaire/complete');

	await page.reload();

	// The consequence of storing nothing, stated rather than discovered: the anamnesis is at
	// RxScale and a doctor will read it, but this browser no longer knows about it, so the
	// order screen is out of reach and walking again would file a second one.
	await expect(page).toHaveURL('/questionnaire/about-you');
	await stepIsInteractive(page);
	expect(posts).toHaveLength(1);
});

test('the recommendation presents what RxScale offers, prices included', async ({ page }) => {
	await walkAndSubmit(page);
	await expect(page).toHaveURL('/questionnaire/complete');

	// Both purchases are offered, and never on the same list: a prescription with no
	// medication costs a fraction of a treatment, and the two prices side by side would read
	// as a discount on one purchase rather than as two.
	await expect(page.getByRole('tab', { name: UI.modeTreatment })).toBeVisible();
	await expect(page.getByRole('tab', { name: UI.modePrescription })).toBeVisible();

	// Straight off the recommendation. Nothing on this screen is written down here any more.
	await expect(page.getByText('249.00 EUR')).toBeVisible();
	// The other purchase's price is not on screen beside it, which is the whole point of the
	// split, and the button names back what confirming would buy.
	await expect(page.getByText('49.90 EUR')).toBeHidden();
	await expect(
		page.getByRole('button', { name: `${UI.checkoutWith} Fixture Treatment` })
	).toBeEnabled();

	// RxScale names its own default, and it is the one that arrives selected.
	// The name is the plan, the dose and the price: a `<button role="radio">` is not named by
	// the label that wraps it, so this is what a screen reader actually announces.
	await expect(
		page.getByRole('radio', { name: 'Fixture Treatment 0.25 mg 249.00 EUR' })
	).toBeChecked();

	await page.getByRole('tab', { name: UI.modePrescription }).click();
	await expect(page.getByText('49.90 EUR')).toBeVisible();
	await expect(page.getByText('249.00 EUR')).toBeHidden();

	// Switching brings its own default: the treatment must not stay chosen while a list of
	// prescriptions is on screen, or Continue would confirm merchandise nobody can see.
	await expect(
		page.getByRole('radio', { name: 'Fixture Treatment 0.25 mg Digital-Rezept 49.90 EUR' })
	).toBeChecked();

	await page.getByRole('tab', { name: UI.modeTreatment }).click();

	// The same press that takes the choice is the one that orders it, and the handoff itself
	// is covered by its own spec.
	await expect(checkoutButton(page)).toBeEnabled();
});
