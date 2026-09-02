import { describe, expect, it } from 'vitest';
import {
	CONSENT_COOKIE,
	CONSENT_MAX_AGE_SECONDS,
	mayTrack,
	serializeConsent,
	toDecision
} from './consent';

describe('toDecision', () => {
	it('reads the two decisions back', () => {
		expect(toDecision('granted')).toBe('granted');
		expect(toDecision('denied')).toBe('denied');
	});

	it('treats an absent or unreadable cookie as undecided', () => {
		// Every one of these has to mean "ask again", never "go ahead": a truthy-but-unknown
		// value reaching `mayTrack` as granted is the whole compliance failure in one line.
		for (const value of [undefined, null, '', ' ', 'true', 'yes', 'GRANTED', 'granted ']) {
			expect(toDecision(value)).toBeNull();
		}
	});
});

describe('mayTrack', () => {
	it('tracks on an explicit yes and on nothing else', () => {
		expect(mayTrack('granted')).toBe(true);
		expect(mayTrack('denied')).toBe(false);
		expect(mayTrack(null)).toBe(false);
	});
});

describe('serializeConsent', () => {
	it('scopes the record to the whole site and expires it', () => {
		const cookie = serializeConsent('granted');

		expect(cookie).toContain(`${CONSENT_COOKIE}=granted`);
		expect(cookie).toContain('Path=/');
		expect(cookie).toContain(`Max-Age=${CONSENT_MAX_AGE_SECONDS}`);
		expect(cookie).toContain('SameSite=Lax');
	});

	it('round-trips through the reader', () => {
		const value = serializeConsent('denied').split(';')[0].split('=')[1];

		expect(toDecision(value)).toBe('denied');
	});

	it('omits Secure where there is no https, so the dev server can remember a decision', () => {
		expect(serializeConsent('granted')).not.toContain('Secure');
	});
});
