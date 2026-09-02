import { fetchRating } from './reviews-client';
import type { Rating } from './reviews';

/**
 * How long a good answer is reused. The home page is rendered per request, so without this
 * Reviews.io would be called once per visitor. An hour-old score on a badge is not a defect;
 * a rate-limited third party would be.
 */
const FRESH_MS = 60 * 60 * 1000;

/**
 * A failure is held too, briefly. Otherwise an outage costs every visitor the 1.2s timeout
 * instead of one visitor a minute.
 */
const FAILED_MS = 60 * 1000;

type Load = (fetch: typeof globalThis.fetch) => Promise<Rating | null>;

/**
 * A factory rather than a bare module cache, so a test builds its own instance and no state
 * leaks between cases. The load function never throws, which is what lets the entry be written
 * without a failure branch of its own.
 */
export function createRatingCache(load: Load = fetchRating): Load {
	let value: Rating | null = null;
	let expiresAt = 0;
	let inFlight: Promise<Rating | null> | null = null;

	return async function cachedRating(fetch) {
		if (Date.now() < expiresAt) return value;
		// A cold start answers several requests at once, and they are all asking the same
		// question, so they wait on one call rather than making one each.
		if (inFlight) return inFlight;

		inFlight = load(fetch).then((result) => {
			value = result;
			expiresAt = Date.now() + (result ? FRESH_MS : FAILED_MS);
			inFlight = null;

			return result;
		});

		return inFlight;
	};
}

/** One per server instance: a cold start pays the call, the requests after it do not. */
export const cachedRating = createRatingCache();
