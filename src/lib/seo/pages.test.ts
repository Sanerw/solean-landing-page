import { describe, expect, it } from 'vitest';
import { findIdentity, localePath, pathFor, toPageIdentities, type RawInventory } from './pages';

const home = [
	{ language: 'de', _updatedAt: '2026-09-01T10:00:00Z' },
	{ language: 'en', _updatedAt: '2026-09-01T11:00:00Z' }
];

function identities(raw: RawInventory) {
	return toPageIdentities(raw);
}

describe('localePath', () => {
	it.each([
		['/', 'de', '/'],
		['/', 'en', '/en'],
		['/learn/blog/x', 'de', '/learn/blog/x'],
		['/learn/blog/x', 'en', '/en/learn/blog/x']
	] as const)('localises %s for %s', (path, locale, expected) => {
		expect(localePath(path, locale)).toBe(expected);
	});

	it('never names a path the server answers with a redirect', () => {
		for (const locale of ['de', 'en'] as const) {
			expect(localePath('/', locale)).not.toMatch(/.\/$/);
		}
	});
});

describe('pathFor', () => {
	it.each([
		[{ kind: 'home' } as const, '/'],
		[{ kind: 'journal' } as const, '/learn'],
		[{ kind: 'article', slug: 'a-b' } as const, '/learn/blog/a-b'],
		[{ kind: 'treatment', slug: 'wegovy-pill' } as const, '/treatments/wegovy-pill'],
		[{ kind: 'legal', slug: 'legal-notice' } as const, '/legal-notice']
	])('addresses %o', (key, expected) => {
		expect(pathFor(key)).toBe(expected);
	});
});

describe('toPageIdentities', () => {
	it('survives an empty or absent response without inventing pages', () => {
		expect(toPageIdentities(null).filter((page) => page.id !== 'journal')).toEqual([]);
		expect(toPageIdentities({}).filter((page) => page.id !== 'journal')).toEqual([]);
	});

	it('pairs the home page in both published languages', () => {
		const pages = identities({ home });
		const german = findIdentity(pages, { kind: 'home' }, 'de');

		expect(german).toMatchObject({ path: '/', language: 'de', modifiedAt: '2026-09-01T10:00:00Z' });
		expect(german?.equivalents).toEqual([
			{ locale: 'de', path: '/' },
			{ locale: 'en', path: '/' }
		]);
	});

	it('offers no English home page when only the German document is published', () => {
		const pages = identities({ home: [{ language: 'de' }] });

		expect(findIdentity(pages, { kind: 'home' }, 'en')).toBeNull();
		expect(findIdentity(pages, { kind: 'home' }, 'de')?.equivalents).toEqual([
			{ locale: 'de', path: '/' }
		]);
	});

	it('links two articles only through the translation metadata', () => {
		const pages = identities({
			articles: [
				{
					language: 'de',
					slug: 'mounjaro-vs-wegovy',
					translations: [
						{ locale: 'de', slug: 'mounjaro-vs-wegovy' },
						{ locale: 'en', slug: 'mounjaro-versus-wegovy' }
					]
				},
				{
					language: 'en',
					slug: 'mounjaro-versus-wegovy',
					translations: [
						{ locale: 'de', slug: 'mounjaro-vs-wegovy' },
						{ locale: 'en', slug: 'mounjaro-versus-wegovy' }
					]
				}
			]
		});

		expect(findIdentity(pages, { kind: 'article', slug: 'mounjaro-vs-wegovy' }, 'de')?.equivalents)
			.toEqual([
				{ locale: 'de', path: '/learn/blog/mounjaro-vs-wegovy' },
				{ locale: 'en', path: '/learn/blog/mounjaro-versus-wegovy' }
			]);
	});

	// The dataset holds exactly this: two documents with one slug and no metadata between them.
	it('does not treat a matching slug as a translation', () => {
		const pages = identities({
			articles: [
				{ language: 'de', slug: 'bmi-27-oder-30' },
				{ language: 'en', slug: 'bmi-27-oder-30' }
			]
		});

		expect(findIdentity(pages, { kind: 'article', slug: 'bmi-27-oder-30' }, 'de')?.equivalents)
			.toEqual([{ locale: 'de', path: '/learn/blog/bmi-27-oder-30' }]);
	});

	it('drops a translation whose target is not published', () => {
		const pages = identities({
			articles: [
				{
					language: 'de',
					slug: 'nur-deutsch',
					translations: [
						{ locale: 'en', slug: null },
						{ locale: 'en', slug: 'never-published' },
						{ locale: 'fr', slug: 'pas-publie' }
					]
				}
			]
		});

		expect(findIdentity(pages, { kind: 'article', slug: 'nur-deutsch' }, 'de')?.equivalents)
			.toEqual([{ locale: 'de', path: '/learn/blog/nur-deutsch' }]);
	});

	it('dates the Journal from its newest article rather than the request', () => {
		const pages = identities({
			articles: [
				{ language: 'de', slug: 'a', _updatedAt: '2026-09-01T00:00:00Z' },
				{ language: 'de', slug: 'b', _updatedAt: '2026-09-07T00:00:00Z' },
				{ language: 'en', slug: 'c', _updatedAt: '2026-08-01T00:00:00Z' }
			]
		});

		expect(findIdentity(pages, { kind: 'journal' }, 'de')?.modifiedAt).toBe('2026-09-07T00:00:00Z');
		expect(findIdentity(pages, { kind: 'journal' }, 'en')?.modifiedAt).toBe('2026-08-01T00:00:00Z');
	});

	it('leaves an empty Journal undated', () => {
		expect(findIdentity(identities({}), { kind: 'journal' }, 'de')?.modifiedAt).toBeUndefined();
	});

	it('refuses a treatment the catalogue does not sell', () => {
		const pages = identities({
			treatments: [
				{ treatmentId: 'wegovy-pill', language: 'de' },
				{ treatmentId: 'wegovy-pill', language: 'en' },
				{ treatmentId: 'invented-by-an-editor', language: 'de' }
			]
		});

		expect(findIdentity(pages, { kind: 'treatment', slug: 'wegovy-pill' }, 'en')?.equivalents)
			.toEqual([
				{ locale: 'de', path: '/treatments/wegovy-pill' },
				{ locale: 'en', path: '/treatments/wegovy-pill' }
			]);
		expect(findIdentity(pages, { kind: 'treatment', slug: 'invented-by-an-editor' }, 'de'))
			.toBeNull();
	});

	// The spec's own case: a German-only policy must not be offered as an English page because
	// the navigation around it is translated.
	it('does not invent an English policy document', () => {
		const pages = identities({
			legal: [
				{ slug: 'legal-notice', language: 'de' },
				{ slug: 'privacy', language: 'de' },
				{ slug: 'privacy', language: 'en' }
			]
		});

		expect(findIdentity(pages, { kind: 'legal', slug: 'legal-notice' }, 'en')).toBeNull();
		expect(findIdentity(pages, { kind: 'legal', slug: 'legal-notice' }, 'de')?.equivalents)
			.toEqual([{ locale: 'de', path: '/legal-notice' }]);
		expect(findIdentity(pages, { kind: 'legal', slug: 'privacy' }, 'de')?.equivalents)
			.toHaveLength(2);
	});

	it('ignores a slug that is not one of the four policy routes', () => {
		const pages = identities({ legal: [{ slug: 'cookie-policy', language: 'de' }] });

		expect(findIdentity(pages, { kind: 'legal', slug: 'cookie-policy' }, 'de')).toBeNull();
	});

	it.each([undefined, null, '', 'not a date'])('drops the unusable timestamp %s', (value) => {
		const pages = identities({ home: [{ language: 'de', _updatedAt: value }] });

		expect(findIdentity(pages, { kind: 'home' }, 'de')?.modifiedAt).toBeUndefined();
	});

	it('ignores documents in a language this site does not serve', () => {
		const pages = identities({
			home: [...home, { language: 'fr' }],
			legal: [{ slug: 'privacy', language: 'fr' }]
		});

		expect(pages.filter((page) => page.id === 'home')).toHaveLength(2);
		expect(pages.filter((page) => page.id === 'legal:privacy')).toHaveLength(0);
	});
});
