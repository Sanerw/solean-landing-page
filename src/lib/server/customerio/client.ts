import { env } from '$env/dynamic/private';
import { buildReminderRequest, type ReminderPerson, type ReminderStage } from './payload';

/**
 * The one place Customer.io is spoken to, and it is only ever spoken to from the server.
 *
 * The credentials are the first real credential pair on an external boundary in this project.
 * They are read from private env and never reach a bundle the browser downloads; the
 * questionnaire asks our own `/api/reminder` instead.
 *
 * The EU host is not interchangeable with the US one. `GET /auth` answers 200 on both with the
 * same credentials, proven on 2026-09-03, so nothing at runtime can tell you the region is
 * wrong: it rests on the workspace being an EU workspace.
 */

const HOST = 'https://track-eu.customer.io';

/**
 * The Basic header, or null when either half is missing. An env var set to an empty string is
 * not configuration, so it reads as absent.
 *
 * **Both or nothing.** A half-configured deployment sends nothing rather than authenticating
 * badly on every questionnaire, which is the difference between a deployment that does not
 * measure and one that fails quietly on every visitor.
 */
export function basicAuth(siteId: string | undefined, apiKey: string | undefined): string | null {
	const id = siteId?.trim();
	const key = apiKey?.trim();

	if (!id || !key) return null;

	// btoa rather than Buffer, so this does not depend on the function running on the Node
	// runtime rather than the edge one.
	return `Basic ${btoa(`${id}:${key}`)}`;
}

function authorization(): string | null {
	return basicAuth(env.CUSTOMERIO_SITE_ID, env.CUSTOMERIO_TRACK_API_KEY);
}

/**
 * Whether this deployment sends reminders at all. Absent credentials are an ordinary state, not
 * a failure, exactly as an absent `PUBLIC_MIXPANEL_TOKEN` means a deployment that does not
 * measure. A preview build should not mail anybody.
 */
export function reminderConfigured(): boolean {
	return authorization() !== null;
}

/**
 * Success is a 200 with `{}`, confirmed live on 2026-09-03. Two traps live here.
 *
 * The first is the status: Brevo answered 204 and this answers 200, so a check carried across
 * unchanged would call every successful send a failure.
 *
 * The second is that `/api/v2/batch` reports per-entry failures **inside** a 200 body. The
 * submitted stage is a batch, so reading the status alone would accept a call in which the
 * identify or the event was rejected. A 200 whose body is not JSON is still accepted: the
 * reminder is not worth failing over a response shape we did not anticipate.
 */
export function wasAccepted(ok: boolean, body: string): boolean {
	if (!ok) return false;

	let parsed: unknown;
	try {
		parsed = JSON.parse(body);
	} catch {
		return true;
	}

	if (parsed === null || typeof parsed !== 'object' || !('errors' in parsed)) return true;

	const { errors } = parsed as { errors: unknown };

	return Array.isArray(errors) && errors.length === 0;
}

export type ReminderResult = 'sent' | 'not-configured' | 'failed';

export async function sendReminderEvent(
	stage: ReminderStage,
	person: ReminderPerson,
	language: string
): Promise<ReminderResult> {
	const auth = authorization();
	if (!auth) return 'not-configured';

	const { path, body } = buildReminderRequest(stage, person, language);

	try {
		const response = await fetch(HOST + path, {
			method: 'POST',
			headers: {
				authorization: auth,
				'content-type': 'application/json'
			},
			body: JSON.stringify(body)
		});

		return wasAccepted(response.ok, await response.text()) ? 'sent' : 'failed';
	} catch {
		return 'failed';
	}
}
