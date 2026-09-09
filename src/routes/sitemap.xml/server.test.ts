import { beforeEach, describe, expect, it, vi } from 'vitest';

const { policy, pages } = vi.hoisted(() => ({ policy: vi.fn(), pages: vi.fn() }));
vi.mock('$lib/server/seo/config', () => ({ seoPolicy: policy }));
vi.mock('$lib/server/seo/inventory', () => ({ publishedPages: pages }));

import { GET } from './+server';

/** The handler's own event type, not the generic one: only this route's id satisfies it. */
type Event = Parameters<typeof GET>[0];

const ORIGIN = 'https://solean-web.vercel.app';

const LAUNCHED = { origin: ORIGIN, enabled: true, vercelEnvironment: 'production' };

function request(origin = ORIGIN) {
	const setHeaders = vi.fn();

	return {
		event: { url: new URL(origin), setHeaders } as unknown as Event,
		setHeaders
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('GET /sitemap.xml', () => {
	/**
	 * The rule the spec is explicit about: a successful empty sitemap tells a crawler every page
	 * has been withdrawn, and it acts on that. An outage has to be retriable instead.
	 */
	it('answers a content-service failure with 503, not an empty document', async () => {
		policy.mockReturnValue(LAUNCHED);
		pages.mockRejectedValue(new Error('upstream unavailable'));
		const { event } = request();

		await expect(GET(event)).rejects.toMatchObject({ status: 503 });
	});

	it('lists the published pages once indexing is approved', async () => {
		policy.mockReturnValue(LAUNCHED);
		pages.mockResolvedValue([
			{ id: 'home', language: 'de', path: '/', equivalents: [{ locale: 'de', path: '/' }] }
		]);
		const { event } = request();

		const body = await (await GET(event)).text();

		expect(body).toContain(`<loc>${ORIGIN}/</loc>`);
	});

	it.each([
		['the launch switch is off', { ...LAUNCHED, enabled: false }],
		['no origin is configured', { ...LAUNCHED, origin: null }],
		['this is a preview deployment', { ...LAUNCHED, vercelEnvironment: 'preview' }]
	])('is empty and reads no content when %s', async (_reason, configured) => {
		policy.mockReturnValue(configured);
		const { event } = request();

		const body = await (await GET(event)).text();

		expect(body).toContain('<urlset');
		expect(body).not.toContain('<url>');
		expect(pages).not.toHaveBeenCalled();
	});

	it('is empty on an alias, so a second hostname cannot publish the real one', async () => {
		policy.mockReturnValue(LAUNCHED);
		const { event } = request('https://branch-xyz.vercel.app');

		expect(await (await GET(event)).text()).not.toContain('<url>');
		expect(pages).not.toHaveBeenCalled();
	});
});
