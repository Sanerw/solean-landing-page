/**
 * The browser half of the handoff. It asks Solean's own endpoint for a checkout, never
 * RxScale: the API key is private and a component may not hold it.
 *
 * The e-mail travels because only the browser has the answers. It is sent for the one
 * upstream call and kept nowhere.
 */

/**
 * The reasons our endpoint can give. Listed at runtime as well as in the type, because a
 * response body is still untrusted input even when we wrote the server that sent it.
 */
const FAILURES = [
	'missing-anamnesis',
	'missing-email',
	'not-configured',
	'refused',
	'unavailable'
] as const;

export type CheckoutFailure = (typeof FAILURES)[number];

export type CheckoutResult =
	| { ok: true; checkoutUrl: string }
	| { ok: false; reason: CheckoutFailure };

type Fetch = typeof globalThis.fetch;

function toFailure(body: unknown): CheckoutResult {
	const reason =
		typeof body === 'object' && body !== null && 'reason' in body
			? (body as { reason: unknown }).reason
			: null;

	// A reason we do not recognise is a service we cannot reason about, not a silent success.
	return { ok: false, reason: FAILURES.find((known) => known === reason) ?? 'unavailable' };
}

/**
 * Called on the click and never before: each call creates a cart at Shopify, so a screen
 * that asked on entry would leave one behind for every visitor who only looked.
 */
export async function requestCheckout(
	fetch: Fetch,
	anamnesisUid: string | null,
	email: string | null
): Promise<CheckoutResult> {
	// Checked here as well as at the endpoint, so an order that cannot be reviewed costs no
	// request at all.
	if (!anamnesisUid) return { ok: false, reason: 'missing-anamnesis' };
	if (!email) return { ok: false, reason: 'missing-email' };

	let response: Response;
	try {
		response = await fetch('/api/checkout', {
			method: 'POST',
			headers: { 'content-type': 'application/json', accept: 'application/json' },
			body: JSON.stringify({ anamnesisUid, email })
		});
	} catch {
		return { ok: false, reason: 'unavailable' };
	}

	let body: unknown = null;
	try {
		body = await response.json();
	} catch {
		body = null;
	}

	if (!response.ok) return toFailure(body);

	const url =
		typeof body === 'object' && body !== null && 'checkoutUrl' in body
			? (body as { checkoutUrl: unknown }).checkoutUrl
			: null;

	// A success with nothing to open is not a checkout.
	return typeof url === 'string' && url.length > 0
		? { ok: true, checkoutUrl: url }
		: { ok: false, reason: 'unavailable' };
}
