import { describe, expect, it } from 'vitest';
import { readReminderRequest } from './validate';

const EMAIL = 'jonas@example.com';

describe('readReminderRequest', () => {
	it('accepts the two stages the questionnaire sends', () => {
		expect(readReminderRequest({ stage: 'email_captured', email: EMAIL, language: 'en' })).toEqual({
			ok: true,
			stage: 'email_captured',
			email: EMAIL,
			language: 'en'
		});
		expect(readReminderRequest({ stage: 'submitted', email: EMAIL, language: 'de' }).ok).toBe(true);
	});

	it('refuses a stage that names a Customer.io event instead', () => {
		// Otherwise the caller, not this app, would decide which automation fires.
		expect(readReminderRequest({ stage: 'anamnesis_submitted', email: EMAIL })).toEqual({
			ok: false,
			reason: 'bad-stage'
		});
	});

	it('refuses a missing or malformed body', () => {
		for (const body of [null, undefined, 'stage=submitted', 42, [], {}]) {
			expect(readReminderRequest(body).ok).toBe(false);
		}
	});

	it('trims an address before using it', () => {
		expect(readReminderRequest({ stage: 'submitted', email: `  ${EMAIL}  `, language: 'de' })).toEqual(
			{ ok: true, stage: 'submitted', email: EMAIL, language: 'de' }
		);
	});

	it('falls back to the base locale rather than refusing an unusable language', () => {
		// A rejection would cost the reminder itself, and only a locale this site is built with
		// can leave the app either way, so nothing hostile travels by being lenient here.
		for (const language of [undefined, '', 'fr', 'DE', 'de-DE', 42, null, {}, '<script>']) {
			const parsed = readReminderRequest({ stage: 'submitted', email: EMAIL, language });
			expect(parsed, String(language)).toMatchObject({ ok: true, language: 'de' });
		}
	});

	it('refuses anything that is not shaped like an address', () => {
		const bad = [
			'',
			'   ',
			'jonas',
			'jonas@',
			'@example.com',
			'jonas@example',
			'jonas@.com',
			'jonas@example..com',
			'jonas @example.com',
			'jonas@exam ple.com',
			'jonas@example.com\nbcc: someone@else.com'
		];

		for (const email of bad) {
			expect(readReminderRequest({ stage: 'submitted', email }), email).toEqual({
				ok: false,
				reason: 'bad-email'
			});
		}
	});

	it('accepts the unusual but valid addresses a stricter pattern would lose', () => {
		for (const email of ['a@b.co', 'jonas+funnel@example.co.uk', "o'brien@example.de"]) {
			expect(readReminderRequest({ stage: 'submitted', email }), email).toMatchObject({ ok: true });
		}
	});

	it('refuses an address longer than the protocol allows', () => {
		const long = `${'a'.repeat(250)}@example.com`;

		expect(readReminderRequest({ stage: 'submitted', email: long })).toEqual({
			ok: false,
			reason: 'bad-email'
		});
	});
});
