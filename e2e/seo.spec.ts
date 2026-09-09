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
