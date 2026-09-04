import { json } from '@sveltejs/kit';
import { createCart, type CheckoutFailure } from '$lib/server/shopify/cart';
import type { RequestHandler } from './$types';

/**
 * The checkout handoff. This endpoint exists so the rules that make an order reviewable are
 * enforced in one place and the browser keeps one stable contract, not to hide a secret:
 * there is none on this path. The browser sends only what the browser owns, which is the
 * anamnesis uid, the e-mail the visitor answered with, and the variant they chose. The
 * variant used to be checked against RxScale's recommendation before a cart was made; that
 * check was removed on 2026-09-04 for the four seconds it cost, so the variant is taken as
 * sent and this endpoint will build a cart for any variant in the shop.
 *
 * Neither is stored or logged here. They are used for one upstream call and forgotten.
 */

/** One status per reason, so a proxy log tells the same story as the body. */
const STATUS: Record<CheckoutFailure, number> = {
	'missing-anamnesis': 400,
	'not-configured': 500,
	refused: 422,
	unavailable: 502
};

function field(body: unknown, name: string): string {
	if (typeof body !== 'object' || body === null) return '';
	const value = (body as Record<string, unknown>)[name];

	return typeof value === 'string' ? value.trim() : '';
}

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, reason: 'missing-anamnesis' }, { status: 400 });
	}

	const result = await createCart(
		field(body, 'anamnesisUid'),
		field(body, 'email'),
		field(body, 'variantId')
	);

	return result.ok ? json(result) : json(result, { status: STATUS[result.reason] });
};
