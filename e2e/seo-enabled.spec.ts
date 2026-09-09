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
