import { sendReminderEvent } from '$lib/server/customerio/client';
import { readReminderRequest } from './validate';
import type { RequestHandler } from './$types';

/**
 * The reminder signal. This endpoint exists to keep the Customer.io credentials out of the
 * browser: they are the first real credential pair on an external boundary in this project, and
 * the questionnaire must never hold them.
 *
 * **It answers 204 for everything except malformed input, and that is the design.** A
 * deployment with no credentials configured, and a Customer.io that refuses or times out, are
 * both answered
 * the same as a success. The reminder is marketing; the questionnaire is medical. Nothing
 * about a mail that failed to send may reach the person filling in the form, and nothing here
 * may give the browser a reason to retry, block, or show an error.
 *
 * **Known and accepted, decided 2026-09-03.** Anyone can call this with any address, which is
 * the same property every newsletter sign-up on the internet has. The user weighed a real
 * double opt-in against the reach it costs and chose reach. What that leaves: a script could
 * enrol third parties and exhaust the daily sending credits. Revisit through `/fix` if it is
 * ever abused.
 */

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return new Response(null, { status: 400 });
	}

	const parsed = readReminderRequest(body);
	if (!parsed.ok) return new Response(null, { status: 400 });

	const result = await sendReminderEvent(parsed.stage, parsed.email);

	// Content-free on purpose. The address is personal data from a medical funnel, and a log
	// line is exactly the kind of place it must not end up. The stage is safe: it says which
	// call failed and nothing about who was on the other end of it.
	if (result === 'failed')
		console.error(`[reminder] Customer.io refused the ${parsed.stage} event`);

	return new Response(null, { status: 204 });
};
