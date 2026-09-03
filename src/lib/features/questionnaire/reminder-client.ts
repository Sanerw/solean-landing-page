import { readEmail, type AnswerData } from './answers';

/**
 * The browser half of the abandoned-questionnaire reminder. It asks Solean's own endpoint,
 * never Customer.io directly: those are real credentials and they stay on the server.
 *
 * **Nothing here may be able to affect the questionnaire.** Every call is fire and forget, no
 * caller awaits one, and a rejected request is swallowed. The reminder is marketing and the
 * form is medical: a marketing call that fails must not delay a navigation, block a
 * submission, or put an error in front of somebody answering questions about their health.
 *
 * Only the address travels, and only because the answers live in the browser. The stage
 * travels as a stage, never as a vendor event name, so the server keeps the choice of which
 * automation a signal belongs to.
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

function signal(stage: Stage, email: string): void {
	void fetch('/api/reminder', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ stage, email })
	}).catch(() => {
		// Deliberately empty. There is nothing a visitor could do with this, and nothing this
		// app should do either: the endpoint already answers 204 to its own upstream failures,
		// so reaching here means the network went away.
	});
}

/**
 * Begin watching for abandonment. Called on every Continue, because the e-mail question can
 * be any step in the model and the answer only exists once its page has validated; the guard
 * above is what makes the repetition harmless.
 */
export function startReminderWatch(data: AnswerData): void {
	if (watching) return;

	const email = readEmail(data);
	// The model does not require the address, and a questionnaire walked without one simply
	// cannot be reminded. Not an error, and not a reason to keep asking.
	if (!email) return;

	watching = true;
	signal('email_captured', email);
}

/**
 * The anamnesis exists, so the reminder is owed to nobody. This is the automation's exit
 * condition, and it also sets `QUESTIONNAIRE_COMPLETED` on the contact as a second line of
 * defence inside Customer.io.
 */
export function endReminderWatch(data: AnswerData): void {
	const email = readEmail(data);
	if (!email) return;

	signal('submitted', email);
}
