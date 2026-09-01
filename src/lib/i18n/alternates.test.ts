import { describe, expect, it } from 'vitest';
import { alternatesFor } from './alternates';

describe('alternatesFor', () => {
	// German is the default locale, so it carries no prefix and English lives under `/en`.
	it('offers both locales for the root', () => {
		expect(alternatesFor('/')).toEqual({
			canonical: '/',
			alternates: [
				{ locale: 'de', href: '/' },
				{ locale: 'en', href: '/en' }
			]
		});
	});

	// The whole reason this module exists: `/en/` answers 308, so an alternate must not name it.
	it('never points at a path that redirects', () => {
		const { alternates } = alternatesFor('/');

		expect(alternates.map((a) => a.href)).not.toContain('/en/');
	});

	it('keeps a deep path and localises it once', () => {
		expect(alternatesFor('/learn/blog/mounjaro-vs-wegovy')).toEqual({
			canonical: '/learn/blog/mounjaro-vs-wegovy',
			alternates: [
				{ locale: 'de', href: '/learn/blog/mounjaro-vs-wegovy' },
				{ locale: 'en', href: '/en/learn/blog/mounjaro-vs-wegovy' }
			]
		});
	});

	// Arriving on the English page must not compound the prefix.
	it('de-localises before it localises', () => {
		expect(alternatesFor('/en/privacy')).toEqual(alternatesFor('/privacy'));
	});

	it('de-localises the English root too', () => {
		expect(alternatesFor('/en')).toEqual(alternatesFor('/'));
	});
});
