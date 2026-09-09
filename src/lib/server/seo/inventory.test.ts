import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInventoryCache } from './inventory';

vi.mock('$lib/sanity/query.server', () => ({ loadPublishedQuery: vi.fn() }));

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

const raw = { home: [{ language: 'de' }, { language: 'en' }] };

describe('published page inventory', () => {
	it('reads once and serves the rest from the cache', async () => {
		const load = vi.fn().mockResolvedValue(raw);
		const pages = createInventoryCache(load);

		expect(await pages()).toHaveLength(4);
		await pages();
		vi.advanceTimersByTime(4 * 60 * 1000);
		await pages();

		expect(load).toHaveBeenCalledTimes(1);
	});

	it('reads again once the entry is stale', async () => {
		const load = vi.fn().mockResolvedValue(raw);
		const pages = createInventoryCache(load);

		await pages();
		vi.advanceTimersByTime(6 * 60 * 1000);
		await pages();

		expect(load).toHaveBeenCalledTimes(2);
	});

	it('answers concurrent callers from one read', async () => {
		const load = vi.fn().mockResolvedValue(raw);
		const pages = createInventoryCache(load);

		await Promise.all([pages(), pages(), pages()]);

		expect(load).toHaveBeenCalledTimes(1);
	});

	// The sitemap has to answer an outage with a retriable error, so a failure may neither be
	// swallowed into an empty inventory nor cached as one.
	it('propagates a content-service failure and retries the next caller', async () => {
		const load = vi.fn()
			.mockRejectedValueOnce(new Error('upstream unavailable'))
			.mockResolvedValue(raw);
		const pages = createInventoryCache(load);

		await expect(pages()).rejects.toThrow('upstream unavailable');
		expect(await pages()).toHaveLength(4);
		expect(load).toHaveBeenCalledTimes(2);
	});
});
