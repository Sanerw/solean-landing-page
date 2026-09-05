import { describe, expect, it } from 'vitest';
import { readReminderRequest } from './validate';

const EMAIL = 'jonas@example.com';

describe('readReminderRequest', () => {
	it('accepts the two stages the questionnaire sends', () => {
		expect(readReminderRequest({ stage: 'email_captured', email: EMAIL, language: 'en' })).toEqual({
			ok: true,
			stage: 'email_captured',
			person: { email: EMAIL },
			language: 'en'
		});
		expect(readReminderRequest({ stage: 'submitted', email: EMAIL, language: 'de' }).ok).toBe(true);
	});

	it('reads the name and the telephone number, trimmed', () => {
		expect(
			readReminderRequest({
				stage: 'email_captured',
				email: EMAIL,
				firstName: '  Jonas ',
				lastName: 'Weber',
				phone: ' +49 170 1234567 ',
				language: 'de'
			})
		).toMatchObject({
			person: {
				email: EMAIL,
				firstName: 'Jonas',
				lastName: 'Weber',
				phone: '+49 170 1234567'
			}
		});
	});

	it('drops an unusable detail rather than refusing the call', () => {
		// The address is the identifier and a call without one is meaningless, so it is the only
		// field worth a 400. A name that arrives empty, oversized, of the wrong type, or carrying
		// a control character costs a greeting; refusing would cost the reminder itself.
		const parsed = readReminderRequest({
			stage: 'email_captured',
			email: EMAIL,
			firstName: '   ',
			lastName: 'W'.repeat(101),
			phone: { number: '+4917012345' },
			language: 'de'
		});

		expect(parsed).toMatchObject({ ok: true, person: { email: EMAIL } });
		expect(parsed.ok && Object.values(parsed.person).filter(Boolean)).toEqual([EMAIL]);
	});

	it('drops a detail carrying a control character', () => {
		// Nothing downstream is line-based, and a name is not a place to find out otherwise.
		expect(
			readReminderRequest({
				stage: 'submitted',
				email: EMAIL,
				firstName: 'Jonas\nBcc: someone@else.com',
				lastName: 'Weber'
			})
		).toMatchObject({ person: { firstName: undefined, lastName: 'Weber' } });
	});

	it('keeps a name at the cap and an unusual one', () => {
		const parsed = readReminderRequest({
			stage: 'submitted',
			email: EMAIL,
			firstName: 'J'.repeat(100),
			lastName: "O'Brien-Müller"
		});

		expect(parsed).toMatchObject({
			person: { firstName: 'J'.repeat(100), lastName: "O'Brien-Müller" }
		});
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
		expect(
			readReminderRequest({ stage: 'submitted', email: `  ${EMAIL}  `, language: 'de' })
		).toEqual({ ok: true, stage: 'submitted', person: { email: EMAIL }, language: 'de' });
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
