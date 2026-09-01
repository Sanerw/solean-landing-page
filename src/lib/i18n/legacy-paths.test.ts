import { describe, expect, it } from 'vitest';
import { legacyGermanPath } from './legacy-paths';

describe('legacyGermanPath', () => {
	it('sends the old German root to the new one', () => {
		expect(legacyGermanPath('/de')).toBe('/');
		expect(legacyGermanPath('/de/')).toBe('/');
	});

	it('keeps the rest of the path', () => {
		expect(legacyGermanPath('/de/privacy')).toBe('/privacy');
		expect(legacyGermanPath('/de/learn/blog/mounjaro-vs-wegovy')).toBe(
			'/learn/blog/mounjaro-vs-wegovy'
		);
	});

	// The trap this function exists to avoid: a path that merely starts with the same letters.
	it.each(['/dentist', '/de-facto', '/design-system', '/deals/de'])('leaves %s alone', (path) => {
		expect(legacyGermanPath(path)).toBeNull();
	});

	it('leaves the new paths alone', () => {
		expect(legacyGermanPath('/')).toBeNull();
		expect(legacyGermanPath('/privacy')).toBeNull();
		expect(legacyGermanPath('/en/privacy')).toBeNull();
	});
});
