import { expect, test } from '@playwright/test';

test.describe('pre-launch indexing policy', () => {
	for (const path of ['/', '/en', '/learn', '/learn/blog/mounjaro-vs-wegovy', '/privacy',
		'/questionnaire', '/en/questionnaire', '/dev/definition']) {
		test(`${path} is served with noindex before JavaScript runs`, async ({ request }) => {
			const response = await request.get(path);
			expect(response.status()).toBe(200);
			expect(response.headers()['x-robots-tag']).toContain('noindex');
			expect(response.headers()['content-type']).toContain('text/html');
		});
	}

	test('missing pages return 404 and noindex', async ({ request }) => {
		const response = await request.get('/this-page-does-not-exist');
		expect(response.status()).toBe(404);
		expect(response.headers()['x-robots-tag']).toContain('noindex');
	});

	test('the German landing page still renders without JavaScript', async ({ browser }) => {
		const context = await browser.newContext({ javaScriptEnabled: false, locale: 'de-DE' });
		try {
			const page = await context.newPage();
			const response = await page.goto(test.info().project.use.baseURL!);
			expect(response?.headers()['x-robots-tag']).toContain('noindex');
			await expect(page.locator('html')).toHaveAttribute('lang', 'de');
			await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		} finally {
			await context.close();
		}
	});
});

/**
 * Read off the raw response body, never off the rendered DOM: a crawler that runs no JavaScript
 * sees exactly this, and an assertion through `page` would pass on links the client added.
 */
async function headLinks(html: string, rel: 'canonical' | 'alternate') {
	return [...html.matchAll(/<link\b[^>]*>/g)]
		.map((tag) => tag[0])
		.filter((tag) => new RegExp(`rel="${rel}"`).test(tag))
		.map((tag) => ({
			href: tag.match(/href="([^"]*)"/)?.[1] ?? '',
			hreflang: tag.match(/hreflang="([^"]*)"/)?.[1]
		}));
}

const ORIGIN = 'http://localhost:4173';

test.describe('canonical and language links', () => {
	// Every page the fixture publishes in both languages, which is every public page it has.
	for (const [path, canonical] of [
		['/', `${ORIGIN}/`],
		['/en', `${ORIGIN}/en`],
		['/learn', `${ORIGIN}/learn`],
		['/en/learn', `${ORIGIN}/en/learn`],
		['/learn/blog/mounjaro-vs-wegovy', `${ORIGIN}/learn/blog/mounjaro-vs-wegovy`],
		['/en/learn/blog/mounjaro-vs-wegovy', `${ORIGIN}/en/learn/blog/mounjaro-vs-wegovy`],
		['/treatments/wegovy-pill', `${ORIGIN}/treatments/wegovy-pill`],
		['/en/treatments/wegovy-pill', `${ORIGIN}/en/treatments/wegovy-pill`],
		['/privacy', `${ORIGIN}/privacy`],
		['/en/privacy', `${ORIGIN}/en/privacy`]
	] as const) {
		test(`${path} canonicalises to itself`, async ({ request }) => {
			const html = await (await request.get(path)).text();

			expect(await headLinks(html, 'canonical')).toEqual([{ href: canonical, hreflang: undefined }]);
		});
	}

	test('each language offers the other as an absolute reciprocal alternate', async ({ request }) => {
		const german = await headLinks(await (await request.get('/learn/blog/mounjaro-vs-wegovy')).text(), 'alternate');
		const english = await headLinks(await (await request.get('/en/learn/blog/mounjaro-vs-wegovy')).text(), 'alternate');

		const expected = [
			{ hreflang: 'de', href: `${ORIGIN}/learn/blog/mounjaro-vs-wegovy` },
			{ hreflang: 'en', href: `${ORIGIN}/en/learn/blog/mounjaro-vs-wegovy` },
			{ hreflang: 'x-default', href: `${ORIGIN}/learn/blog/mounjaro-vs-wegovy` }
		];

		expect(german).toEqual(expected);
		expect(english).toEqual(expected);
	});

	// The trailing slash is the case that used to spoil the root: `/en/` answers 308, and an
	// alternate naming a redirect makes a crawler follow one before it can read the page.
	test('the root offers both locales without a redirect', async ({ request }) => {
		expect(await headLinks(await (await request.get('/')).text(), 'alternate')).toEqual([
			{ hreflang: 'de', href: `${ORIGIN}/` },
			{ hreflang: 'en', href: `${ORIGIN}/en` },
			{ hreflang: 'x-default', href: `${ORIGIN}/` }
		]);
	});

	test('a policy document offers both locales', async ({ request }) => {
		expect(await headLinks(await (await request.get('/en/privacy')).text(), 'alternate')).toEqual([
			{ hreflang: 'de', href: `${ORIGIN}/privacy` },
			{ hreflang: 'en', href: `${ORIGIN}/en/privacy` },
			{ hreflang: 'x-default', href: `${ORIGIN}/privacy` }
		]);
	});

	test('no emitted URL carries a query string or a fragment', async ({ request }) => {
		const html = await (await request.get('/treatments/mounjaro?utm_source=newsletter#plans')).text();

		expect(await headLinks(html, 'canonical')).toEqual([
			{ href: `${ORIGIN}/treatments/mounjaro`, hreflang: undefined }
		]);
		for (const link of await headLinks(html, 'alternate')) {
			expect(link.href).not.toMatch(/[?#]/);
		}
	});

	// A page that does not exist has no canonical to claim, and neither does an internal one.
	for (const path of [
		'/learn/blog/never-published',
		'/treatments/not-a-treatment',
		'/this-page-does-not-exist',
		'/questionnaire',
		'/dev/definition'
	]) {
		test(`${path} emits no canonical and no alternate`, async ({ request }) => {
			const html = await (await request.get(path)).text();

			expect(await headLinks(html, 'canonical')).toEqual([]);
			expect(await headLinks(html, 'alternate')).toEqual([]);
		});
	}

	test('a visitor\'s locale cookie cannot change what a page claims', async ({ browser }) => {
		const context = await browser.newContext({
			locale: 'en-US',
			extraHTTPHeaders: { cookie: 'PARAGLIDE_LOCALE=en' }
		});
		try {
			const html = await (await context.request.get(`${ORIGIN}/privacy`)).text();

			expect(await headLinks(html, 'canonical')).toEqual([
				{ href: `${ORIGIN}/privacy`, hreflang: undefined }
			]);
		} finally {
			await context.close();
		}
	});
});

test.describe('discovery endpoints before launch', () => {
	test('robots.txt is served by the route, not the deleted static file', async ({ request }) => {
		const response = await request.get('/robots.txt');

		expect(response.status()).toBe(200);
		expect(response.headers()['content-type']).toContain('text/plain');

		const body = await response.text();
		expect(body).toContain('User-agent: *');
		// Before launch there is nothing to advertise.
		expect(body).not.toContain('Sitemap:');
		// Crawling stays open, because a noindex header is only obeyed on a page a crawler fetches.
		expect(body).not.toMatch(/^Disallow: \/$/m);
	});

	test('the sitemap is explicitly empty and itself noindex', async ({ request }) => {
		const response = await request.get('/sitemap.xml');

		expect(response.status()).toBe(200);
		expect(response.headers()['content-type']).toContain('application/xml');
		expect(response.headers()['x-robots-tag']).toContain('noindex');

		const body = await response.text();
		expect(body).toContain('<urlset');
		expect(body).toContain('</urlset>');
		expect(body).not.toContain('<url>');
	});

	test.describe('with a locale cookie and an English browser', () => {
		test.use({ locale: 'en-US', extraHTTPHeaders: { cookie: 'PARAGLIDE_LOCALE=en' } });

		test('neither endpoint answers differently', async ({ request }) => {
			expect(await (await request.get('/robots.txt')).text()).not.toContain('Sitemap:');
			expect(await (await request.get('/sitemap.xml')).text()).not.toContain('<url>');
		});
	});
});

/** Read off the raw body: a scraper runs no JavaScript, so the DOM is not what it sees. */
function metaTags(html: string) {
	return [...html.matchAll(/<meta\b[^>]*>/g)]
		.map((tag) => tag[0])
		.map((tag) => ({
			key: tag.match(/(?:property|name)="([^"]*)"/)?.[1] ?? '',
			content: (tag.match(/content="([^"]*)"/)?.[1] ?? '').replace(/&amp;/g, '&')
		}));
}

async function sharing(request: { get: (path: string) => Promise<{ text(): Promise<string> }> }, path: string) {
	const tags = metaTags(await (await request.get(path)).text());

	return (key: string) => tags.filter((tag) => tag.key === key).map((tag) => tag.content);
}

test.describe('sharing metadata', () => {
	test('a page describes itself with the title and URL it already claims', async ({ request }) => {
		const html = await (await request.get('/learn/blog/mounjaro-vs-wegovy')).text();
		const get = (key: string) =>
			metaTags(html).filter((tag) => tag.key === key).map((tag) => tag.content);
		const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
		const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/)?.[1];

		expect(get('og:title')).toEqual([title]);
		expect(get('og:url')).toEqual([canonical]);
		expect(get('og:type')).toEqual(['article']);
		expect(get('og:site_name')).toEqual(['Solean']);
	});

	test.describe('locales', () => {
		test('German names itself and offers English', async ({ request }) => {
			const get = await sharing(request, '/');

			expect(get('og:locale')).toEqual(['de_DE']);
			expect(get('og:locale:alternate')).toEqual(['en_GB']);
		});

		test('English names itself and offers German', async ({ request }) => {
			const get = await sharing(request, '/en');

			expect(get('og:locale')).toEqual(['en_GB']);
			expect(get('og:locale:alternate')).toEqual(['de_DE']);
		});
	});

	for (const path of ['/', '/learn', '/learn/blog/mounjaro-vs-wegovy', '/treatments/mounjaro']) {
		test(`${path} shares the photograph it already displays`, async ({ request }) => {
			const get = await sharing(request, path);
			const [url] = get('og:image');

			// Not fetched here on purpose: the URL is on Sanity's CDN, and a browser run that
			// reached it would depend on a third party this suite is otherwise isolated from.
			// `og-image.test.ts` pins the shape; the live 200 is checked by hand.
			expect(url).toMatch(/^https:\/\/cdn\.sanity\.io\/images\//);
			expect(url).toContain('w=1200');
			expect(url).toContain('h=630');
			expect(url).toContain('fit=crop');
			// A scraper handed AVIF or WebP stores nothing, and the card renders blank with
			// every tag still correct. This is the assertion that catches that silently.
			expect(url).toContain('fm=jpg');
			expect(url).not.toContain('auto=format');

			expect(get('og:image:width')).toEqual(['1200']);
			expect(get('og:image:height')).toEqual(['630']);
			expect(get('og:image:alt')[0]).toBeTruthy();
			expect(get('twitter:card')).toEqual(['summary_large_image']);
		});
	}

	// The fixture publishes this treatment without a photograph, which is the case that must
	// degrade to the plain card rather than to a broken one.
	for (const path of ['/privacy', '/en/legal-notice', '/treatments/wegovy-pill']) {
		test(`${path} shares as a plain card rather than inventing a picture`, async ({ request }) => {
			const get = await sharing(request, path);

			expect(get('og:image')).toEqual([]);
			expect(get('og:image:width')).toEqual([]);
			expect(get('twitter:card')).toEqual(['summary']);
			// It still describes itself; only the picture is absent.
			expect(get('og:title')[0]).toBeTruthy();
		});
	}
});

/**
 * The graph, parsed rather than pattern-matched: a block that only looks right is worth
 * nothing, and parsing is also what proves the escaping did not corrupt it.
 */
async function graphOf(
	request: { get: (path: string) => Promise<{ text(): Promise<string> }> },
	path: string
) {
	const html = await (await request.get(path)).text();
	const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];

	expect(blocks.length, 'exactly one JSON-LD block per page').toBeLessThanOrEqual(1);
	if (!blocks.length) return null;

	const parsed = JSON.parse(blocks[0][1]);
	const nodes = parsed['@graph'] as Record<string, unknown>[];

	return {
		types: nodes.map((node) => node['@type']),
		of: (type: string) => nodes.find((node) => node['@type'] === type)
	};
}

test.describe('structured data', () => {
	for (const path of ['/', '/en', '/learn', '/privacy', '/en/legal-notice', '/treatments/mounjaro']) {
		test(`${path} identifies the organization behind the site`, async ({ request }) => {
			const organization = (await graphOf(request, path))?.of('Organization');

			// Every value here is printed in the footer of the page that carries it.
			expect(organization).toMatchObject({
				name: 'Solean',
				contactPoint: {
					email: 'support@solean.com',
					telephone: '+49 40 87709420'
				}
			});
			expect(organization).not.toHaveProperty('sameAs');
			expect(organization).not.toHaveProperty('aggregateRating');
		});
	}

	test('an article describes itself, its dates and its reviewer', async ({ request }) => {
		const article = (await graphOf(request, '/learn/blog/mounjaro-vs-wegovy'))?.of('Article');

		expect(article).toMatchObject({
			inLanguage: 'de',
			datePublished: '2026-08-14',
			dateModified: '2026-09-08T20:30:47Z',
			reviewedBy: { '@type': 'Person', name: 'Dr. Juraj Galan' }
		});
		// The headline is the article's own, without the suffix the page title wears.
		expect(article?.headline).not.toContain('| Solean');
	});

	test('only an article is marked up as one', async ({ request }) => {
		expect((await graphOf(request, '/learn'))?.types).toEqual(['Organization']);
		expect((await graphOf(request, '/privacy'))?.types).toEqual(['Organization']);
	});

	test('the treatment trail does not link the index the page refuses to link', async ({
		request
	}) => {
		const crumbs = (await graphOf(request, '/en/treatments/mounjaro'))?.of('BreadcrumbList')
			?.itemListElement as Record<string, unknown>[];

		expect(crumbs.map((crumb) => crumb.name)).toEqual(['Home', 'Treatments', 'Mounjaro Injection']);
		expect(crumbs[1]).not.toHaveProperty('item');
		expect(crumbs[0].item).toBe('http://localhost:4173/en');
		expect(crumbs[2].item).toBe('http://localhost:4173/en/treatments/mounjaro');
	});

	test('every URL a trail does link is a page that answers', async ({ request }) => {
		for (const path of ['/learn/blog/mounjaro-vs-wegovy', '/en/treatments/mounjaro']) {
			const crumbs = (await graphOf(request, path))?.of('BreadcrumbList')
				?.itemListElement as Record<string, unknown>[];

			for (const crumb of crumbs.filter((crumb) => crumb.item)) {
				const response = await request.get(crumb.item as string, { maxRedirects: 0 });
				expect(response.status(), `${crumb.item} should be a page`).toBe(200);
			}
		}
	});

	for (const path of ['/questionnaire', '/dev/definition', '/this-page-does-not-exist']) {
		test(`${path} carries no structured data`, async ({ request }) => {
			expect(await graphOf(request, path)).toBeNull();
		});
	}
});
