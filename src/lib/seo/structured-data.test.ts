import { describe, expect, it } from 'vitest';
import type { PageSeo } from './metadata';
import { structuredData, toJsonLd, type StructuredDataInput } from './structured-data';

const ORIGIN = 'https://solean-web.vercel.app';

const seo: PageSeo = {
	title: 'Mounjaro vs Wegovy | Solean',
	description: 'Two treatments compared.',
	type: 'article',
	locale: 'de',
	sharing: {
		canonical: `${ORIGIN}/learn/blog/mounjaro-vs-wegovy`,
		alternates: [],
		image: { url: `${ORIGIN}/hero.jpg`, width: 1200, height: 630, alt: 'A hero' }
	}
};

function graph(input: Partial<StructuredDataInput> = {}) {
	const result = structuredData({ seo, origin: ORIGIN, ...input });

	return {
		raw: result,
		nodes: (result?.['@graph'] ?? []) as Record<string, unknown>[],
		of: (type: string) =>
			((result?.['@graph'] ?? []) as Record<string, unknown>[]).find(
				(node) => node['@type'] === type
			)
	};
}

describe('structuredData', () => {
	it('says nothing without a configured origin, as every other absolute value does', () => {
		expect(structuredData({ seo: { ...seo, sharing: null }, origin: ORIGIN })).toBeNull();
	});

	it('is one graph, so the article can name its publisher rather than restate it', () => {
		const { raw, of } = graph({ article: article() });

		expect(raw?.['@context']).toBe('https://schema.org');
		expect(of('Article')?.publisher).toEqual({ '@id': `${ORIGIN}/#organization` });
	});

	describe('Organization', () => {
		it('is present on every page and carries only what the footer prints', () => {
			const organization = graph().of('Organization');

			expect(organization).toEqual({
				'@type': 'Organization',
				'@id': `${ORIGIN}/#organization`,
				name: 'Solean',
				url: `${ORIGIN}/`,
				contactPoint: {
					'@type': 'ContactPoint',
					contactType: 'customer support',
					email: 'support@solean.com',
					telephone: '+49 40 87709420'
				}
			});
		});

		// The footer's social links are placeholders and no raster logo exists, so claiming
		// either would be inventing a fact the page does not carry.
		it('claims no logo and no social profiles', () => {
			const organization = graph().of('Organization')!;

			expect(organization).not.toHaveProperty('logo');
			expect(organization).not.toHaveProperty('sameAs');
			expect(organization).not.toHaveProperty('aggregateRating');
		});
	});

	describe('Article', () => {
		it('is absent unless the page is one', () => {
			expect(graph().of('Article')).toBeUndefined();
		});

		it('carries the headline without the site suffix the title wears', () => {
			expect(graph({ article: article() }).of('Article')).toMatchObject({
				headline: 'Mounjaro vs Wegovy',
				inLanguage: 'de',
				mainEntityOfPage: `${ORIGIN}/learn/blog/mounjaro-vs-wegovy`,
				image: [`${ORIGIN}/hero.jpg`]
			});
		});

		it('credits the reviewer the page credits', () => {
			expect(graph({ article: article({ reviewer: 'Dr. A. Beispiel' }) }).of('Article'))
				.toMatchObject({ reviewedBy: { '@type': 'Person', name: 'Dr. A. Beispiel' } });
		});

		it.each(['published', 'modified', 'reviewer'] as const)('omits %s when absent', (field) => {
			const node = graph({ article: article({ [field]: undefined }) }).of('Article')!;
			const key = { published: 'datePublished', modified: 'dateModified', reviewer: 'reviewedBy' }[field];

			expect(node).not.toHaveProperty(key);
		});

		it('carries no image key at all when the article has no photograph', () => {
			const node = structuredData({
				seo: { ...seo, sharing: { ...seo.sharing!, image: undefined } },
				origin: ORIGIN,
				article: article()
			})!;

			expect((node['@graph'] as Record<string, unknown>[])[1]).not.toHaveProperty('image');
		});
	});

	describe('BreadcrumbList', () => {
		it('is absent when the page draws no trail', () => {
			expect(graph().of('BreadcrumbList')).toBeUndefined();
			expect(graph({ breadcrumb: [] }).of('BreadcrumbList')).toBeUndefined();
		});

		/**
		 * The treatment page draws "Treatments" as text rather than a link, because that index
		 * does not exist yet. Markup that gave it a URL would send a crawler to the 404 the
		 * visible page deliberately avoids.
		 */
		it('gives no URL to a step the page itself does not link', () => {
			const crumbs = graph({
				breadcrumb: [
					{ name: 'Home', path: '/' },
					{ name: 'Treatments' },
					{ name: 'Mounjaro Injection', path: '/treatments/mounjaro' }
				]
			}).of('BreadcrumbList')!.itemListElement as Record<string, unknown>[];

			expect(crumbs.map((crumb) => crumb.position)).toEqual([1, 2, 3]);
			expect(crumbs[1]).toEqual({ '@type': 'ListItem', position: 2, name: 'Treatments' });
			expect(crumbs[1]).not.toHaveProperty('item');
			expect(crumbs[2]).toHaveProperty('item', `${ORIGIN}/treatments/mounjaro`);
		});

		it('localises every step, so an English page never links a German trail', () => {
			const crumbs = (locale: PageSeo['locale']) =>
				(structuredData({
					seo: { ...seo, locale },
					origin: ORIGIN,
					breadcrumb: [{ name: 'Home', path: '/' }, { name: 'Journal', path: '/learn' }]
				})!['@graph'] as Record<string, unknown>[])
					.find((node) => node['@type'] === 'BreadcrumbList')!
					.itemListElement as Record<string, unknown>[];

			expect(crumbs('de').map((crumb) => crumb.item))
				.toEqual([`${ORIGIN}/`, `${ORIGIN}/learn`]);
			expect(crumbs('en').map((crumb) => crumb.item))
				.toEqual([`${ORIGIN}/en`, `${ORIGIN}/en/learn`]);
		});
	});

	it('strips the preview source markers from every string it emits', () => {
		const serialised = JSON.stringify(
			graph({
				article: article({ headline: 'Moun​jaro⁢', reviewer: 'Dr.​ A' }),
				breadcrumb: [{ name: 'Ho​me', path: '/' }]
			}).raw
		);

		expect(serialised).not.toMatch(/[​-‍⁠-⁣﻿]/);
	});
});

describe('toJsonLd', () => {
	it('says nothing when there is no graph', () => {
		expect(toJsonLd(null)).toBeNull();
	});

	/**
	 * The failure this prevents is script injection through the CMS: an editor types
	 * `</script>` into a summary and the rest of the document is parsed as markup.
	 */
	it('cannot be escaped from by an editor typing a closing script tag', () => {
		const json = toJsonLd(
			structuredData({
				seo,
				origin: ORIGIN,
				article: article({
					headline: '</script><img src=x onerror=alert(1)>',
					description: 'a < b & c > d'
				})
			})
		)!;

		expect(json).not.toContain('</script>');
		expect(json).not.toContain('<img');
		expect(json).not.toContain('<');
		expect(json).not.toContain('>');
		expect(json).not.toContain('&');
	});

	it('stays valid JSON that parses back to exactly what went in', () => {
		const input = structuredData({
			seo,
			origin: ORIGIN,
			article: article({ headline: '</script> & <b>' })
		});

		expect(JSON.parse(toJsonLd(input)!)).toEqual(input);
	});

	it.each([
		['\u2028', 'line separator'],
		['\u2029', 'paragraph separator']
	])('escapes the %s, which is legal JSON and illegal JavaScript', (character) => {
		const json = toJsonLd(
			structuredData({ seo, origin: ORIGIN, article: article({ headline: `a${character}b` }) })
		)!;

		expect(json).not.toContain(character);
		expect(JSON.parse(json)).toBeTruthy();
	});
});

function article(overrides: Partial<import('./structured-data').ArticleFacts> = {}) {
	return {
		headline: 'Mounjaro vs Wegovy',
		description: 'Two treatments compared.',
		published: '2026-08-14',
		modified: '2026-09-08T20:30:47Z',
		reviewer: 'Dr. A. Beispiel',
		...overrides
	};
}
