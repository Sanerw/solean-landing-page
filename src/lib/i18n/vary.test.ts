import { describe, expect, it } from 'vitest';
import { variesBy } from './vary';

const url = (path: string) => new URL(`https://solean.com${path}`);

describe('variesBy', () => {
	it('names both headers on an address that names no language', () => {
		// `entryRedirect` reads Accept-Language here, and the cookie strategy can redirect too.
		expect(variesBy(url('/'))).toBe('Accept-Language, Cookie');
		expect(variesBy(url('/treatments/mounjaro'))).toBe('Accept-Language, Cookie');
	});

	it('names the cookie alone on an address that names its language', () => {
		// A remembered German still bounces off `/en/...`, so the cookie is part of the answer.
		// Accept-Language is not: naming it would split the cache per browser language string
		// for a page whose content never changes with it.
		expect(variesBy(url('/en'))).toBe('Cookie');
		expect(variesBy(url('/en/learn/blog/mounjaro-vs-wegovy'))).toBe('Cookie');
	});
});
