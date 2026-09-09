import { describe, expect, it } from 'vitest';
import { buildSubmission, classifyStatus, MAX_URLS, refusalReason } from './indexnow';

const ORIGIN = 'https://solean.com';
const KEY = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

describe('buildSubmission', () => {
	it('carries the shape IndexNow documents', () => {
		expect(buildSubmission(ORIGIN, KEY, [`${ORIGIN}/learn`])).toEqual({
			host: 'solean.com',
			key: KEY,
			keyLocation: `${ORIGIN}/${KEY}.txt`,
			urlList: [`${ORIGIN}/learn`]
		});
	});

	it('accepts the origin root itself', () => {
		expect(buildSubmission(ORIGIN, KEY, [`${ORIGIN}/`])?.urlList).toEqual([`${ORIGIN}/`]);
	});

	it('sends nothing when there is nothing to say', () => {
		expect(buildSubmission(ORIGIN, KEY, [])).toBeNull();
	});

	it('collapses a repeated URL rather than submitting it twice', () => {
		expect(buildSubmission(ORIGIN, KEY, [`${ORIGIN}/learn`, `${ORIGIN}/learn`])?.urlList)
			.toEqual([`${ORIGIN}/learn`]);
	});

	// Refusing rather than truncating: an oversized batch means the derivation is wrong, and a
	// silent truncation would hide that while still sending traffic.
	it('refuses an oversized batch instead of truncating it', () => {
		const urls = Array.from({ length: MAX_URLS + 1 }, (_, index) => `${ORIGIN}/p${index}`);

		expect(buildSubmission(ORIGIN, KEY, urls)).toBeNull();
		expect(buildSubmission(ORIGIN, KEY, urls.slice(0, MAX_URLS))?.urlList).toHaveLength(MAX_URLS);
	});

	// One stray URL costs the whole batch a 422, and a batch is only ever built from URLs this
	// app derived, so a mismatch is a bug rather than something to send and hope.
	it.each([
		'https://evil.test/page',
		'https://solean.com.evil.test/page',
		'http://solean.com/page',
		'https://www.solean.com/page',
		'/learn'
	])('refuses the whole batch when it contains %s', (stray) => {
		expect(buildSubmission(ORIGIN, KEY, [`${ORIGIN}/learn`, stray])).toBeNull();
	});
});

describe('classifyStatus', () => {
	// 202 says the key is still being validated, which is the normal answer to the first
	// submission after a key changes. Reading it as a failure would log an error on launch day.
	it.each([200, 202])('reads %s as accepted', (status) => {
		expect(classifyStatus(status)).toBe('accepted');
	});

	it.each([400, 403, 422, 429, 500, 503])('reads %s as refused', (status) => {
		expect(classifyStatus(status)).toBe('refused');
	});
});

describe('refusalReason', () => {
	it.each([
		[400, 'malformed'],
		[403, 'key not valid'],
		[422, 'do not belong'],
		[429, 'rate limited'],
		[500, 'unexpected status 500']
	])('explains %s well enough to act on', (status, fragment) => {
		expect(refusalReason(status)).toContain(fragment);
	});
});
