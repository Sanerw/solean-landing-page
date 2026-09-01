import { expect, test, type Page } from '@playwright/test';
import { UI } from './ui-labels';
import {
	MALFORMED_EMAIL,
	REFUSED_CHECKOUT,
	UNREACHABLE_CHECKOUT,
	stepIsInteractive,
	walkAndSubmit
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

test('an e-mail the shop refuses is dropped rather than allowed to end the order', async ({
	page
}) => {
	const calls = checkoutCalls(page);
	await atRecommendation(page, MALFORMED_EMAIL);

	await checkoutButton(page).click();

	await expect(page.getByRole('heading', { name: 'Fixture checkout' })).toBeVisible();

	// The cart that exists was built without the prefill. That is the whole rule: the e-mail is
	// a convenience, and Shopify asks for an address at checkout either way.
	await expect(page.getByTestId('prefill')).toHaveText('none');

	// One press, one order. The refusal carried no cart, so answering it left exactly one.
	expect(calls).toHaveLength(1);
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

	// Back the way anyone would come back. The checkout is another origin, so this is a fresh
	// load of the app, and a fresh load holds nothing: no answers, and no uid to prove the
	// anamnesis this browser filed a moment ago. It starts the questionnaire over.
	// The entry starts at the first question rather than the first unanswered one, which is
	// what an empty session should see.
	await page.goto('/questionnaire');
	await expect(page).toHaveURL('/questionnaire/page30');
	await stepIsInteractive(page);

	const stored = await page.evaluate(() =>
		Object.keys(window.sessionStorage).filter((key) => key.startsWith('solean:'))
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

test('a variant nobody recommended is refused, and no cart is made', async ({ page }) => {
	await atRecommendation(page);

	// The browser names its own merchandise, which is exactly the request the endpoint must
	// not honour: this variant is in the shop and is not in this anamnesis's recommendation.
	await page.route('**/api/checkout', async (route) => {
		const body = route.request().postDataJSON() as Record<string, unknown>;
		await route.continue({ postData: JSON.stringify({ ...body, variantId: '49703591706957' }) });
	});

	await checkoutButton(page).click();

	await expect(page.getByText(UI.notRecommended)).toBeVisible();
	await expect(page).toHaveURL('/questionnaire/complete');
});
