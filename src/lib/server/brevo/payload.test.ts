import { describe, expect, it } from 'vitest';
import {
	COMPLETED_ATTRIBUTE,
	buildReminderEvent,
	isReminderStage,
	type ReminderEvent
} from './payload';

const EMAIL = 'jonas@example.com';

/** Every key that may ever leave this app for Brevo, at every depth. */
function keysOf(event: ReminderEvent): string[] {
	return [
		...Object.keys(event),
		...Object.keys(event.identifiers).map((k) => `identifiers.${k}`),
		...Object.keys(event.contact_properties ?? {}).map((k) => `contact_properties.${k}`)
	].sort();
}

describe('buildReminderEvent', () => {
	it('names the automation entry trigger on capture', () => {
		// Typed by hand into the Brevo panel and compared literally there. A rename here without
		// a rename there leaves the automation armed for an event that never arrives.
		expect(buildReminderEvent('email_captured', EMAIL).event_name).toBe(
			'questionnaire_email_captured'
		);
	});

	it('names the automation exit condition on submission', () => {
		expect(buildReminderEvent('submitted', EMAIL).event_name).toBe('anamnesis_submitted');
	});

	it('identifies the contact by the address alone', () => {
		expect(buildReminderEvent('email_captured', EMAIL).identifiers).toEqual({ email_id: EMAIL });
	});

	it('marks the contact completed only on the way out', () => {
		// The redundancy is deliberate: the exit condition is one mechanism, and this attribute
		// is what an if/else in the panel checks before each send.
		expect(buildReminderEvent('submitted', EMAIL).contact_properties).toEqual({
			[COMPLETED_ATTRIBUTE]: true
		});
		expect(buildReminderEvent('email_captured', EMAIL).contact_properties).toBeUndefined();
	});

	/**
	 * The privacy boundary, asserted as an exact key set rather than an absence check, so a
	 * newly added field fails here instead of travelling. This is a medical funnel: no answer,
	 * no anamnesis uid, no medication or dose, no name, no telephone number may reach Brevo.
	 */
	it('sends the capture with exactly two keys and nothing else', () => {
		expect(keysOf(buildReminderEvent('email_captured', EMAIL))).toEqual([
			'event_name',
			'identifiers',
			'identifiers.email_id'
		]);
	});

	it('sends the submission with exactly the completion attribute added', () => {
		expect(keysOf(buildReminderEvent('submitted', EMAIL))).toEqual([
			`contact_properties.${COMPLETED_ATTRIBUTE}`,
			'contact_properties',
			'event_name',
			'identifiers',
			'identifiers.email_id'
		].sort());
	});
});

describe('isReminderStage', () => {
	it('accepts the two stages this app sends', () => {
		expect(isReminderStage('email_captured')).toBe(true);
		expect(isReminderStage('submitted')).toBe(true);
	});

	it('refuses anything else, including the Brevo event names themselves', () => {
		// The wire format is the stage, not the event name: a caller must not be able to choose
		// which Brevo event fires by naming it.
		for (const value of ['anamnesis_submitted', 'Submitted', '', null, undefined, 1, {}]) {
			expect(isReminderStage(value)).toBe(false);
		}
	});
});
