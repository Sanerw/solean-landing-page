import { env } from '$env/dynamic/private';
import { buildReminderEvent, type ReminderStage } from './payload';

/**
 * The one place Brevo is spoken to, and it is only ever spoken to from the server.
 *
 * `BREVO_API_KEY` is the first real credential on an external boundary in this project. It is
 * read from private env and never reaches a bundle the browser downloads; the questionnaire
 * asks our own `/api/reminder` instead.
 *
 * Proven against the live account on 2026-09-03: `POST /v3/events` accepts an address that has
 * no contact yet and creates one, so there is no `POST /v3/contacts` here. Creation is
 * asynchronous, taking seconds, which matters to anything that would try to read the contact
 * back but not to this call.
 */

const EVENTS_URL = 'https://api.brevo.com/v3/events';

/** An env var set to an empty string is not configuration, so it reads as absent. */
function apiKey(): string | null {
	const trimmed = env.BREVO_API_KEY?.trim();

	return trimmed ? trimmed : null;
}

/**
 * Whether this deployment sends reminders at all. An absent key is an ordinary state, not a
 * failure, exactly as an absent `PUBLIC_MIXPANEL_TOKEN` means a deployment that does not
 * measure. A preview build should not mail anybody.
 */
export function reminderConfigured(): boolean {
	return apiKey() !== null;
}

export type ReminderResult = 'sent' | 'not-configured' | 'failed';

export async function sendReminderEvent(
	stage: ReminderStage,
	email: string
): Promise<ReminderResult> {
	const key = apiKey();
	if (!key) return 'not-configured';

	try {
		const response = await fetch(EVENTS_URL, {
			method: 'POST',
			headers: {
				'api-key': key,
				'content-type': 'application/json'
			},
			body: JSON.stringify(buildReminderEvent(stage, email))
		});

		// 204 is the documented success. Anything else is Brevo refusing, and the caller turns
		// that into a log rather than an error a visitor can see.
		return response.status === 204 ? 'sent' : 'failed';
	} catch {
		return 'failed';
	}
}
