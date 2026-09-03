/**
 * The requests sent to Customer.io, built from nothing but a stage and an address.
 *
 * Kept pure and separate from the call so the one rule that matters here can be asserted
 * without a network: **only the keys below may ever leave this app.** The funnel is medical,
 * and `project-overview.md` allows the e-mail and a stage marker to reach the reminder
 * processor and nothing else. No answer value, no anamnesis uid, no medication or dose, no
 * name, no telephone number. The builder takes two arguments rather than an object for exactly
 * that reason: there is no bag of extra properties for a caller to widen later.
 *
 * The two stages are deliberately not the same shape. An event's `attributes` are the
 * *event's* attributes and never reach the profile, proven against the live workspace on
 * 2026-09-03, so the completion marker needs an `identify` that a lone event cannot carry.
 */

export const REMINDER_STAGES = ['email_captured', 'submitted'] as const;

export type ReminderStage = (typeof REMINDER_STAGES)[number];

export function isReminderStage(value: unknown): value is ReminderStage {
	return REMINDER_STAGES.some((stage) => stage === value);
}

/**
 * Load-bearing strings. A person types each of these into the Customer.io panel by hand, once,
 * and Customer.io compares them literally: a mismatch does not raise an error, it silently
 * leaves the automation unarmed. One constant each, never assembled from parts, the same rule
 * `ANAMNESIS_ATTRIBUTE_KEY` follows for the Shopify cart attribute.
 *
 * `questionnaire_email_captured` is the campaign's entry trigger.
 * `anamnesis_submitted` is its exit condition.
 */
const EVENT_NAMES: Record<ReminderStage, string> = {
	email_captured: 'questionnaire_email_captured',
	submitted: 'anamnesis_submitted'
};

/** The person attribute the campaign checks before each send, as a second line of defence. */
export const COMPLETED_ATTRIBUTE = 'questionnaire_completed';

const ENTITY_PATH = '/api/v2/entity';
const BATCH_PATH = '/api/v2/batch';

interface PersonEvent {
	type: 'person';
	identifiers: { email: string };
	action: 'event';
	name: string;
}

interface PersonIdentify {
	type: 'person';
	identifiers: { email: string };
	action: 'identify';
	attributes: Record<string, boolean>;
}

export interface ReminderRequest {
	path: typeof ENTITY_PATH | typeof BATCH_PATH;
	body: PersonEvent | { batch: (PersonIdentify | PersonEvent)[] };
}

function personEvent(stage: ReminderStage, email: string): PersonEvent {
	return {
		type: 'person',
		identifiers: { email },
		action: 'event',
		name: EVENT_NAMES[stage]
	};
}

export function buildReminderRequest(stage: ReminderStage, email: string): ReminderRequest {
	if (stage === 'email_captured') {
		// One call is enough on the way in: the event creates the profile by itself, so there is
		// nothing to identify first.
		return { path: ENTITY_PATH, body: personEvent(stage, email) };
	}

	return {
		path: BATCH_PATH,
		body: {
			/**
			 * The identify comes first so the attribute is already true when the event that
			 * triggers the campaign's exit arrives. The reverse order leaves a window in which a
			 * send could be evaluated against a profile that has not been marked yet.
			 *
			 * The attribute is redundant on the happy path, since the exit condition already
			 * removes the person when the event arrives. It is sent anyway: an exit condition is
			 * one mechanism, and a reminder mailed to somebody who already finished is the failure
			 * worth spending one field to prevent.
			 */
			batch: [
				{
					type: 'person',
					identifiers: { email },
					action: 'identify',
					attributes: { [COMPLETED_ATTRIBUTE]: true }
				},
				personEvent(stage, email)
			]
		}
	};
}
