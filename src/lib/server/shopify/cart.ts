import { env } from '$env/dynamic/private';
import { ANAMNESIS_ATTRIBUTE_KEY, CHECKOUT_COUNTRY_CODE } from '$lib/config/checkout';

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
 * whether a cart exists, not the status.
 */
function checkoutUrlIn(body: unknown): string | null {
	const created = record(record(record(body)?.data)?.cartCreate);
	const errors = created?.userErrors;

	if (Array.isArray(errors) && errors.length > 0) return null;

	const url = record(created?.cart)?.checkoutUrl;

	return typeof url === 'string' && url.length > 0 ? url : null;
}

/**
 * Creates the cart and returns the URL Shopify gives back, untouched. The upstream error body
 * is deliberately not passed on: the caller gets a name instead.
 */
export async function createCart(anamnesisUid: string, email: string): Promise<CheckoutResult> {
	const storeDomain = configured(env.SHOPIFY_STORE_DOMAIN);
	const variantId = configured(env.SHOPIFY_VARIANT_ID);

	if (!storeDomain || !variantId) return { ok: false, reason: 'not-configured' };

	const input = buildCartInput({ anamnesisUid, email, variantId });
	if ('ok' in input) return input;

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
		return { ok: false, reason: 'unavailable' };
	}

	if (response.status >= 500) return { ok: false, reason: 'unavailable' };

	let body: unknown = null;
	try {
		body = await response.json();
	} catch {
		body = null;
	}

	if (!response.ok) return { ok: false, reason: 'refused' };

	const url = checkoutUrlIn(body);

	return url ? { ok: true, checkoutUrl: url } : { ok: false, reason: 'refused' };
}
