import { expect, test } from '@playwright/test';

/**
 * The launched policy, proven against the same build the rest of the suite runs, served on its
 * own port with `SEO_INDEXING_ENABLED=true` and its own `PUBLIC_SITE_URL`. Nothing is submitted
 * anywhere: this is what the site would say, not a request that it be indexed.
 *
 * It is also the origin proof. The two servers differ only in the switch and the origin, so
 * every URL here naming 4174 while the disabled suite names 4173 is the configuration reaching
 * every generated address rather than a hardcoded one.
 */
const ORIGIN = 'http://localhost:4174';

test('a public page loses the noindex header once indexing is approved', async ({ request }) => {
	const response = await request.get('/');

	expect(response.status()).toBe(200);
	expect(response.headers()['x-robots-tag']).toBeUndefined();
});

for (const path of ['/questionnaire', '/en/questionnaire', '/dev/definition']) {
	test(`${path} stays noindex even with indexing approved`, async ({ request }) => {
		expect((await request.get(path)).headers()['x-robots-tag']).toContain('noindex');
	});
}

test('a missing page stays noindex', async ({ request }) => {
	const response = await request.get('/this-page-does-not-exist');

	expect(response.status()).toBe(404);
	expect(response.headers()['x-robots-tag']).toContain('noindex');
});

test('robots.txt advertises this deployment\'s own sitemap', async ({ request }) => {
	const body = await (await request.get('/robots.txt')).text();

	expect(body).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
	expect(body).not.toContain('localhost:4173');
});

test('the sitemap lists every published page, in both languages', async ({ request }) => {
	const response = await request.get('/sitemap.xml');

	expect(response.status()).toBe(200);
	expect(response.headers()['content-type']).toContain('application/xml');

	const body = await response.text();
	const locations = [...body.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);

	expect(locations).toEqual([
		`${ORIGIN}/`,
		`${ORIGIN}/en`,
		`${ORIGIN}/en/learn`,
		`${ORIGIN}/en/learn/blog/mounjaro-vs-wegovy`,
		`${ORIGIN}/en/legal-notice`,
		`${ORIGIN}/en/privacy`,
		`${ORIGIN}/en/returns`,
		`${ORIGIN}/en/terms`,
		`${ORIGIN}/learn`,
		`${ORIGIN}/learn/blog/mounjaro-vs-wegovy`,
		`${ORIGIN}/legal-notice`,
		`${ORIGIN}/privacy`,
		`${ORIGIN}/returns`,
		`${ORIGIN}/terms`,
		`${ORIGIN}/en/treatments/mounjaro`,
		`${ORIGIN}/en/treatments/wegovy`,
		`${ORIGIN}/en/treatments/wegovy-pill`,
		`${ORIGIN}/treatments/mounjaro`,
		`${ORIGIN}/treatments/wegovy`,
		`${ORIGIN}/treatments/wegovy-pill`
	].sort());
});

test('the sitemap names no private, internal or unpublished URL', async ({ request }) => {
	const body = await (await request.get('/sitemap.xml')).text();

	for (const forbidden of ['/questionnaire', '/api/', '/dev/', '/preview/', '/de/']) {
		expect(body).not.toContain(forbidden);
	}
});

test('every URL the sitemap lists is a page that actually answers', async ({ request }) => {
	const body = await (await request.get('/sitemap.xml')).text();
	const locations = [...body.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);

	expect(locations.length).toBeGreaterThan(0);
	for (const location of locations) {
		const response = await request.get(location, { maxRedirects: 0 });

		expect(response.status(), `${location} should be a page, not a redirect or a 404`).toBe(200);
	}
});

test('the sitemap and the page agree about the canonical', async ({ request }) => {
	const body = await (await request.get('/sitemap.xml')).text();
	const locations = [...body.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);

	for (const location of locations) {
		const html = await (await request.get(location)).text();
		const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/)?.[1];

		expect(canonical, `${location} should canonicalise to itself`).toBe(location);
	}
});

/**
 * The origin proof for feature 28b.
 *
 * This server differs from the pre-launch one in two settings only, so every absolute URL here
 * naming 4174 while the other suite's name 4173 is the configuration reaching each generated
 * address rather than a value hardcoded somewhere.
 */
test.describe('metadata follows the configured origin', () => {
	test('every sharing URL names this deployment', async ({ request }) => {
		const html = await (await request.get('/learn/blog/mounjaro-vs-wegovy')).text();
		const content = (key: string) =>
			html.match(new RegExp(`<meta property="${key}" content="([^"]*)"`))?.[1];

		expect(content('og:url')).toBe(`${ORIGIN}/learn/blog/mounjaro-vs-wegovy`);
		expect(html).not.toContain('localhost:4173');
	});

	test('every URL in the graph names this deployment, except the image CDN', async ({
		request
	}) => {
		const html = await (await request.get('/treatments/mounjaro')).text();
		const block = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)![1];
		const graph = JSON.parse(block);

		// Every absolute URL the graph carries, wherever it is nested.
		const urls: string[] = [];
		JSON.stringify(graph, (key, value) => {
			if (typeof value === 'string' && value.startsWith('http')) urls.push(value);

			return value;
		});

		expect(urls.length).toBeGreaterThan(0);
		for (const url of urls) {
			// schema.org is the vocabulary, and the picture is a CDN asset rather than a page of
			// this site, so neither moves with the origin. Everything else must.
			if (url.startsWith('https://schema.org') || url.startsWith('https://cdn.sanity.io')) {
				continue;
			}
			expect(url, `${url} should be on the configured origin`).toContain(ORIGIN);
		}
		expect(block).not.toContain('localhost:4173');
	});

	test('the article graph is still well formed once indexing is on', async ({ request }) => {
		const html = await (await request.get('/en/learn/blog/mounjaro-vs-wegovy')).text();
		const graph = JSON.parse(
			html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)![1]
		);
		const types = (graph['@graph'] as { '@type': string }[]).map((node) => node['@type']);

		expect(types).toEqual(['Organization', 'Article', 'BreadcrumbList']);
	});
});

/**
 * The launched deployment is the one where a real key would actually reach IndexNow, so the
 * refusals matter more here than on the pre-launch server. `INDEXNOW_KEY` is blank on this
 * server too, deliberately.
 */
test.describe('IndexNow once indexing is approved', () => {
	test('still serves no key file, because none is configured', async ({ request }) => {
		expect((await request.get('/a1b2c3d4e5f60718293a4b5c6d7e8f90.txt')).status()).toBe(404);
	});

	test('still refuses an unsigned webhook', async ({ request }) => {
		const response = await request.post('/api/indexnow', {
			data: { type: 'article', slug: 'mounjaro-vs-wegovy', language: 'de' }
		});

		expect(response.status()).toBe(401);
	});

	test('the discovery endpoints are unaffected by the key route', async ({ request }) => {
		const robots = await (await request.get('/robots.txt')).text();

		expect(robots).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
		expect((await request.get('/sitemap.xml')).status()).toBe(200);
	});
});
