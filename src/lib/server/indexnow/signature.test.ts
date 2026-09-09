import { beforeEach, describe, expect, it, vi } from 'vitest';

const { privateEnv } = vi.hoisted(() => ({
	privateEnv: {} as Record<string, string | undefined>
}));
vi.mock('$env/dynamic/private', () => ({ env: privateEnv }));

import { sign, verifyWebhook } from './signature';

const SECRET = 'a-shared-secret-from-the-sanity-dashboard';
const BODY = '{"type":"article","slug":"x","language":"de"}';
const NOW = 1_788_000_000_000;

async function signed(body = BODY, timestamp = NOW, secret = SECRET) {
	return new Headers({
		'sanity-webhook-signature': `t=${timestamp},v1=${await sign(secret, timestamp, body)}`
	});
}

beforeEach(() => {
	for (const key of Object.keys(privateEnv)) delete privateEnv[key];
	privateEnv.SANITY_WEBHOOK_SECRET = SECRET;
});

describe('verifyWebhook', () => {
	it('accepts a request our own project signed', async () => {
		expect(await verifyWebhook(await signed(), BODY, NOW)).toBe(true);
	});

	it('accepts the header with its parts in either order', async () => {
		const signature = await sign(SECRET, NOW, BODY);
		const reversed = new Headers({
			'sanity-webhook-signature': `v1=${signature}, t=${NOW}`
		});

		expect(await verifyWebhook(reversed, BODY, NOW)).toBe(true);
	});

	/**
	 * An unconfigured secret refuses everything, which is the opposite of the reminder's
	 * "absent credentials mean this deployment does not send". There an absent credential
	 * disables an outbound courtesy; here it would disable the only thing standing in front
	 * of one.
	 */
	it.each([undefined, '', '   '])('refuses everything when the secret is %s', async (secret) => {
		privateEnv.SANITY_WEBHOOK_SECRET = secret;

		expect(await verifyWebhook(await signed(), BODY, NOW)).toBe(false);
	});

	it('refuses a signature made with a different secret', async () => {
		expect(await verifyWebhook(await signed(BODY, NOW, 'not-the-secret'), BODY, NOW)).toBe(false);
	});

	// The signature covers the exact bytes, which is the whole point: a body altered in transit
	// no longer verifies.
	it('refuses a body that was changed after signing', async () => {
		const headers = await signed();

		expect(await verifyWebhook(headers, `${BODY} `, NOW)).toBe(false);
		expect(await verifyWebhook(headers, '{"type":"article","slug":"y","language":"de"}', NOW))
			.toBe(false);
	});

	it.each([
		['no header', null],
		['an empty header', ''],
		['no signature part', `t=${NOW}`],
		['no timestamp part', 'v1=abc'],
		['a non-numeric timestamp', 't=yesterday,v1=abc'],
		['nonsense', 'not-a-signature-header'],
		['a bare digest', 'abcdef']
	])('refuses %s', async (_name, header) => {
		const headers = new Headers(header === null ? {} : { 'sanity-webhook-signature': header });

		expect(await verifyWebhook(headers, BODY, NOW)).toBe(false);
	});

	describe('freshness', () => {
		it('accepts a request inside the window', async () => {
			expect(await verifyWebhook(await signed(BODY, NOW), BODY, NOW + 4 * 60 * 1000)).toBe(true);
		});

		it('refuses a captured request replayed later', async () => {
			expect(await verifyWebhook(await signed(BODY, NOW), BODY, NOW + 6 * 60 * 1000)).toBe(false);
		});

		// A clock far ahead of ours is as much a sign of a forged timestamp as one far behind.
		it('refuses a timestamp from the future', async () => {
			expect(await verifyWebhook(await signed(BODY, NOW), BODY, NOW - 6 * 60 * 1000)).toBe(false);
		});
	});

	it('produces a url-safe digest with no padding', async () => {
		const signature = await sign(SECRET, NOW, BODY);

		expect(signature).toMatch(/^[A-Za-z0-9_-]+$/);
		expect(signature).not.toContain('=');
	});

	it('signs the timestamp as well as the body, so one cannot be swapped', async () => {
		expect(await sign(SECRET, NOW, BODY)).not.toBe(await sign(SECRET, NOW + 1, BODY));
	});
});
