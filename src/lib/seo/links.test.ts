import { describe, expect, it } from 'vitest';
import { pageLinks } from './links';
import type { PageIdentity } from './pages';

const origin = 'https://solean-web.vercel.app';

const translated: PageIdentity = {
	id: 'article:x',
	language: 'de',
	path: '/learn/blog/x',
	equivalents: [
		{ locale: 'de', path: '/learn/blog/x' },
		{ locale: 'en', path: '/learn/blog/x-en' }
	]
};

const germanOnly: PageIdentity = {
	id: 'legal:legal-notice',
	language: 'de',
	path: '/legal-notice',
	equivalents: [{ locale: 'de', path: '/legal-notice' }]
};

describe('pageLinks', () => {
	it('says nothing at all without a configured origin', () => {
		expect(pageLinks(null, translated)).toBeNull();
	});

	it('says nothing for a page that is not in the published inventory', () => {
		expect(pageLinks(origin, null)).toBeNull();
	});

	it('makes each language canonical to itself', () => {
		expect(pageLinks(origin, translated)?.canonical)
			.toBe('https://solean-web.vercel.app/learn/blog/x');
		expect(pageLinks(origin, { ...translated, language: 'en', path: '/learn/blog/x-en' })?.canonical)
			.toBe('https://solean-web.vercel.app/en/learn/blog/x-en');
	});

	it('addresses the root without a doubled slash', () => {
		const links = pageLinks(origin, {
			id: 'home',
			language: 'de',
			path: '/',
			equivalents: [
				{ locale: 'de', path: '/' },
				{ locale: 'en', path: '/' }
			]
		});

		expect(links?.canonical).toBe('https://solean-web.vercel.app/');
		expect(links?.alternates.map((link) => link.href)).toEqual([
			'https://solean-web.vercel.app/',
			'https://solean-web.vercel.app/en',
			'https://solean-web.vercel.app/'
		]);
	});

	it('offers absolute reciprocal alternates and an x-default on the base locale', () => {
		expect(pageLinks(origin, translated)?.alternates).toEqual([
			{ hreflang: 'de', href: 'https://solean-web.vercel.app/learn/blog/x' },
			{ hreflang: 'en', href: 'https://solean-web.vercel.app/en/learn/blog/x-en' },
			{ hreflang: 'x-default', href: 'https://solean-web.vercel.app/learn/blog/x' }
		]);
	});

	it('offers no alternate for a page published in one language only', () => {
		const links = pageLinks(origin, germanOnly);

		expect(links?.canonical).toBe('https://solean-web.vercel.app/legal-notice');
		expect(links?.alternates).toEqual([]);
	});

	it('refuses a set that does not name the page it is on', () => {
		expect(
			pageLinks(origin, {
				...translated,
				language: 'en',
				equivalents: [
					{ locale: 'de', path: '/learn/blog/x' },
					{ locale: 'de', path: '/learn/blog/x' }
				]
			})?.alternates
		).toEqual([]);
	});

	it('changing the origin changes every URL it emits', () => {
		const links = pageLinks('https://solean.com', translated);

		expect(links?.canonical).toBe('https://solean.com/learn/blog/x');
		expect(links?.alternates.every((link) => link.href.startsWith('https://solean.com/'))).toBe(true);
	});

	it('cannot carry a tracking parameter, because it is built from the identity', () => {
		const links = pageLinks(origin, translated);

		expect(links?.canonical).not.toContain('?');
		expect(links?.alternates.some((link) => link.href.includes('?'))).toBe(false);
	});
});
