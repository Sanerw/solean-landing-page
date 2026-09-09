import { beforeEach, describe, expect, it, vi } from 'vitest';

const { policy } = vi.hoisted(() => ({ policy: vi.fn() }));
vi.mock('$lib/server/seo/config', () => ({ seoPolicy: policy }));

import { GET } from './+server';

/** The handler's own event type, not the generic one: only this route's id satisfies it. */
type Event = Parameters<typeof GET>[0];

const ORIGIN = 'https://solean-web.vercel.app';
const LAUNCHED = { origin: ORIGIN, enabled: true, vercelEnvironment: 'production' };

function event(origin = ORIGIN) {
	return { url: new URL(origin), setHeaders: vi.fn() } as unknown as Event;
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('GET /robots.txt', () => {
	it('advertises the sitemap on the configured origin once indexing is approved', async () => {
		policy.mockReturnValue(LAUNCHED);

		expect(await (await GET(event())).text()).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
	});

	it.each([
		['the launch switch is off', { ...LAUNCHED, enabled: false }],
		['no origin is configured', { ...LAUNCHED, origin: null }],
		['this is a preview deployment', { ...LAUNCHED, vercelEnvironment: 'preview' }]
	])('advertises nothing when %s', async (_reason, configured) => {
		policy.mockReturnValue(configured);

		expect(await (await GET(event())).text()).not.toContain('Sitemap');
	});

	it('never names another deployment\'s sitemap from an alias', async () => {
		policy.mockReturnValue(LAUNCHED);

		expect(await (await GET(event('https://branch-xyz.vercel.app'))).text())
			.not.toContain('Sitemap');
	});
});
