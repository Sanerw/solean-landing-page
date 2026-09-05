import { describe, expect, it } from 'vitest';
import {
	COMPLETED_ATTRIBUTE,
	FIRST_NAME_ATTRIBUTE,
	LANGUAGE_ATTRIBUTE,
	LAST_NAME_ATTRIBUTE,
	PHONE_ATTRIBUTE,
	buildReminderRequest,
	isReminderStage,
	type ReminderPerson,
	type ReminderRequest
} from './payload';

const EMAIL = 'jonas@example.com';
const LANGUAGE = 'de';

/** Everything a visitor can answer on `your-details`. */
const PERSON: ReminderPerson = {
	email: EMAIL,
	firstName: 'Jonas',
	lastName: 'Weber',
	phone: '+49 170 1234567'
};

/** The same visitor before the optional field, which is how most walks arrive. */
const WITHOUT_PHONE: ReminderPerson = { email: EMAIL, firstName: 'Jonas', lastName: 'Weber' };

/**
 * Every key that may ever leave this app, at every depth and through arrays.
 *
 * Recursive rather than the hand-written three levels the Brevo version used: the submitted
 * stage is now a batch, so a hand-rolled flattener would silently stop measuring exactly where
 * the new nesting begins.
 */
function keyPaths(value: unknown, prefix = ''): string[] {
	if (value === null || typeof value !== 'object') return [];

	if (Array.isArray(value)) {
		// The index path itself is emitted too, so an entry that is present but empty still shows
		// up rather than vanishing from the measurement.
		return value.flatMap((entry, i) => [`${prefix}[${i}]`, ...keyPaths(entry, `${prefix}[${i}]`)]);
	}

	return Object.entries(value).flatMap(([key, child]) => {
		const path = prefix ? `${prefix}.${key}` : key;
		return [path, ...keyPaths(child, path)];
	});
}

function bodyKeys(request: ReminderRequest): string[] {
	return keyPaths(request.body).sort();
}

describe('buildReminderRequest', () => {
	it('names the campaign entry trigger on capture', () => {
		// Typed by hand into the Customer.io panel and compared literally there. A rename here
		// without a rename there leaves the campaign armed for an event that never arrives.
		expect(buildReminderRequest('email_captured', PERSON, LANGUAGE).body).toMatchObject({
			batch: [{ action: 'identify' }, { name: 'questionnaire_email_captured' }]
		});
	});

	it('names the campaign exit condition on submission', () => {
		const { body } = buildReminderRequest('submitted', PERSON, LANGUAGE);
		expect(body).toMatchObject({ batch: [{ action: 'identify' }, { name: 'anamnesis_submitted' }] });
	});

	it('sends both stages to the batch endpoint', () => {
		// Both are a batch now: an event cannot carry a person attribute, and the campaign reads
		// the language off the person, so each stage needs an identify beside its event.
		expect(buildReminderRequest('email_captured', PERSON, LANGUAGE).path).toBe('/api/v2/batch');
		expect(buildReminderRequest('submitted', PERSON, LANGUAGE).path).toBe('/api/v2/batch');
	});

	it('sets the language the campaign branches on, on both stages', () => {
		// Both, not only the capture: the two calls are independent, so a lost capture must not
		// leave the profile without the attribute that picks German or English.
		for (const stage of ['email_captured', 'submitted'] as const) {
			const { body } = buildReminderRequest(stage, PERSON, LANGUAGE);
			expect(body.batch[0]).toMatchObject({
				action: 'identify',
				attributes: { [LANGUAGE_ATTRIBUTE]: LANGUAGE }
			});
		}
	});

	it('sets the name and the telephone number under the keys the panel writes, on both stages', () => {
		// snake_case because `{{customer.first_name}}` is what a person types into a template.
		// Both stages for the same reason as the language: a lost capture must not leave a
		// profile the mail cannot greet.
		for (const stage of ['email_captured', 'submitted'] as const) {
			expect(buildReminderRequest(stage, PERSON, LANGUAGE).body.batch[0]).toMatchObject({
				attributes: {
					[FIRST_NAME_ATTRIBUTE]: 'Jonas',
					[LAST_NAME_ATTRIBUTE]: 'Weber',
					[PHONE_ATTRIBUTE]: '+49 170 1234567'
				}
			});
		}
	});

	it('omits an unanswered detail rather than sending it empty', () => {
		// An empty `first_name` renders "Hallo ," where an absent one lets the template fall back,
		// and the phone is optional in the questionnaire itself.
		const keys = bodyKeys(buildReminderRequest('email_captured', WITHOUT_PHONE, LANGUAGE));

		expect(keys).toContain(`batch[0].attributes.${FIRST_NAME_ATTRIBUTE}`);
		expect(keys).not.toContain(`batch[0].attributes.${PHONE_ATTRIBUTE}`);
		expect(bodyKeys(buildReminderRequest('email_captured', { email: EMAIL }, LANGUAGE))).toEqual(
			[
				'batch',
				'batch[0]',
				'batch[0].action',
				'batch[0].attributes',
				`batch[0].attributes.${LANGUAGE_ATTRIBUTE}`,
				'batch[0].identifiers',
				'batch[0].identifiers.email',
				'batch[0].type',
				'batch[1]',
				'batch[1].action',
				'batch[1].identifiers',
				'batch[1].identifiers.email',
				'batch[1].name',
				'batch[1].type'
			].sort()
		);
	});

	it('identifies the person by the address alone', () => {
		// The name is an attribute, never an identifier: Customer.io would treat a second
		// identifier as a different person and the campaign would lose the one it enrolled.
		const { body } = buildReminderRequest('email_captured', PERSON, LANGUAGE);
		for (const entry of body.batch) expect(entry.identifiers).toEqual({ email: EMAIL });
	});

	it('marks the person completed only on the way out', () => {
		expect(buildReminderRequest('submitted', PERSON, LANGUAGE).body.batch[0]).toMatchObject({
			attributes: { [COMPLETED_ATTRIBUTE]: true }
		});
		expect(bodyKeys(buildReminderRequest('email_captured', PERSON, LANGUAGE))).not.toContain(
			`batch[0].attributes.${COMPLETED_ATTRIBUTE}`
		);
	});

	it('identifies before it fires the event, so the attributes are set when it is evaluated', () => {
		for (const stage of ['email_captured', 'submitted'] as const) {
			const { body } = buildReminderRequest(stage, PERSON, LANGUAGE);
			expect(body.batch.map((entry) => entry.action)).toEqual(['identify', 'event']);
		}
	});

	/**
	 * The privacy boundary, asserted as an exact key set rather than an absence check, so a
	 * newly added field fails here instead of travelling. This is a medical funnel: no answer,
	 * no anamnesis uid, no medication or dose may reach the reminder processor.
	 *
	 * The contact details a person types into `your-details` do travel, from 2026-09-05, and
	 * they are named one by one below for the same reason the rest of the set is.
	 */
	it('sends the capture with exactly the identify and the event, and nothing else', () => {
		expect(bodyKeys(buildReminderRequest('email_captured', PERSON, LANGUAGE))).toEqual(
			[
				'batch',
				'batch[0]',
				'batch[0].action',
				'batch[0].attributes',
				`batch[0].attributes.${FIRST_NAME_ATTRIBUTE}`,
				`batch[0].attributes.${LANGUAGE_ATTRIBUTE}`,
				`batch[0].attributes.${LAST_NAME_ATTRIBUTE}`,
				`batch[0].attributes.${PHONE_ATTRIBUTE}`,
				'batch[0].identifiers',
				'batch[0].identifiers.email',
				'batch[0].type',
				'batch[1]',
				'batch[1].action',
				'batch[1].identifiers',
				'batch[1].identifiers.email',
				'batch[1].name',
				'batch[1].type'
			].sort()
		);
	});

	it('sends the submission with exactly the identify and the event, and nothing else', () => {
		expect(bodyKeys(buildReminderRequest('submitted', PERSON, LANGUAGE))).toEqual(
			[
				'batch',
				'batch[0]',
				'batch[0].action',
				'batch[0].attributes',
				`batch[0].attributes.${COMPLETED_ATTRIBUTE}`,
				`batch[0].attributes.${FIRST_NAME_ATTRIBUTE}`,
				`batch[0].attributes.${LANGUAGE_ATTRIBUTE}`,
				`batch[0].attributes.${LAST_NAME_ATTRIBUTE}`,
				`batch[0].attributes.${PHONE_ATTRIBUTE}`,
				'batch[0].identifiers',
				'batch[0].identifiers.email',
				'batch[0].type',
				'batch[1]',
				'batch[1].action',
				'batch[1].identifiers',
				'batch[1].identifiers.email',
				'batch[1].name',
				'batch[1].type'
			].sort()
		);
	});
});

describe('isReminderStage', () => {
	it('accepts the two stages this app sends', () => {
		expect(isReminderStage('email_captured')).toBe(true);
		expect(isReminderStage('submitted')).toBe(true);
	});

	it('refuses anything else, including the Customer.io event names themselves', () => {
		// The wire format is the stage, not the event name: a caller must not be able to choose
		// which campaign fires by naming its event.
		for (const value of ['anamnesis_submitted', 'Submitted', '', null, undefined, 1, {}]) {
			expect(isReminderStage(value)).toBe(false);
		}
	});
});
