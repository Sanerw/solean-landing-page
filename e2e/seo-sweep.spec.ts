import { expect, test, type APIRequestContext } from '@playwright/test';

/**
 * One sweep over every public page, held to the rules that must be true of all of them.
 *
 * The URL list comes from `/sitemap.xml` at run time rather than from an array in this file.
 * That coupling is deliberate: the sitemap is the site's own claim about what exists, so the
 * sweep tests the claim. A page added later is covered without editing this spec, and a page
 * the sitemap forgets fails the other specs instead.
 *
 * It runs against the launched server, because the pre-launch sitemap is empty by design.
 */

interface PageFacts {
	url: string;
	titles: string[];
	descriptions: string[];
	headings: number;
	canonical: string | undefined;
	jsonLd: string | undefined;
	imagesWithoutAlt: string[];
}

function textOf(html: string, pattern: RegExp): string[] {
	return [...html.matchAll(pattern)].map((match) => match[1]);
}

/**
 * `alt=""` is a correct answer, not a missing one: it marks an image as decorative for a screen
 * reader. What this looks for is the attribute being absent altogether.
 */
function imagesWithoutAlt(html: string): string[] {
	return [...html.matchAll(/<img\b[^>]*>/g)]
		.map((match) => match[0])
		.filter((tag) => !/\salt\s*=/.test(tag));
}

async function factsFor(request: APIRequestContext, url: string): Promise<PageFacts> {
	const response = await request.get(url);
	expect(response.status(), `${url} is listed in the sitemap and must answer 200`).toBe(200);
	const html = await response.text();

	return {
		url,
		titles: textOf(html, /<title>([\s\S]*?)<\/title>/g),
		descriptions: textOf(html, /<meta\s+name="description"\s+content="([^"]*)"/g),
		headings: [...html.matchAll(/<h1\b/g)].length,
		canonical: html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/)?.[1],
		jsonLd: html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1],
		imagesWithoutAlt: imagesWithoutAlt(html)
	};
}

async function sweep(request: APIRequestContext): Promise<PageFacts[]> {
	const sitemap = await request.get('/sitemap.xml');
	expect(sitemap.status()).toBe(200);

	const urls = [...(await sitemap.text()).matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
	expect(urls.length, 'the launched sitemap should list every public page').toBeGreaterThan(0);

	return Promise.all(urls.map((url) => factsFor(request, url)));
}

/**
 * Collected once. Each test below reads the same sweep rather than re-fetching twenty pages,
 * and a failure names every offending page instead of only the first.
 */
let pages: PageFacts[];

test.beforeAll(async ({ playwright }) => {
	const request = await playwright.request.newContext({ baseURL: 'http://localhost:4174' });
	try {
		pages = await sweep(request);
	} finally {
		await request.dispose();
	}
});

function offenders(predicate: (page: PageFacts) => boolean): string[] {
	return pages.filter(predicate).map((page) => page.url);
}

test.describe('every public page', () => {
	test('has exactly one non-empty title', () => {
		expect(offenders((page) => page.titles.length !== 1)).toEqual([]);
		expect(offenders((page) => !page.titles[0]?.trim())).toEqual([]);
	});

	test('has exactly one non-empty description', () => {
		expect(offenders((page) => page.descriptions.length !== 1)).toEqual([]);
		expect(offenders((page) => !page.descriptions[0]?.trim())).toEqual([]);
	});

	// One h1 per document. These live in child components, so no source-level check can see
	// a page that renders none or two.
	test('has exactly one h1', () => {
		expect(offenders((page) => page.headings !== 1)).toEqual([]);
	});

	test('canonicalises to the URL the sitemap named', () => {
		expect(offenders((page) => page.canonical !== page.url)).toEqual([]);
	});

	test('carries structured data that parses', () => {
		expect(offenders((page) => !page.jsonLd)).toEqual([]);
		expect(
			offenders((page) => {
				try {
					JSON.parse(page.jsonLd!);

					return false;
				} catch {
					return true;
				}
			})
		).toEqual([]);
	});

	// `alt=""` is a correct answer for a decorative image. An absent attribute is not.
	test('gives every image an alt attribute', () => {
		const failures = pages
			.filter((page) => page.imagesWithoutAlt.length > 0)
			.map((page) => `${page.url}: ${page.imagesWithoutAlt.join(' ')}`);

		expect(failures).toEqual([]);
	});
});

/**
 * Properties of the set rather than of a page, which is why no per-page test can see them.
 * Two pages sharing a title compete for the same query and a search engine picks one.
 *
 * **Within a language, not across.** A page and its translation are expected to share a title
 * where the title is a product name: `title_treatment` is `{name} | Solean` in both
 * catalogues, so `/treatments/mounjaro` and `/en/treatments/mounjaro` both read "Mounjaro
 * Injection | Solean". That is not duplication a search engine has to resolve, because the two
 * declare each other as `hreflang` alternates. The first run of this sweep failed on exactly
 * those three pairs, and the assertion was wrong rather than the site.
 */
test.describe('within one language', () => {
	function duplicates(values: string[]): string[] {
		const seen = new Set<string>();

		return [...new Set(values.filter((value) => seen.size === seen.add(value).size))];
	}

	/** The prefix is the language, which is the whole of this site's locale routing. */
	function inLanguage(locale: 'de' | 'en'): PageFacts[] {
		const english = (page: PageFacts) => new URL(page.url).pathname.match(/^\/en(\/|$)/);

		return pages.filter((page) => Boolean(english(page)) === (locale === 'en'));
	}

	for (const locale of ['de', 'en'] as const) {
		test(`no two ${locale} pages share a title`, () => {
			const group = inLanguage(locale);

			expect(group.length).toBeGreaterThan(0);
			expect(duplicates(group.map((page) => page.titles[0]))).toEqual([]);
		});

		test(`no two ${locale} pages share a description`, () => {
			expect(duplicates(inLanguage(locale).map((page) => page.descriptions[0]))).toEqual([]);
		});
	}
});
