import { identifyFromContact } from '$lib/analytics/identity';
import { readReminderContact } from './answers';
import type { Answers } from './answers/types';

/**
 * The questionnaire's half of the analytics identity, kept here for the reason
 * `reminder-client.ts` beside it is kept here: `$lib/analytics` should not know what an
 * `Answers` is. It reads the same closed contact record the reminder does, so the two cannot
 * disagree about what may leave this app about a person.
 *
 * Fire and forget, like the reminder, and for the same reason: analytics may never delay a
 * navigation or put an error in front of somebody answering questions about their health.
 */
export function identifyFromAnswers(answers: Answers): void {
	const contact = readReminderContact(answers);
	// No address, no identity. The visitor stays the anonymous id they already were.
	if (!contact) return;

	identifyFromContact(contact);
}
