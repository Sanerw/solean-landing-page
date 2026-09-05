import { getLocale } from '$lib/paraglide/runtime';
import { readReminderContact, type ReminderContact } from './answers';
import type { Answers } from './answers/types';

/**
 * The browser half of the abandoned-questionnaire reminder. It asks Solean's own endpoint,
 * never Customer.io directly: those are real credentials and they stay on the server.
 *
 * **Nothing here may be able to affect the questionnaire.** Every call is fire and forget, no
 * caller awaits one, and a rejected request is swallowed. The reminder is marketing and the
 * form is medical: a marketing call that fails must not delay a navigation, block a
 * submission, or put an error in front of somebody answering questions about their health.
 *
 * Only the contact details travel: the address, the name, and the telephone number when it was
 * given. The medical answers stay in the browser. The stage travels as a stage, never as a
 * vendor event name, so the server keeps the choice of which automation a signal belongs to.
 */

type Stage = 'email_captured' | 'submitted';

/**
 * One watch per session, guarded here the way `events.ts` guards its one-shot events. The
 * module has the same lifetime as the survey session it reports on, so a reload legitimately
 * starts a new one and moving between steps does not.
 *
 * Marked before the request rather than after it, which is the opposite of `events.ts` and
 * deliberate. There the question was whether a consent gate had refused the event, so a
 * spent one-shot would lose an arrival for good. Here the request is unobservable, and the
 * two failure modes are not equal: a duplicate enrols somebody twice, a lost one costs a
 * reminder. At most once is the property worth having.
 */
let watching = false;

function signal(stage: Stage, contact: ReminderContact): void {
	void fetch('/api/reminder', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		// Field by field rather than a spread of the contact, the same rule the server's payload
		// builder follows: what leaves this app is written out here, so widening it is a visible
		// edit. An unanswered field is `undefined` and `JSON.stringify` drops it, so the body
		// carries the phone only when somebody typed one.
		//
		// The language is the campaign's mail choice. Read here rather than on the server,
		// because the locale lives in the path the visitor is on, not in the request body.
		body: JSON.stringify({
			stage,
			email: contact.email,
			firstName: contact.firstName,
			lastName: contact.lastName,
			phone: contact.phone,
			language: getLocale()
		})
	}).catch(() => {
		// Deliberately empty. There is nothing a visitor could do with this, and nothing this
		// app should do either: the endpoint already answers 204 to its own upstream failures,
		// so reaching here means the network went away.
	});
}

/**
 * Begin watching for abandonment. Called on every Continue, because the answer only exists
 * once the screen asking for it has validated; the guard above is what makes the repetition
 * harmless.
 */
export function startReminderWatch(answers: Answers): void {
	if (watching) return;

	const contact = readReminderContact(answers);
	// No address, no reminder: a questionnaire walked without one simply cannot be reminded.
	// Not an error, and not a reason to keep asking. The name rides along because it is answered
	// on the same screen, so a capture that happens at all has one.
	if (!contact) return;

	watching = true;
	signal('email_captured', contact);
}

/**
 * The anamnesis exists, so the reminder is owed to nobody. This is the automation's exit
 * condition, and it also sets `QUESTIONNAIRE_COMPLETED` on the contact as a second line of
 * defence inside Customer.io.
 */
export function endReminderWatch(answers: Answers): void {
	const contact = readReminderContact(answers);
	if (!contact) return;

	signal('submitted', contact);
}
