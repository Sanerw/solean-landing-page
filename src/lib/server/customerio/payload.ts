/**
 * The requests sent to Customer.io, built from a stage, a person, and a locale.
 *
 * Kept pure and separate from the call so the one rule that matters here can be asserted
 * without a network: **only the keys below may ever leave this app.** The funnel is medical,
 * and `project-overview.md` allows the contact details a person types into `your-details` to
 * reach the reminder processor, and nothing else. No answer value, no anamnesis uid, no
 * medication or dose.
 *
 * The name and the telephone number were forbidden here until 2026-09-05, when the user asked
 * for them so a reminder can address somebody by name. What replaced that rule is the shape of
 * `ReminderPerson`: a closed record with a field per allowed value, read one line at a time
 * into the attributes below rather than spread. There is still no bag a caller can widen, and
 * a field added to the record has to be named twice, here and in the exact key set
 * `payload.test.ts` asserts, before it can travel.
 *
 * Both stages are a batch of an identify and an event, for the same reason: an event's
 * `attributes` are the *event's* and never reach the profile, proven against the live workspace
 * on 2026-09-03, so anything the campaign reads off a person needs an `identify`.
 */

export const REMINDER_STAGES = ['email_captured', 'submitted'] as const;

export type ReminderStage = (typeof REMINDER_STAGES)[number];

export function isReminderStage(value: unknown): value is ReminderStage {
	return REMINDER_STAGES.some((stage) => stage === value);
}

/**
 * Everything about a person that may reach Customer.io, and the whole of it. Optional means
 * not answered rather than not allowed: the address is the identifier and cannot be missing,
 * the names are required on our screen but a caller can still be a step early, and the phone
 * is optional in the questionnaire itself.
 */
export interface ReminderPerson {
	email: string;
	firstName?: string;
	lastName?: string;
	phone?: string;
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

/**
 * The person attribute the campaign branches on to pick the German or the English mail. A UI
 * locale, read from the path the visitor was on, never from an answer.
 */
export const LANGUAGE_ATTRIBUTE = 'language';

/**
 * Customer.io's own conventional profile attributes, spelled the way its templates and its SMS
 * channel expect to find them. `{{customer.first_name}}` is what somebody writes in the panel,
 * so a camelCase key here would leave every mail greeting nobody.
 */
export const FIRST_NAME_ATTRIBUTE = 'first_name';
export const LAST_NAME_ATTRIBUTE = 'last_name';
export const PHONE_ATTRIBUTE = 'phone';

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
	attributes: Record<string, string | boolean>;
}

export interface ReminderRequest {
	path: typeof BATCH_PATH;
	body: { batch: (PersonIdentify | PersonEvent)[] };
}

function personEvent(stage: ReminderStage, email: string): PersonEvent {
	return {
		type: 'person',
		identifiers: { email },
		action: 'event',
		name: EVENT_NAMES[stage]
	};
}

export function buildReminderRequest(
	stage: ReminderStage,
	person: ReminderPerson,
	language: string
): ReminderRequest {
	const { email } = person;

	/**
	 * Every stage carries every attribute rather than only the capture. The two calls are
	 * independent, so a capture whose request was lost must not leave the profile without the
	 * attribute the campaign branches on, or without the name the mail greets.
	 */
	const attributes: Record<string, string | boolean> = { [LANGUAGE_ATTRIBUTE]: language };

	/**
	 * One line per allowed field, never a spread of the record. An empty value is omitted
	 * rather than sent as an empty string: `{{customer.first_name}}` against `''` renders
	 * "Hallo ," where an absent attribute lets the template fall back.
	 */
	if (person.firstName) attributes[FIRST_NAME_ATTRIBUTE] = person.firstName;
	if (person.lastName) attributes[LAST_NAME_ATTRIBUTE] = person.lastName;
	if (person.phone) attributes[PHONE_ATTRIBUTE] = person.phone;

	/**
	 * Only on the way out. The campaign's exit condition already removes the person when this
	 * event arrives, so the marker is redundant on the happy path and is set anyway: an exit
	 * condition is one mechanism, and a reminder mailed to somebody who already finished is the
	 * failure worth spending one field to prevent.
	 */
	if (stage === 'submitted') attributes[COMPLETED_ATTRIBUTE] = true;

	return {
		path: BATCH_PATH,
		body: {
			/**
			 * The identify comes first, so the attributes are already set when the event is
			 * evaluated. The reverse order leaves a window in which a send could be picked against
			 * a profile that has no language yet, or an exit against one not yet marked.
			 */
			batch: [
				{ type: 'person', identifiers: { email }, action: 'identify', attributes },
				personEvent(stage, email)
			]
		}
	};
}
