import { describe, expect, it } from 'vitest';
import { affectedPages, urlsToNotify } from './notify-urls';

const ORIGIN = 'https://solean.com';

const publish = (over: Record<string, unknown> = {}) => ({
	type: 'article',
	id: 'abc123',
	slug: 'mounjaro-vs-wegovy',
	language: 'de',
	...over
});

describe('affectedPages', () => {
	it('notifies an article and the index that lists it', () => {
		expect(affectedPages(publish())).toEqual([
			{ kind: 'article', slug: 'mounjaro-vs-wegovy' },
			{ kind: 'journal' }
		]);
	});

	it.each([
		[{ type: 'homePage', slug: null }, [{ kind: 'home' }]],
		[{ type: 'treatment', slug: 'wegovy-pill' }, [{ kind: 'treatment', slug: 'wegovy-pill' }]],
		[{ type: 'legalPage', slug: 'privacy' }, [{ kind: 'legal', slug: 'privacy' }]]
	])('maps %o to its own page', (over, expected) => {
		expect(affectedPages(publish(over))).toEqual(expected);
	});

	// A document with no public page of its own is the common case, not an error.
	it.each(['clinician', 'testimonial', 'treatmentsPage', 'translation.metadata', 'unknownType'])(
		'notifies nothing for a %s',
		(type) => {
			expect(affectedPages(publish({ type }))).toEqual([]);
		}
	);

	it('refuses a draft, whatever the webhook was configured to send', () => {
		expect(affectedPages(publish({ id: 'drafts.abc123' }))).toEqual([]);
	});

	it.each([undefined, null, '', 'fr', 'de-DE', 42])(
		'notifies nothing for the unusable language %s',
		(language) => {
			expect(affectedPages(publish({ language }))).toEqual([]);
		}
	);

	it('refuses a treatment the catalogue does not sell', () => {
		expect(affectedPages(publish({ type: 'treatment', slug: 'invented' }))).toEqual([]);
	});

	it('refuses a legal slug that is not one of the four routes', () => {
		expect(affectedPages(publish({ type: 'legalPage', slug: 'cookies' }))).toEqual([]);
	});

	it.each([undefined, null, '', '   ', 42, {}])('refuses the unusable slug %s', (slug) => {
		expect(affectedPages(publish({ slug }))).toEqual([]);
	});

	it('survives a payload that is nothing like the contract', () => {
		expect(affectedPages({})).toEqual([]);
		expect(affectedPages({ type: {}, id: [], slug: null, language: false })).toEqual([]);
	});
});

describe('urlsToNotify', () => {
	it('addresses the document in its own language', () => {
		expect(urlsToNotify(ORIGIN, publish())).toEqual([
			`${ORIGIN}/learn/blog/mounjaro-vs-wegovy`,
			`${ORIGIN}/learn`
		]);
		expect(urlsToNotify(ORIGIN, publish({ language: 'en' }))).toEqual([
			`${ORIGIN}/en/learn/blog/mounjaro-vs-wegovy`,
			`${ORIGIN}/en/learn`
		]);
	});

	it('addresses the German home page without a trailing slash problem', () => {
		expect(urlsToNotify(ORIGIN, publish({ type: 'homePage' }))).toEqual([`${ORIGIN}/`]);
		expect(urlsToNotify(ORIGIN, publish({ type: 'homePage', language: 'en' })))
			.toEqual([`${ORIGIN}/en`]);
	});

	/**
	 * The property the whole design rests on: a payload cannot name a URL, so no payload can
	 * make this app ask a search engine to crawl somebody else's host.
	 */
	it('cannot be made to name another host', () => {
		for (const slug of [
			'https://evil.test/x',
			'../../../etc/passwd',
			'//evil.test',
			'x?utm=1'
		]) {
			for (const url of urlsToNotify(ORIGIN, publish({ slug }))) {
				expect(new URL(url).origin).toBe(ORIGIN);
			}
		}
	});

	it('changing the origin changes every URL', () => {
		expect(urlsToNotify('https://solean-web.vercel.app', publish())[0])
			.toBe('https://solean-web.vercel.app/learn/blog/mounjaro-vs-wegovy');
	});
});
