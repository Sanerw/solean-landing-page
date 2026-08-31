import { expect, test, type Page } from '@playwright/test';
import {
	anamnesisKey,
	answersKey,
	EVERY_ANSWER,
	MALFORMED_EMAIL,
	REFUSED_CHECKOUT,
	seedAnswers,
	UNREACHABLE_CHECKOUT,
	WITH_EMAIL,
	writeAnswers
} from './answers';
import { FIXTURE_PRESCRIPTION_VARIANT_ID } from './fixture';
import { confirmPlan } from './recommendation';

/**
 * The handoff itself. The fixture stands in for the Shopify Storefront API and for the page a
 * checkout URL leads to, so the redirect under test is a real navigation to a real URL the app
 * was handed, rather than a stubbed route.
 */

const LAST_STEP = '/questionnaire/page22';

/** Every request the browser makes to our own endpoint, in order. */
function checkoutCalls(page: Page): string[] {
	const calls: string[] = [];
	page.on('request', (request) => {
		if (request.url().includes('/api/checkout')) calls.push(request.url());
	});

	return calls;
}

/** Through the submission and the choice, to the screen the order is placed on. */
async function atRecommendation(
	page: Page,
	answers: Record<string, unknown>,
	plan?: string | RegExp
): Promise<void> {
	await seedAnswers(page, answers);
	await page.goto(LAST_STEP);
	await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page).toHaveURL('/questionnaire/complete');
	await confirmPlan(page, plan);
}

test('the order is created by the press, and lands exactly where Shopify said', async ({
	page
}) => {
	const calls = checkoutCalls(page);
	await atRecommendation(page, WITH_EMAIL);

	const order = page.getByRole('button', { name: 'Go to checkout' });
	await expect(order).toBeEnabled();

	// Arriving orders nothing. Every checkout is a cart at Shopify, so reaching the screen,
	// reloading it, or coming back to it must not create one. The reload also proves the
	// choice was kept: a lost one would put the plans back on the screen instead.
	expect(calls).toHaveLength(0);
	await page.reload();
	await expect(page.getByRole('button', { name: 'Go to checkout' })).toBeEnabled();
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

	await page.getByRole('button', { name: 'Go to checkout' }).click();

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

	await page.getByRole('button', { name: 'Go to checkout' }).click();

	await expect(page.getByText('Your order was not accepted')).toBeVisible();
	await expect(page).toHaveURL('/questionnaire/complete');
	await expect(page.getByRole('button', { name: 'Try again' })).toBeEnabled();
	expect(calls).toHaveLength(1);
});

test('a service that does not answer offers the retry, and stays where it is', async ({
	page
}) => {
	const calls = checkoutCalls(page);
	await atRecommendation(page, UNREACHABLE_CHECKOUT);

	await page.getByRole('button', { name: 'Go to checkout' }).click();

	await expect(page.getByText('We could not reach the checkout')).toBeVisible();
	await expect(page).toHaveURL('/questionnaire/complete');

	// The action is ready again, and pressing it reaches the service a second time.
	await page.getByRole('button', { name: 'Try again' }).click();
	await expect.poll(() => calls.length).toBe(2);
	await expect(page.getByText('We could not reach the checkout')).toBeVisible();
	await expect(page).toHaveURL('/questionnaire/complete');
});

test('an e-mail the shop refuses is dropped rather than allowed to end the order', async ({
	page
}) => {
	const calls = checkoutCalls(page);
	await atRecommendation(page, MALFORMED_EMAIL);

	await page.getByRole('button', { name: 'Go to checkout' }).click();

	await expect(page.getByRole('heading', { name: 'Fixture checkout' })).toBeVisible();

	// The cart that exists was built without the prefill. That is the whole rule: the e-mail is
	// a convenience, and Shopify asks for an address at checkout either way.
	await expect(page.getByTestId('prefill')).toHaveText('none');

	// One press, one order. The refusal carried no cart, so answering it left exactly one.
	expect(calls).toHaveLength(1);
});

test('an answer set with no e-mail still reaches the checkout', async ({ page }) => {
	const calls = checkoutCalls(page);

	// `EVERY_ANSWER` completes the questionnaire without an e-mail: the model does not ask for
	// one, so this is a walk anybody can take. Shopify collects the address at checkout, so it
	// is an order to be completed there and not a dead end here.
	await atRecommendation(page, EVERY_ANSWER);

	await page.getByRole('button', { name: 'Go to checkout' }).click();

	await expect(page.getByRole('heading', { name: 'Fixture checkout' })).toBeVisible();
	expect(calls).toHaveLength(1);
});

test('leaving takes the answers with it, and keeps what a return needs', async ({ page }) => {
	// Written once into the open page rather than seeded per navigation: an init script would
	// put the answers back on the way home and hide the very thing under test.
	await page.goto('/questionnaire/page30');
	await writeAnswers(page, WITH_EMAIL);
	await page.goto(LAST_STEP);
	await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page).toHaveURL('/questionnaire/complete');
	await confirmPlan(page);

	await page.getByRole('button', { name: 'Go to checkout' }).click();
	await expect(page.getByRole('heading', { name: 'Fixture checkout' })).toBeVisible();

	// Back the way anyone would come back: the checkout is another origin, so the storage this
	// test is about can only be read from here.
	await page.goto('/questionnaire');
	await expect(page).toHaveURL('/questionnaire/complete');

	const stored = await page.evaluate(
		([answers, anamnesis]) => ({
			answers: window.sessionStorage.getItem(answers),
			anamnesis: window.sessionStorage.getItem(anamnesis)
		}),
		[answersKey(), anamnesisKey()] as const
	);

	expect(stored.answers).toBeNull();
	// The uid stays: a return to a session with no anamnesis would be a questionnaire nobody sent.
	expect(stored.anamnesis).toMatch(/^anam-fixture-/);

	// The count and the action both described a walk this browser no longer holds.
	await expect(page.getByText(/steps complete/)).toBeHidden();
	await expect(page.getByRole('button', { name: 'Go to checkout' })).toBeHidden();
	await expect(page.getByText('Your checkout has already been opened')).toBeVisible();
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
	await atRecommendation(page, WITH_EMAIL, /Digital-Rezept 49\.90 EUR/);

	await page.getByRole('button', { name: 'Go to checkout' }).click();

	await expect(page.getByRole('heading', { name: 'Fixture checkout' })).toBeVisible();
	expect(ordered).toBe(FIXTURE_PRESCRIPTION_VARIANT_ID);
});

test('a variant nobody recommended is refused, and no cart is made', async ({ page }) => {
	await atRecommendation(page, WITH_EMAIL);

	// The browser names its own merchandise, which is exactly the request the endpoint must
	// not honour: this variant is in the shop and is not in this anamnesis's recommendation.
	await page.route('**/api/checkout', async (route) => {
		const body = route.request().postDataJSON() as Record<string, unknown>;
		await route.continue({ postData: JSON.stringify({ ...body, variantId: '49703591706957' }) });
	});

	await page.getByRole('button', { name: 'Go to checkout' }).click();

	await expect(page.getByText('That treatment is not available to you')).toBeVisible();
	await expect(page).toHaveURL('/questionnaire/complete');
});
