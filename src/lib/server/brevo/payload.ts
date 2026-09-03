/**
 * The body sent to Brevo, built from nothing but a stage and an address.
 *
 * Kept pure and separate from the call so the one rule that matters here can be asserted
 * without a network: **only the keys below may ever leave this app.** The funnel is medical,
 * and `project-overview.md` allows the e-mail and a stage marker to reach Brevo and nothing
 * else. No answer value, no anamnesis uid, no medication or dose, no name, no telephone
 * number. The builder takes two arguments rather than an object for exactly that reason:
 * there is no bag of extra properties for a caller to widen later.
 */

export const REMINDER_STAGES = ['email_captured', 'submitted'] as const;

export type ReminderStage = (typeof REMINDER_STAGES)[number];

export function isReminderStage(value: unknown): value is ReminderStage {
	return REMINDER_STAGES.some((stage) => stage === value);
}

/**
 * Load-bearing strings. A person types each of these into the Brevo panel by hand, once, and
 * Brevo compares them literally: a mismatch does not raise an error, it silently leaves the
 * automation unarmed. One constant each, never assembled from parts, the same rule
 * `ANAMNESIS_ATTRIBUTE_KEY` follows for the Shopify cart attribute.
 *
 * `questionnaire_email_captured` is the automation's entry trigger.
 * `anamnesis_submitted` is its exit condition.
 */
const EVENT_NAMES: Record<ReminderStage, string> = {
	email_captured: 'questionnaire_email_captured',
	submitted: 'anamnesis_submitted'
};

/** The contact attribute the automation checks before each send, as a second line of defence. */
export const COMPLETED_ATTRIBUTE = 'QUESTIONNAIRE_COMPLETED';

export interface ReminderEvent {
	event_name: string;
	identifiers: { email_id: string };
	contact_properties?: Record<string, boolean>;
}

export function buildReminderEvent(stage: ReminderStage, email: string): ReminderEvent {
	const event: ReminderEvent = {
		event_name: EVENT_NAMES[stage],
		identifiers: { email_id: email }
	};

	/**
	 * Only on the way out. Brevo's exit condition already removes the contact when this event
	 * arrives, so the attribute is redundant on the happy path and is set anyway: an exit
	 * condition is one mechanism, and a reminder sent to somebody who already finished is the
	 * failure worth spending one field to prevent.
	 */
	if (stage === 'submitted') event.contact_properties = { [COMPLETED_ATTRIBUTE]: true };

	return event;
}
