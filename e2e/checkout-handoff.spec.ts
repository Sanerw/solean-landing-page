import { expect, test, type Page } from '@playwright/test';
import { UI } from './ui-labels';
import {
	MALFORMED_EMAIL,
	REFUSED_CHECKOUT,
	UNREACHABLE_CHECKOUT,
	stepIsInteractive,
	walkAndSubmit,
	walkTo
} from './answers';
import { FIXTURE_PRESCRIPTION_VARIANT_ID } from './fixture';
import { checkoutButton, choosePlan, type PlanChoice } from './recommendation';

/**
 * The handoff itself. The fixture stands in for the Shopify Storefront API and for the page a
 * checkout URL leads to, so the redirect under test is a real navigation to a real URL the app
 * was handed, rather than a stubbed route.
 */

/** Every request the browser makes to our own endpoint, in order. */
function checkoutCalls(page: Page): string[] {
	const calls: string[] = [];
	page.on('request', (request) => {
		if (request.url().includes('/api/checkout')) calls.push(request.url());
	});

	return calls;
}

/**
 * Through the whole questionnaire, the submission and the choice, to the screen the order is
 * placed on. Walked rather than seeded: nothing is stored, so this is the only way there.
 * `email` carries whichever failure the fixture should answer with.
 */
async function atRecommendation(
	page: Page,
	email?: string,
	choice: PlanChoice = {}
): Promise<void> {
	await walkAndSubmit(page, email ? { email } : {});
	await expect(page).toHaveURL('/questionnaire/complete');
	await choosePlan(page, choice);
}

test('the order is created by the press, and lands exactly where Shopify said', async ({
	page
}) => {
	const calls = checkoutCalls(page);
	await atRecommendation(page);

	await expect(checkoutButton(page)).toBeEnabled();

	// Arriving orders nothing. Every checkout is a cart at Shopify, so reaching the screen must
	// not create one.
	expect(calls).toHaveLength(0);

	/**
	 * Relayed rather than stubbed: the request goes to the real endpoint and its response is
	 * passed back untouched. Reading it in transit is the only way to hold the bytes, because
	 * the redirect it triggers discards the body before a listener can get to it.
	 */
	let issued: string | null = null;
	await page.route('**/api/checkout', async (route) => {
		const response = await route.fetch();
		const body = await response.json();
		issued = typeof body?.checkoutUrl === 'string' ? body.checkoutUrl : null;
		await route.fulfill({ response });
	});

	await checkoutButton(page).click();

	await expect(page.getByRole('heading', { name: 'Fixture checkout' })).toBeVisible();

	// Byte for byte: the URL is Shopify's, and nothing here appends to it or trims it.
	expect(issued).not.toBeNull();
	expect(page.url()).toBe(issued);
	expect(calls).toHaveLength(1);

	// An address the shop accepts is still sent, so the refusal path cannot pass by dropping
	// every prefill.
	await expect(page.getByTestId('prefill')).toHaveText('jonas@example.com');
});

test('a service that refuses the line says so, and stays where it is', async ({ page }) => {
	const calls = checkoutCalls(page);
	await atRecommendation(page, REFUSED_CHECKOUT);

	await checkoutButton(page).click();

	await expect(page.getByText(UI.refused)).toBeVisible();
	await expect(page).toHaveURL('/questionnaire/complete');
	await expect(page.getByRole('button', { name: UI.tryAgain })).toBeEnabled();
	expect(calls).toHaveLength(1);
});

test('a service that does not answer offers the retry, and stays where it is', async ({
	page
}) => {
	const calls = checkoutCalls(page);
	await atRecommendation(page, UNREACHABLE_CHECKOUT);

	await checkoutButton(page).click();

	await expect(page.getByText(UI.unavailable)).toBeVisible();
	await expect(page).toHaveURL('/questionnaire/complete');

	// The action is ready again, and pressing it reaches the service a second time.
	await page.getByRole('button', { name: UI.tryAgain }).click();
	await expect.poll(() => calls.length).toBe(2);
	await expect(page.getByText(UI.unavailable)).toBeVisible();
	await expect(page).toHaveURL('/questionnaire/complete');
});

test('a malformed e-mail never reaches the shop at all', async ({ page }) => {
	// This used to be a server rule with a browser proof: RxScale's model asked for the address
	// with no validators, so a mistyped one travelled as far as Shopify, which refused the
	// prefill, and the cart was built without it.
	//
	// From feature 24a the address is validated on the screen that asks for it, so the walk
	// stops there and the shop is never asked. The server still drops a prefill Shopify
	// refuses, and `cart.ts` keeps its own coverage of that; what changed is that a person can
	// no longer get there by mistyping.
	const calls = checkoutCalls(page);
	await walkTo(page, 'your-details');
	await page.locator('#q-firstName').fill('Jonas');
	await page.locator('#q-lastName').fill('Weber');
	await page.locator('#q-email').fill(MALFORMED_EMAIL);

	await page.getByRole('button', { name: UI.continue }).click();

	await expect(page.getByText(UI.invalidEmail)).toBeVisible();
	await expect(page).toHaveURL('/questionnaire/your-details');
	expect(calls).toHaveLength(0);
});

test('an answer set with no e-mail still reaches the checkout', async ({ page }) => {
	const calls = checkoutCalls(page);

	// The model does not require the address, so leaving it empty is a walk anybody can take.
	// Shopify collects one at checkout, so it is an order to be completed there and not a dead
	// end here.
	await atRecommendation(page, '');

	await checkoutButton(page).click();

	await expect(page.getByRole('heading', { name: 'Fixture checkout' })).toBeVisible();
	expect(calls).toHaveLength(1);
});

test('leaving takes everything with it', async ({ page }) => {
	await atRecommendation(page);

	await checkoutButton(page).click();
	await expect(page.getByRole('heading', { name: 'Fixture checkout' })).toBeVisible();

	// Back the way anyone would come back. Answers survive a reload from feature 24e, but not
	// this: the press that creates the cart erases them, because the questionnaire has done
	// what it was for and a completed medical questionnaire has no business waiting on a
	// shared computer. So the app starts over rather than resuming.
	await page.goto('/questionnaire');
	await expect(page).toHaveURL('/questionnaire/about-you');
	await stepIsInteractive(page);
	await expect(page.locator('#q-heightCm')).toHaveValue('');

	// Filtered to this app's own keys: SvelteKit keeps scroll positions in session storage and
	// those are the router's, not ours.
	const stored = await page.evaluate(() =>
		[...Object.keys(window.sessionStorage), ...Object.keys(window.localStorage)].filter((key) =>
			key.includes('solean')
		)
	);
	expect(stored).toEqual([]);
});

test('the plan the visitor picks is the plan the cart is built from', async ({ page }) => {
	let ordered: string | null = null;
	page.on('request', (request) => {
		if (!request.url().includes('/api/checkout')) return;
		const body = request.postDataJSON() as { variantId?: string } | null;
		ordered = body?.variantId ?? null;
	});

	// The prescription, not the pre-selected treatment: the choice has to survive the screen
	// it was made on, and this is the pair a person is most likely to get wrong money on.
	await atRecommendation(page, undefined, {
		mode: 'prescription',
		plan: /Digital-Rezept 49\.90 EUR/
	});

	await checkoutButton(page).click();

	await expect(page.getByRole('heading', { name: 'Fixture checkout' })).toBeVisible();
	expect(ordered).toBe(FIXTURE_PRESCRIPTION_VARIANT_ID);
});

test('the prescription card opens a second screen rather than a checkout', async ({ page }) => {
	await atRecommendation(page);

	// The card stands for the group, so confirming it buys nothing: no cart, no navigation.
	await page.getByRole('radio', { name: new RegExp(UI.prescriptionCard) }).click();

	let checkouts = 0;
	page.on('request', (request) => {
		if (request.url().includes('/api/checkout')) checkouts++;
	});

	await checkoutButton(page).click();

	await expect(page.getByRole('heading', { level: 1, name: UI.prescriptionHeadline })).toBeVisible();
	expect(checkouts).toBe(0);
	await expect(page).toHaveURL('/questionnaire/complete');

	// Back is a way out, and the treatment the first screen had chosen is still chosen.
	await page.getByRole('button', { name: UI.backToTreatments }).click();
	await expect(page.getByRole('heading', { level: 1, name: UI.chooseTreatment })).toBeVisible();
	await expect(page.getByRole('radio', { name: new RegExp(UI.prescriptionCard) })).toBeChecked();
});

/*
 * Removed on 2026-09-04 with the check it covered: `a variant nobody recommended is refused,
 * and no cart is made`. It routed the browser's request through a variant that is in the shop
 * and not in this anamnesis's recommendation, and asserted the endpoint refused it.
 *
 * `/api/checkout` no longer reads the recommendation, so it no longer refuses anything on that
 * ground and the assertion has nothing left to observe. The property the test protected is
 * gone by decision, not by accident: see `project-overview.md` and the note on `cartVariant`.
 * Restoring the check means restoring this test with it.
 */
