import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { publicEnv, privateEnv } = vi.hoisted(() => ({
	publicEnv: {} as Record<string, string | undefined>,
	privateEnv: {} as Record<string, string | undefined>
}));
vi.mock('$env/dynamic/public', () => ({ env: publicEnv }));
vi.mock('$env/dynamic/private', () => ({ env: privateEnv }));

import { createNotifier } from './client';

const ORIGIN = 'https://solean.com';
const KEY = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

function launched() {
	publicEnv.PUBLIC_SITE_URL = ORIGIN;
	privateEnv.SEO_INDEXING_ENABLED = 'true';
	privateEnv.VERCEL_ENV = 'production';
	privateEnv.INDEXNOW_KEY = KEY;
}

function ok(status = 200) {
	return vi.fn().mockResolvedValue(new Response(null, { status }));
}

beforeEach(() => {
	vi.useFakeTimers();
	for (const key of Object.keys(publicEnv)) delete publicEnv[key];
	for (const key of Object.keys(privateEnv)) delete privateEnv[key];
});

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe('notifying IndexNow', () => {
	/**
	 * The guard the browser suite cannot prove, because the call is made by the server process
	 * where `page.on('request')` cannot see it. This is the test that actually holds the line.
	 */
	it.each([
		['nothing is configured', () => {}],
		['there is no key', () => { launched(); delete privateEnv.INDEXNOW_KEY; }],
		['indexing is not launched', () => { launched(); privateEnv.SEO_INDEXING_ENABLED = 'false'; }],
		['this is a preview deployment', () => { launched(); privateEnv.VERCEL_ENV = 'preview'; }],
		['the origin is invalid', () => { launched(); publicEnv.PUBLIC_SITE_URL = 'nonsense'; }]
	])('makes no call at all when %s', async (_reason, configure) => {
		configure();
		const fetchImpl = ok();

		expect(await createNotifier(fetchImpl)(ORIGIN, [`${ORIGIN}/learn`])).toBe('skipped');
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it('makes no call for a webhook that arrived on another origin', async () => {
		launched();
		const fetchImpl = ok();

		expect(await createNotifier(fetchImpl)('https://preview.vercel.app', [`${ORIGIN}/`]))
			.toBe('skipped');
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it('posts the documented body to the shared endpoint', async () => {
		launched();
		const fetchImpl = ok();

		expect(await createNotifier(fetchImpl)(ORIGIN, [`${ORIGIN}/learn`])).toBe('accepted');

		const [url, init] = fetchImpl.mock.calls[0];
		expect(url).toBe('https://api.indexnow.org/indexnow');
		expect(init.method).toBe('POST');
		expect(JSON.parse(init.body)).toEqual({
			host: 'solean.com',
			key: KEY,
			keyLocation: `${ORIGIN}/${KEY}.txt`,
			urlList: [`${ORIGIN}/learn`]
		});
	});

	it('makes no call when every URL would be refused', async () => {
		launched();
		const fetchImpl = ok();

		expect(await createNotifier(fetchImpl)(ORIGIN, ['https://evil.test/x'])).toBe('skipped');
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	describe('bounds', () => {
		it('collapses a repeat of the same URL inside the window', async () => {
			launched();
			const fetchImpl = ok();
			const submit = createNotifier(fetchImpl);

			await submit(ORIGIN, [`${ORIGIN}/learn`]);
			expect(await submit(ORIGIN, [`${ORIGIN}/learn`])).toBe('skipped');
			vi.advanceTimersByTime(4 * 60 * 1000);
			expect(await submit(ORIGIN, [`${ORIGIN}/learn`])).toBe('skipped');

			expect(fetchImpl).toHaveBeenCalledTimes(1);
		});

		it('submits again once the window has passed', async () => {
			launched();
			const fetchImpl = ok();
			const submit = createNotifier(fetchImpl);

			await submit(ORIGIN, [`${ORIGIN}/learn`]);
			vi.advanceTimersByTime(6 * 60 * 1000);
			await submit(ORIGIN, [`${ORIGIN}/learn`]);

			expect(fetchImpl).toHaveBeenCalledTimes(2);
		});

		it('still sends the URLs that are not being collapsed', async () => {
			launched();
			const fetchImpl = ok();
			const submit = createNotifier(fetchImpl);

			await submit(ORIGIN, [`${ORIGIN}/learn`]);
			await submit(ORIGIN, [`${ORIGIN}/learn`, `${ORIGIN}/learn/blog/x`]);

			expect(JSON.parse(fetchImpl.mock.calls[1][1].body).urlList)
				.toEqual([`${ORIGIN}/learn/blog/x`]);
		});

		// A timed-out submission may well have arrived, so repeating it on the next publish is
		// the wasteful outcome rather than the safe one.
		it('does not retry a URL whose call failed, until the window passes', async () => {
			launched();
			const fetchImpl = vi.fn().mockRejectedValue(new Error('network down'));
			vi.spyOn(console, 'warn').mockImplementation(() => {});
			const submit = createNotifier(fetchImpl);

			expect(await submit(ORIGIN, [`${ORIGIN}/learn`])).toBe('unreachable');
			expect(await submit(ORIGIN, [`${ORIGIN}/learn`])).toBe('skipped');
			expect(fetchImpl).toHaveBeenCalledTimes(1);
		});
	});

	describe('what the service answers', () => {
		it.each([200, 202])('reads %s as accepted without logging', async (status) => {
			launched();
			const error = vi.spyOn(console, 'error').mockImplementation(() => {});

			expect(await createNotifier(ok(status))(ORIGIN, [`${ORIGIN}/`])).toBe('accepted');
			expect(error).not.toHaveBeenCalled();
		});

		it.each([400, 403, 422, 429])('reads %s as refused and says why', async (status) => {
			launched();
			const error = vi.spyOn(console, 'error').mockImplementation(() => {});

			expect(await createNotifier(ok(status))(ORIGIN, [`${ORIGIN}/`])).toBe('refused');
			expect(error).toHaveBeenCalledOnce();
		});

		it('never puts a URL or the key in a log line', async () => {
			launched();
			const error = vi.spyOn(console, 'error').mockImplementation(() => {});

			await createNotifier(ok(403))(ORIGIN, [`${ORIGIN}/learn/blog/secret-draft`]);

			const line = error.mock.calls[0].join(' ');
			expect(line).not.toContain('secret-draft');
			expect(line).not.toContain(KEY);
			expect(line).toContain('1 url(s)');
		});

		it('resolves rather than throwing when the service cannot be reached', async () => {
			launched();
			vi.spyOn(console, 'warn').mockImplementation(() => {});

			expect(await createNotifier(vi.fn().mockRejectedValue(new Error('down')))(
				ORIGIN, [`${ORIGIN}/`]
			)).toBe('unreachable');
		});
	});
});
