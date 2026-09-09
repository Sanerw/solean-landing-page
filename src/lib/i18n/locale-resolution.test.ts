import { describe, expect, it } from 'vitest';
import { cookieName, shouldRedirect, strategy } from '$lib/paraglide/runtime';
import { entryRedirect, preferredLocale, rememberedLocale } from './entry-locale';

/**
 * The language a visitor gets is decided in two places: Paraglide's strategy, which reads the
 * prefix, and the entry rule, which answers for an address that has none. Both are driven here
 * with real requests and real headers rather than asserted as configuration, because every case
 * below is a row of the behaviour agreed for this fix.
 */

const ORIGIN = 'https://solean.com';

const url = (path: string) => new URL(`${ORIGIN}${path}`);
const german = 'de-DE,de;q=0.9,en;q=0.8';
const english = 'en-GB,en;q=0.9';
const visitor = (options: { reading?: string; browser?: string } = {}) => ({
	cookie: options.reading ? `${cookieName}=${options.reading}` : null,
	acceptLanguage: options.browser ?? null
});

describe('the strategy', () => {
	// `url` has to lead, and its leading is why the entry rule exists: Paraglide's default
	// pattern answers `baseLocale` for an unprefixed path rather than "no locale found", so
	// whichever strategy is first decides every request and leaves the others unreachable.
	it('lets the address decide, and keeps the cookie for `setLocale` to write', () => {
		expect(strategy).toEqual(['url', 'cookie', 'baseLocale']);
	});

	it('leaves an English address alone, whoever asks for it', async () => {
		const decision = await shouldRedirect({
			request: new Request(`${ORIGIN}/en/learn`, { headers: { 'accept-language': german } })
		});

		expect(decision.locale).toBe('en');
		expect(decision.shouldRedirect).toBe(false);
	});
});

describe('an address that names a language', () => {
	// The half a strategy order cannot express: an explicit prefix is the most explicit thing a
	// visitor can send, and neither a browser default nor a language they were reading a moment
	// ago may overrule it. Every `hreflang` alternate the site publishes depends on this.
	it('is never redirected away from', () => {
		expect(entryRedirect(url('/en/learn'), visitor({ browser: german }))).toBeNull();
		expect(entryRedirect(url('/en'), visitor({ reading: 'de', browser: german }))).toBeNull();
	});
});

describe('an address that names none', () => {
	it('stays German for a German browser', () => {
		expect(entryRedirect(url('/'), visitor({ browser: german }))).toBeNull();
	});

	it('moves to /en for any other browser', () => {
		expect(entryRedirect(url('/'), visitor({ browser: english }))?.pathname).toBe('/en');
	});

	// The bug this fix closes: a visitor reading the site in English who follows a link written
	// without a prefix used to be served German, because nothing on the server read the cookie.
	it('follows the language the visitor is already reading', () => {
		const target = entryRedirect(url('/learn'), visitor({ reading: 'en', browser: german }));

		expect(target?.pathname).toBe('/en/learn');
	});

	it('lets that outrank the browser in both directions', () => {
		expect(entryRedirect(url('/'), visitor({ reading: 'de', browser: english }))).toBeNull();
	});

	it('keeps the deep path, and its query', () => {
		const target = entryRedirect(url('/treatments/mounjaro?dose=5'), visitor({ browser: english }));

		expect(target?.pathname).toBe('/en/treatments/mounjaro');
		expect(target?.search).toBe('?dose=5');
	});

	it('stays German for a browser that names no language at all', () => {
		expect(entryRedirect(url('/'), visitor())).toBeNull();
	});
});

describe('the language a visitor is reading', () => {
	it('is read from the cookie `setLocale` writes', () => {
		expect(rememberedLocale(`analytics=no; ${cookieName}=en`)).toBe('en');
	});

	it('is not read from a cookie naming a language this site does not serve', () => {
		expect(rememberedLocale(`${cookieName}=fr`)).toBeUndefined();
		expect(rememberedLocale('OTHER=en')).toBeUndefined();
		expect(rememberedLocale(null)).toBeUndefined();
	});
});

describe('the languages a browser asks for', () => {
	it('takes the best one it offers that this site serves', () => {
		expect(preferredLocale('fr-FR,fr;q=0.9,en;q=0.7')).toBe('en');
		expect(preferredLocale('en;q=0.5,de;q=0.9')).toBe('de');
	});

	it('matches a region tag on its language', () => {
		expect(preferredLocale('de-AT')).toBe('de');
		expect(preferredLocale('en-US,en;q=0.9')).toBe('en');
	});

	it('ignores a language that is offered and then refused', () => {
		expect(preferredLocale('en;q=0')).toBeUndefined();
	});

	it('has no opinion when nothing it serves is asked for', () => {
		expect(preferredLocale('fr-FR,fr;q=0.9')).toBeUndefined();
		expect(preferredLocale('')).toBeUndefined();
		expect(preferredLocale(null)).toBeUndefined();
	});
});
