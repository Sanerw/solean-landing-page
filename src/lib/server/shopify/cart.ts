import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { ANAMNESIS_ATTRIBUTE_KEY, CHECKOUT_COUNTRY_CODE } from '$lib/config/checkout';
import { fetchRecommendation } from '$lib/server/rxscale/recommendation';

/**
 * The Shopify Storefront cart the handoff redirects to. RxScale is not called on this path at
 * all: they import the order from Shopify by webhook and read the anamnesis off the cart
 * attribute attached here.
 *
 * Server-side so validation has one home and the browser keeps one contract, not for secrecy:
 * nothing on this path is a secret.
 *
 * Every call creates a cart, so it happens once per click and never on screen entry.
 */

const DEFAULT_API_VERSION = '2025-01';
const VARIANT_GID_PREFIX = 'gid://shopify/ProductVariant/';

const CART_CREATE = `
	mutation CartCreate($input: CartInput!) {
		cartCreate(input: $input) {
			cart { checkoutUrl }
			userErrors { field message }
		}
	}
`;

export type CheckoutFailure =
	| 'missing-anamnesis'
	| 'not-configured'
	| 'not-recommended'
	| 'refused'
	| 'unavailable';

export type CheckoutResult =
	| { ok: true; checkoutUrl: string }
	| { ok: false; reason: CheckoutFailure };

interface CartRequest {
	anamnesisUid: string;
	email: string;
	variantId: string;
}

export interface CartInput {
	lines: { merchandiseId: string; quantity: number }[];
	attributes: { key: string; value: string }[];
	buyerIdentity: { countryCode: string; email?: string };
}

/**
 * Pure, so the rules that make an order reviewable can be read in one place.
 *
 * The anamnesis rides as a single order-level attribute and nowhere else. The variant is a
 * bundle Shopify expands into medication, treatment fee and needles, and RxScale falls back
 * from the line to its group to the order, so the one attribute reaches components this app
 * never sees. A line property would have to be repeated for each of them.
 *
 * The uid is passed on exactly as received: RxScale compares it character for character and
 * ignores a mismatch without a word. The e-mail is a prefill and never a condition: Shopify
 * collects the address at checkout, so an order without one is complete rather than
 * unreachable.
 */
export function buildCartInput(
	request: CartRequest
): { ok: false; reason: CheckoutFailure } | CartInput {
	if (!request.anamnesisUid.trim()) return { ok: false, reason: 'missing-anamnesis' };
	if (!request.variantId.trim()) return { ok: false, reason: 'not-configured' };

	const email = request.email.trim();
	const buyerIdentity: CartInput['buyerIdentity'] = { countryCode: CHECKOUT_COUNTRY_CODE };
	if (email) buyerIdentity.email = email;

	return {
		lines: [{ merchandiseId: merchandiseId(request.variantId), quantity: 1 }],
		attributes: [{ key: ANAMNESIS_ATTRIBUTE_KEY, value: request.anamnesisUid }],
		buyerIdentity
	};
}

function configured(value: string | undefined): string | null {
	const trimmed = value?.trim();

	return trimmed ? trimmed : null;
}

function merchandiseId(variantId: string): string {
	const value = variantId.trim();

	return value.startsWith('gid://') ? value : `${VARIANT_GID_PREFIX}${value}`;
}

function storefrontUrl(storeDomain: string): string {
	const version = configured(env.SHOPIFY_STOREFRONT_API_VERSION) ?? DEFAULT_API_VERSION;
	// A scheme is accepted so the browser harness can point this at the local fixture.
	const origin = /^https?:\/\//.test(storeDomain) ? storeDomain : `https://${storeDomain}`;

	return `${origin.replace(/\/+$/, '')}/api/${version}/graphql.json`;
}

function record(value: unknown): Record<string, unknown> | null {
	return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

/**
 * `userErrors` is Shopify's refusal channel and arrives with a 200, so the body decides
 * whether a cart exists, not the status. The errors come back as well as the URL, because
 * which input they name decides whether the refusal is worth answering.
 */
function cartCreateIn(body: unknown): { url: string | null; errors: unknown[] } {
	const created = record(record(record(body)?.data)?.cartCreate);
	const raw = created?.userErrors;
	const errors = Array.isArray(raw) ? raw : [];
	const url = record(created?.cart)?.checkoutUrl;
	if (errors.length > 0 || typeof url !== 'string' || url.length === 0) {
		return { url: null, errors };
	}

	return { url, errors };
}

/**
 * Shopify names the input path it rejected, as `["input", "buyerIdentity", "email"]`. Matched
 * on its tail so the leading `input` is not load-bearing, and on the whole path rather than
 * the message, which is localized: the live shop answers in German.
 */
function isEmailError(error: unknown): boolean {
	const field = record(error)?.field;

	return (
		Array.isArray(field) &&
		field.length >= 2 &&
		field.at(-2) === 'buyerIdentity' &&
		field.at(-1) === 'email'
	);
}

/** A refusal the e-mail alone explains is answerable; every other one is the shop's verdict. */
interface CartAttempt {
	result: CheckoutResult;
	emailRefused: boolean;
}

async function postCart(storeDomain: string, input: CartInput): Promise<CartAttempt> {
	// The shop answers without a token today, which is undocumented behaviour rather than a
	// foundation, so it is sent when configured and its absence is not an error.
	const token = configured(env.SHOPIFY_STOREFRONT_TOKEN);

	let response: Response;
	try {
		response = await fetch(storefrontUrl(storeDomain), {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				accept: 'application/json',
				...(token ? { 'X-Shopify-Storefront-Access-Token': token } : {})
			},
			body: JSON.stringify({ query: CART_CREATE, variables: { input } })
		});
	} catch {
		return { result: { ok: false, reason: 'unavailable' }, emailRefused: false };
	}

	if (response.status >= 500) {
		return { result: { ok: false, reason: 'unavailable' }, emailRefused: false };
	}

	let body: unknown = null;
	try {
		body = await response.json();
	} catch {
		body = null;
	}

	if (!response.ok) return { result: { ok: false, reason: 'refused' }, emailRefused: false };

	const { url, errors } = cartCreateIn(body);
	if (url) return { result: { ok: true, checkoutUrl: url }, emailRefused: false };

	return {
		result: { ok: false, reason: 'refused' },
		// Every complaint, not merely one of them: a cart refused for the line as well would
		// be refused again without the e-mail, and the second answer would say less.
		emailRefused: errors.length > 0 && errors.every(isEmailError)
	};
}

/**
 * Which variant this anamnesis may actually buy. The browser names one, and the browser is
 * not the authority: RxScale decides which treatments and doses a person's answers allow, so
 * the recommendation is read again here and a variant that is not in it is refused. Without
 * this the endpoint would order any variant in the shop for any uid.
 *
 * When nothing is recommended, or the recommendation cannot be reached, the configured
 * variant is the only one allowed. That keeps a person who reached the end of the
 * questionnaire from being stranded, and it is the one case where a variant is offered that
 * RxScale did not name.
 */
async function allowedVariant(
	anamnesisUid: string,
	storeDomain: string,
	requested: string
): Promise<{ variantId: string } | { ok: false; reason: CheckoutFailure }> {
	const fallback = configured(env.SHOPIFY_VARIANT_ID);
	const recommendation = await fetchRecommendation(anamnesisUid, storeDomain);
	const offered = recommendation.ok
		? recommendation.plans.flatMap((plan) => plan.options.map((option) => option.variantId))
		: [];

	if (offered.length === 0) {
		return fallback ? { variantId: fallback } : { ok: false, reason: 'not-configured' };
	}

	const wanted = requested.trim();
	if (!wanted) return { ok: false, reason: 'not-recommended' };

	return offered.includes(wanted)
		? { variantId: wanted }
		: { ok: false, reason: 'not-recommended' };
}

/**
 * Creates the cart and returns the URL Shopify gives back, untouched. The upstream error body
 * is deliberately not passed on: the caller gets a name instead.
 */
export async function createCart(
	anamnesisUid: string,
	email: string,
	variantId: string
): Promise<CheckoutResult> {
	const storeDomain = configured(publicEnv.PUBLIC_SHOPIFY_STORE_DOMAIN);
	if (!storeDomain) return { ok: false, reason: 'not-configured' };
	if (!anamnesisUid.trim()) return { ok: false, reason: 'missing-anamnesis' };

	const allowed = await allowedVariant(anamnesisUid, storeDomain, variantId);
	if ('reason' in allowed) return allowed;

	const input = buildCartInput({ anamnesisUid, email, variantId: allowed.variantId });
	if ('ok' in input) return input;

	const attempt = await postCart(storeDomain, input);

	// The e-mail is a prefill and never a condition, so an address the shop will not take is
	// dropped rather than allowed to end the order: Shopify collects one at checkout anyway.
	// A refusal carries no cart, so the order still costs exactly one.
	if (attempt.emailRefused && input.buyerIdentity.email) {
		// Rebuilt rather than edited, so the retry obeys the same rules as the first attempt.
		const retry = buildCartInput({ anamnesisUid, email: '', variantId: allowed.variantId });
		if ('ok' in retry) return retry;

		return (await postCart(storeDomain, retry)).result;
	}

	return attempt.result;
}
