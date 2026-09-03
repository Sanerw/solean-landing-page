import { describe, expect, it } from 'vitest';
import {
	COMPLETED_ATTRIBUTE,
	buildReminderRequest,
	isReminderStage,
	type ReminderRequest
} from './payload';

const EMAIL = 'jonas@example.com';

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
		expect(buildReminderRequest('email_captured', EMAIL).body).toMatchObject({
			name: 'questionnaire_email_captured'
		});
	});

	it('names the campaign exit condition on submission', () => {
		const { body } = buildReminderRequest('submitted', EMAIL);
		expect(body).toMatchObject({ batch: [{ action: 'identify' }, { name: 'anamnesis_submitted' }] });
	});

	it('sends the capture to the entity endpoint and the submission to the batch endpoint', () => {
		// The two stages are different shapes because an event cannot carry a person attribute,
		// so the path is part of what the builder decides rather than a caller's guess.
		expect(buildReminderRequest('email_captured', EMAIL).path).toBe('/api/v2/entity');
		expect(buildReminderRequest('submitted', EMAIL).path).toBe('/api/v2/batch');
	});

	it('identifies the person by the address alone', () => {
		expect(buildReminderRequest('email_captured', EMAIL).body).toMatchObject({
			identifiers: { email: EMAIL }
		});
	});

	it('marks the person completed only on the way out', () => {
		const { body } = buildReminderRequest('submitted', EMAIL);
		const identify = 'batch' in body ? body.batch[0] : undefined;

		expect(identify).toMatchObject({ attributes: { [COMPLETED_ATTRIBUTE]: true } });
		expect(bodyKeys(buildReminderRequest('email_captured', EMAIL))).not.toContain('attributes');
	});

	it('identifies before it fires the event, so the marker is set when the exit is evaluated', () => {
		const { body } = buildReminderRequest('submitted', EMAIL);
		const actions = 'batch' in body ? body.batch.map((entry) => entry.action) : [];

		expect(actions).toEqual(['identify', 'event']);
	});

	/**
	 * The privacy boundary, asserted as an exact key set rather than an absence check, so a
	 * newly added field fails here instead of travelling. This is a medical funnel: no answer,
	 * no anamnesis uid, no medication or dose, no name, no telephone number may reach the
	 * reminder processor.
	 */
	it('sends the capture with exactly four keys and nothing else', () => {
		expect(bodyKeys(buildReminderRequest('email_captured', EMAIL))).toEqual([
			'action',
			'identifiers',
			'identifiers.email',
			'name',
			'type'
		]);
	});

	it('sends the submission with exactly the identify and the event, and nothing else', () => {
		expect(bodyKeys(buildReminderRequest('submitted', EMAIL))).toEqual(
			[
				'batch',
				'batch[0]',
				'batch[0].action',
				'batch[0].attributes',
				`batch[0].attributes.${COMPLETED_ATTRIBUTE}`,
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
