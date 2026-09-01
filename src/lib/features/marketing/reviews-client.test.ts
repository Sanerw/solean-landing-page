import { describe, expect, it, vi } from 'vitest';
import { fetchRating } from './reviews-client';

function respondWith(body: unknown, ok = true): typeof globalThis.fetch {
	return vi.fn(async () => ({ ok, json: async () => body })) as unknown as typeof globalThis.fetch;
}

describe('fetchRating', () => {
	it('returns the parsed rating from a good response', async () => {
		await expect(fetchRating(respondWith({ stats: { total_reviews: 104, average_rating: '4.86' } }))).resolves.toEqual({
			score: 4.86,
			total: 104
		});
	});

	it('asks the profile for the storefront hostname', async () => {
		const fetch = respondWith({ stats: { total_reviews: 1, average_rating: '5' } });
		await fetchRating(fetch);

		expect(vi.mocked(fetch).mock.calls[0][0]).toContain('store=www.solean.com');
	});

	// Every failure is the same failure to the caller: the badge shows its own figures rather
	// than an empty space, so none of these may throw or resolve to something half-built.
	it('returns null on a non-ok status', async () => {
		await expect(fetchRating(respondWith({}, false))).resolves.toBeNull();
	});

	it('returns null when the body is not JSON', async () => {
		const fetch = vi.fn(async () => ({
			ok: true,
			json: async () => {
				throw new SyntaxError('not json');
			}
		})) as unknown as typeof globalThis.fetch;

		await expect(fetchRating(fetch)).resolves.toBeNull();
	});

	it('returns null when the request itself fails or times out', async () => {
		const fetch = vi.fn(async () => {
			throw new DOMException('The operation was aborted.', 'TimeoutError');
		}) as unknown as typeof globalThis.fetch;

		await expect(fetchRating(fetch)).resolves.toBeNull();
	});

	it('returns null when the body parses but says nothing usable', async () => {
		await expect(fetchRating(respondWith({ stats: { average_rating: 'excellent' } }))).resolves.toBeNull();
	});
});
