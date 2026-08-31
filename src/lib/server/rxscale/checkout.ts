import { env } from '$env/dynamic/private';
import { CHECKOUT_COUNTRY_CODE } from '$lib/config/checkout';

/**
 * The RxScale treatment checkout. Server-only: the API key is read here and nowhere else,
 * and nothing in this module is importable from a component.
 *
 * Every call creates a Shopify cart, so it happens once per click and never on screen entry.
 */

const DEFAULT_PUBLIC_API_BASE_URL = 'https://api.rxscale.com';

export type CheckoutFailure =
	| 'missing-anamnesis'
	| 'missing-email'
	| 'not-configured'
	| 'refused'
	| 'unavailable';

export type CheckoutResult =
	| { ok: true; checkoutUrl: string }
	| { ok: false; reason: CheckoutFailure };

interface CheckoutInput {
	anamnesisUid: string;
	email: string;
	skuUid: string;
}

export interface CheckoutPayload {
	lines: { sku_uid: string; quantity: number; anamnesis_id: string }[];
	buyerIdentity: { email: string; countryCode: string };
	checkout_type: 'checkout_link';
}

/**
 * Pure, so the rules that make an order reviewable can be read in one place.
 *
 * `anamnesis_id` is optional to RxScale and mandatory here: a Shopify order without one
 * reaches the doctor with nothing to review. `checkout_link` rather than the `draft_order`
 * default, which mails the customer a checkout request instead of returning a link.
 */
export function buildCheckoutPayload(input: CheckoutInput): CheckoutResult | CheckoutPayload {
	if (!input.anamnesisUid.trim()) return { ok: false, reason: 'missing-anamnesis' };
	if (!input.email.trim()) return { ok: false, reason: 'missing-email' };
	if (!input.skuUid.trim()) return { ok: false, reason: 'not-configured' };

	return {
		lines: [{ sku_uid: input.skuUid, quantity: 1, anamnesis_id: input.anamnesisUid }],
		buyerIdentity: { email: input.email, countryCode: CHECKOUT_COUNTRY_CODE },
		checkout_type: 'checkout_link'
	};
}

function configured(value: string | undefined): string | null {
	const trimmed = value?.trim();

	return trimmed ? trimmed : null;
}

function treatmentsUrl(shopIdentifier: string): string {
	const baseUrl = configured(env.RXSCALE_PUBLIC_API_BASE_URL) ?? DEFAULT_PUBLIC_API_BASE_URL;

	return `${baseUrl.replace(/\/+$/, '')}/v2/public-api/treatments/${encodeURIComponent(shopIdentifier)}`;
}

/**
 * Asks RxScale for a checkout and returns the URL it gives back, untouched. The upstream
 * error body is deliberately not passed on: it can carry account detail that does not belong
 * in a browser, so the caller gets a name instead.
 */
export async function createCheckout(anamnesisUid: string, email: string): Promise<CheckoutResult> {
	const apiKey = configured(env.RXSCALE_API_KEY);
	const shopIdentifier = configured(env.RXSCALE_SHOP_IDENTIFIER);
	const skuUid = configured(env.RXSCALE_SKU_UID);

	if (!apiKey || !shopIdentifier || !skuUid) return { ok: false, reason: 'not-configured' };

	const payload = buildCheckoutPayload({ anamnesisUid, email, skuUid });
	if ('ok' in payload) return payload;

	let response: Response;
	try {
		response = await fetch(treatmentsUrl(shopIdentifier), {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				accept: 'application/json',
				'X-API-Key': apiKey
			},
			body: JSON.stringify(payload)
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

	const url =
		typeof body === 'object' && body !== null && 'checkout_url' in body
			? (body as { checkout_url: unknown }).checkout_url
			: null;

	// A success without a URL is nothing to redirect to, so it is a refusal, not a checkout.
	return typeof url === 'string' && url.length > 0
		? { ok: true, checkoutUrl: url }
		: { ok: false, reason: 'refused' };
}
