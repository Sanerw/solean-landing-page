import { beforeEach, describe, expect, it, vi } from 'vitest';

const { privateEnv, publicEnv, notify } = vi.hoisted(() => ({
	privateEnv: {} as Record<string, string | undefined>,
	publicEnv: {} as Record<string, string | undefined>,
	notify: vi.fn()
}));
vi.mock('$env/dynamic/private', () => ({ env: privateEnv }));
vi.mock('$env/dynamic/public', () => ({ env: publicEnv }));
vi.mock('$lib/server/indexnow/client', () => ({ notifyIndexNow: notify }));

import { POST } from './+server';
import { sign } from '$lib/server/indexnow/signature';

type Event = Parameters<typeof POST>[0];

const ORIGIN = 'https://solean.com';
const SECRET = 'a-shared-secret';

const publish = { type: 'article', id: 'abc', slug: 'mounjaro-vs-wegovy', language: 'de' };

async function call(payload: unknown, { secret = SECRET, signIt = true } = {}) {
	const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
	const timestamp = Date.now();
	const headers = new Headers({ 'content-type': 'application/json' });
	if (signIt) {
		headers.set('sanity-webhook-signature', `t=${timestamp},v1=${await sign(secret, timestamp, body)}`);
	}

	return POST({
		request: new Request(`${ORIGIN}/api/indexnow`, { method: 'POST', headers, body }),
		url: new URL(`${ORIGIN}/api/indexnow`)
	} as unknown as Event);
}

beforeEach(() => {
	vi.clearAllMocks();
	notify.mockResolvedValue('accepted');
	for (const key of Object.keys(privateEnv)) delete privateEnv[key];
	for (const key of Object.keys(publicEnv)) delete publicEnv[key];
	privateEnv.SANITY_WEBHOOK_SECRET = SECRET;
	publicEnv.PUBLIC_SITE_URL = ORIGIN;
});

describe('POST /api/indexnow', () => {
	describe('authentication', () => {
		it('refuses an unsigned call', async () => {
			expect((await call(publish, { signIt: false })).status).toBe(401);
			expect(notify).not.toHaveBeenCalled();
		});

		it('refuses a call signed with the wrong secret', async () => {
			expect((await call(publish, { secret: 'wrong' })).status).toBe(401);
			expect(notify).not.toHaveBeenCalled();
		});

		it('refuses everything when no secret is configured', async () => {
			delete privateEnv.SANITY_WEBHOOK_SECRET;

			expect((await call(publish)).status).toBe(401);
			expect(notify).not.toHaveBeenCalled();
		});

		it('accepts a correctly signed call', async () => {
			expect((await call(publish)).status).toBe(204);
		});
	});

	describe('the payload', () => {
		it.each(['not json at all', '[1,2,3]', 'null', '"a string"'])(
			'answers 400 to %s, so a misconfigured webhook is visible in Sanity',
			async (body) => {
				const response = await call(body);

				expect(response.status).toBe(400);
				expect(notify).not.toHaveBeenCalled();
			}
		);

		it('derives the URLs rather than taking them from the body', async () => {
			await call(publish);

			expect(notify).toHaveBeenCalledWith(ORIGIN, [
				`${ORIGIN}/learn/blog/mounjaro-vs-wegovy`,
				`${ORIGIN}/learn`
			]);
		});

		// The property the design rests on: a body naming a URL cannot make this app submit it.
		it('ignores a url the payload tries to supply', async () => {
			await call({ ...publish, url: 'https://evil.test/x', urlList: ['https://evil.test/y'] });

			const [, urls] = notify.mock.calls[0];
			for (const url of urls) expect(new URL(url).origin).toBe(ORIGIN);
		});

		it('calls nothing for a document with no public page', async () => {
			await call({ ...publish, type: 'clinician' });

			expect(notify).not.toHaveBeenCalled();
		});

		it('calls nothing for a draft', async () => {
			await call({ ...publish, id: 'drafts.abc' });

			expect(notify).not.toHaveBeenCalled();
		});

		it('still answers 204 when there is nothing to notify', async () => {
			expect((await call({ ...publish, type: 'testimonial' })).status).toBe(204);
		});
	});

	describe('the outbound result', () => {
		/**
		 * Sanity retries a failed delivery. A refusal by IndexNow is not Sanity's to retry: the
		 * webhook arrived and was understood, and hammering a rate-limited service makes it
		 * worse. The sitemap advertises every page regardless.
		 */
		it.each(['accepted', 'skipped', 'refused', 'unreachable'])(
			'answers 204 whatever the submission did (%s)',
			async (outcome) => {
				vi.spyOn(console, 'warn').mockImplementation(() => {});
				notify.mockResolvedValue(outcome);

				expect((await call(publish)).status).toBe(204);
			}
		);

		it('logs a failure without naming a URL', async () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			notify.mockResolvedValue('refused');

			await call(publish);

			expect(warn).toHaveBeenCalledOnce();
			expect(warn.mock.calls[0].join(' ')).not.toContain('mounjaro');
		});
	});

	it('notifies nothing when no origin is configured', async () => {
		delete publicEnv.PUBLIC_SITE_URL;

		expect((await call(publish)).status).toBe(204);
		expect(notify).not.toHaveBeenCalled();
	});
});
