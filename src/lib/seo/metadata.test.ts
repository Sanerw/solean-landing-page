import { describe, expect, it } from 'vitest';
import { sharingTags, type PageSeo } from './metadata';

const ORIGIN = 'https://solean-web.vercel.app';

const article: PageSeo = {
	title: 'Mounjaro vs Wegovy | Solean',
	description: 'Two treatments compared.',
	type: 'article',
	locale: 'de',
	sharing: {
		canonical: `${ORIGIN}/learn/blog/mounjaro-vs-wegovy`,
		alternates: [
			{ hreflang: 'de', href: `${ORIGIN}/learn/blog/mounjaro-vs-wegovy` },
			{ hreflang: 'en', href: `${ORIGIN}/en/learn/blog/mounjaro-vs-wegovy` },
			{ hreflang: 'x-default', href: `${ORIGIN}/learn/blog/mounjaro-vs-wegovy` }
		]
	}
};

/** The tags as a lookup, since order is not what any of these cases is about. */
function tagged(seo: PageSeo | null) {
	const tags = sharingTags(seo);

	return {
		all: tags,
		get: (key: string) =>
			tags.filter((tag) => (tag.property ?? tag.name) === key).map((tag) => tag.content)
	};
}

describe('sharingTags', () => {
	it('says nothing at all without a configured origin', () => {
		expect(sharingTags({ ...article, sharing: null })).toEqual([]);
		expect(sharingTags(null)).toEqual([]);
		expect(sharingTags(undefined)).toEqual([]);
	});

	it('describes the page with the values the page itself renders', () => {
		const { get } = tagged(article);

		expect(get('og:title')).toEqual(['Mounjaro vs Wegovy | Solean']);
		expect(get('og:description')).toEqual(['Two treatments compared.']);
		expect(get('og:type')).toEqual(['article']);
		expect(get('og:site_name')).toEqual(['Solean']);
	});

	it('points og:url at the canonical, never at anything else', () => {
		expect(tagged(article).get('og:url')).toEqual([
			'https://solean-web.vercel.app/learn/blog/mounjaro-vs-wegovy'
		]);
	});

	it.each([
		['de', 'de_DE', 'en_GB'],
		['en', 'en_GB', 'de_DE']
	] as const)('marks %s as the locale and offers the other', (locale, own, other) => {
		const { get } = tagged({ ...article, locale });

		expect(get('og:locale')).toEqual([own]);
		expect(get('og:locale:alternate')).toEqual([other]);
	});

	// x-default is an hreflang concept and not an Open Graph locale; emitting it would name a
	// territory that does not exist.
	it('never offers x-default or its own locale as an alternate', () => {
		const alternates = tagged(article).get('og:locale:alternate');

		expect(alternates).not.toContain('x-default');
		expect(alternates).not.toContain('de_DE');
	});

	it('offers no alternate locale for a page published in one language', () => {
		const { get } = tagged({ ...article, sharing: { ...article.sharing!, alternates: [] } });

		expect(get('og:locale:alternate')).toEqual([]);
		expect(get('og:locale')).toEqual(['de_DE']);
	});

	it('asks for the small card when the page has no picture to show', () => {
		const { get } = tagged(article);

		expect(get('twitter:card')).toEqual(['summary']);
		expect(get('og:image')).toEqual([]);
	});

	it('asks for the large card, with dimensions, when it does', () => {
		const { get } = tagged({
			...article,
			sharing: {
				...article.sharing!,
				image: { url: `${ORIGIN}/x.jpg`, width: 1200, height: 630, alt: 'A photograph' }
			}
		});

		expect(get('twitter:card')).toEqual(['summary_large_image']);
		expect(get('og:image')).toEqual([`${ORIGIN}/x.jpg`]);
		expect(get('og:image:width')).toEqual(['1200']);
		expect(get('og:image:height')).toEqual(['630']);
		expect(get('og:image:alt')).toEqual(['A photograph']);
	});

	// Preview embeds invisible codepoints in every Sanity string, and a `content` attribute is
	// exactly where one would travel to whatever scrapes the page.
	it('strips the preview source markers from every value it emits', () => {
		const { all } = tagged({
			...article,
			title: 'Mounjaro​⁢ vs Wegovy',
			description: 'Two⁣ treatments compared.',
			sharing: {
				...article.sharing!,
				image: { url: `${ORIGIN}/x.jpg`, width: 1200, height: 630, alt: 'A​ photograph' }
			}
		});

		for (const tag of all) {
			expect(tag.content).not.toMatch(/[​-‍⁠-⁣﻿]/);
		}
	});

	it('names each tag with exactly one of property or name', () => {
		for (const tag of sharingTags(article)) {
			expect(Boolean(tag.property) !== Boolean(tag.name)).toBe(true);
		}
	});

	it('keeps Twitter on name and Open Graph on property, as each spec reads them', () => {
		const tags = sharingTags(article);

		expect(tags.filter((tag) => tag.name).every((tag) => tag.name!.startsWith('twitter:')))
			.toBe(true);
		expect(tags.filter((tag) => tag.property).every((tag) => tag.property!.startsWith('og:')))
			.toBe(true);
	});
});
