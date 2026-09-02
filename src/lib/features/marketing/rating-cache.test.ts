import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRatingCache } from './rating-cache';
import type { Rating } from './reviews';

const RATING: Rating = { score: 4.86, total: 104 };
const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

/** The cache passes it through to the loader, which is mocked here, so it is never called. */
const fetch = {} as typeof globalThis.fetch;

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

describe('createRatingCache', () => {
	it('calls the loader once and reuses the answer inside the hour', async () => {
		const load = vi.fn(async () => RATING);
		const rating = createRatingCache(load);

		await expect(rating(fetch)).resolves.toEqual(RATING);
		vi.advanceTimersByTime(HOUR - 1);
		await expect(rating(fetch)).resolves.toEqual(RATING);

		expect(load).toHaveBeenCalledTimes(1);
	});

	it('reads again once the hour is up', async () => {
		const load = vi.fn(async () => RATING);
		const rating = createRatingCache(load);

		await rating(fetch);
		vi.advanceTimersByTime(HOUR);
		await rating(fetch);

		expect(load).toHaveBeenCalledTimes(2);
	});

	it('holds a failure for a minute, then retries', async () => {
		const load = vi.fn(async () => null);
		const rating = createRatingCache(load);

		await expect(rating(fetch)).resolves.toBeNull();
		vi.advanceTimersByTime(MINUTE - 1);
		await rating(fetch);
		expect(load).toHaveBeenCalledTimes(1);

		vi.advanceTimersByTime(1);
		await rating(fetch);
		expect(load).toHaveBeenCalledTimes(2);
	});

	it('shares one in-flight call between concurrent callers', async () => {
		let settle: (rating: Rating) => void = () => {};
		const load = vi.fn(() => new Promise<Rating | null>((resolve) => (settle = resolve)));
		const rating = createRatingCache(load);

		const both = Promise.all([rating(fetch), rating(fetch)]);
		settle(RATING);

		await expect(both).resolves.toEqual([RATING, RATING]);
		expect(load).toHaveBeenCalledTimes(1);
	});
});
