import { describe, expect, it } from 'vitest';
import { escapeXml, toRobotsTxt, toSitemapXml } from './sitemap';
import type { PageIdentity } from './pages';

const origin = 'https://solean-web.vercel.app';

const home: PageIdentity[] = [
	{
		id: 'home',
		language: 'de',
		path: '/',
		equivalents: [
			{ locale: 'de', path: '/' },
			{ locale: 'en', path: '/' }
		],
		modifiedAt: '2026-09-01T10:30:00Z'
	},
	{
		id: 'home',
		language: 'en',
		path: '/',
		equivalents: [
			{ locale: 'de', path: '/' },
			{ locale: 'en', path: '/' }
		]
	}
];

describe('escapeXml', () => {
	it.each([
		['a & b', 'a &amp; b'],
		['<script>', '&lt;script&gt;'],
		['"quoted"', '&quot;quoted&quot;'],
		["it's", 'it&apos;s']
	])('escapes %s', (value, expected) => {
		expect(escapeXml(value)).toBe(expected);
	});
});

describe('toSitemapXml', () => {
	it('is a well-formed urlset even with nothing published', () => {
		const xml = toSitemapXml(origin, []);

		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(xml).toContain('<urlset');
		expect(xml).toContain('</urlset>');
		expect(xml).not.toContain('<url>');
	});

	it('emits the same canonical the page itself renders', () => {
		const xml = toSitemapXml(origin, home);

		expect(xml).toContain('<loc>https://solean-web.vercel.app/</loc>');
		expect(xml).toContain('<loc>https://solean-web.vercel.app/en</loc>');
	});

	it('carries each page\'s own alternates, including its own language', () => {
		const xml = toSitemapXml(origin, home);

		expect(xml).toContain(
			'<xhtml:link rel="alternate" hreflang="de" href="https://solean-web.vercel.app/" />'
		);
		expect(xml).toContain(
			'<xhtml:link rel="alternate" hreflang="en" href="https://solean-web.vercel.app/en" />'
		);
	});

	it('offers no alternate for a page published in one language only', () => {
		const xml = toSitemapXml(origin, [
			{
				id: 'legal:legal-notice',
				language: 'de',
				path: '/legal-notice',
				equivalents: [{ locale: 'de', path: '/legal-notice' }]
			}
		]);

		expect(xml).toContain('<loc>https://solean-web.vercel.app/legal-notice</loc>');
		expect(xml).not.toContain('xhtml:link');
	});

	it('dates a page from the content, never from the request', () => {
		const xml = toSitemapXml(origin, home);

		expect(xml).toContain('<lastmod>2026-09-01</lastmod>');
		// The English home page carries no stamp, so it gets no element rather than today's date.
		expect(xml.match(/<lastmod>/g)).toHaveLength(1);
	});

	it.each(['', 'yesterday', '2026-13-45'])('omits the unusable stamp %s', (modifiedAt) => {
		expect(toSitemapXml(origin, [{ ...home[0], modifiedAt }])).not.toContain('<lastmod>');
	});

	// Two layers, and both are load-bearing: URL construction percent-encodes what is not legal
	// in a path, and the XML escape catches the ampersand, which is legal in a URL and fatal here.
	it('cannot be broken by a slug an editor could type', () => {
		const xml = toSitemapXml(origin, [
			{
				id: 'article:a&b',
				language: 'de',
				path: '/learn/blog/a&b<c',
				equivalents: [{ locale: 'de', path: '/learn/blog/a&b<c' }]
			}
		]);

		expect(xml).toContain('<loc>https://solean-web.vercel.app/learn/blog/a&amp;b%3Cc</loc>');

		const emitted = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
		expect(emitted).toHaveLength(1);
		expect(emitted[0]).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;)|[<>]/);
	});

	it('states no changefreq or priority it does not know', () => {
		const xml = toSitemapXml(origin, home);

		expect(xml).not.toContain('changefreq');
		expect(xml).not.toContain('priority');
	});

	it('orders entries so an unchanged deployment produces the same document', () => {
		expect(toSitemapXml(origin, home)).toBe(toSitemapXml(origin, [...home].reverse()));
	});

	it('changing the origin changes every URL in the document', () => {
		const xml = toSitemapXml('https://solean.com', home);

		expect(xml).not.toContain('vercel.app');
		expect(xml.match(/https:\/\/solean\.com/g)).toHaveLength(6);
	});
});

describe('toRobotsTxt', () => {
	it('advertises the sitemap once indexing is on', () => {
		expect(toRobotsTxt(`${origin}/sitemap.xml`)).toContain(
			'Sitemap: https://solean-web.vercel.app/sitemap.xml'
		);
	});

	it('advertises nothing before launch', () => {
		expect(toRobotsTxt(null)).not.toContain('Sitemap');
	});

	// The rule the spec is explicit about: a blanket Disallow hides the noindex it relies on.
	it('never blocks crawling of a page, in either state', () => {
		for (const robots of [toRobotsTxt(null), toRobotsTxt(`${origin}/sitemap.xml`)]) {
			expect(robots).toContain('User-agent: *');
			expect(robots).not.toMatch(/^Disallow: \/$/m);
			expect(robots).toContain('Disallow: /api/');
			expect(robots).toContain('Disallow: /dev/');
		}
	});
});
