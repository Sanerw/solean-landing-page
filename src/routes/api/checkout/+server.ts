import { json } from '@sveltejs/kit';
import { createCheckout, type CheckoutFailure } from '$lib/server/rxscale/checkout';
import type { RequestHandler } from './$types';

/**
 * The checkout handoff. This endpoint exists because the API key is private and a component
 * may never see it; the browser sends only what the browser owns, which is the anamnesis uid
 * and the e-mail the visitor answered with.
 *
 * Neither is stored or logged here. They are used for one upstream call and forgotten.
 */

/** One status per reason, so a proxy log tells the same story as the body. */
const STATUS: Record<CheckoutFailure, number> = {
	'missing-anamnesis': 400,
	'missing-email': 400,
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

	const result = await createCheckout(field(body, 'anamnesisUid'), field(body, 'email'));

	return result.ok ? json(result) : json(result, { status: STATUS[result.reason] });
};
