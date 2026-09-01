import { parseRating, type Rating } from './reviews';

/**
 * The shop's public Reviews.io profile. Keyed by the storefront hostname, which is what the
 * platform files the reviews under, and needs no key: the same figures are on their public
 * page.
 */
const ENDPOINT = 'https://api.reviews.io/merchant/reviews';
const STORE = 'www.solean.com';

/**
 * Someone else's service on our homepage, so it is given a short leash. The page must render
 * whether or not Reviews.io answers, and every failure is the same failure to the caller:
 * null, and the fallback figures are shown.
 *
 * The measured live response is around 100ms, so this is roughly twelve times the headroom
 * the endpoint actually needs. It is also the worst case a visitor pays on a cache miss, and
 * a slow third party must not be allowed to own the homepage's time to first byte.
 */
const TIMEOUT_MS = 1200;

export async function fetchRating(fetch: typeof globalThis.fetch): Promise<Rating | null> {
	try {
		const response = await fetch(`${ENDPOINT}?store=${encodeURIComponent(STORE)}&per_page=1`, {
			headers: { accept: 'application/json' },
			signal: AbortSignal.timeout(TIMEOUT_MS)
		});

		if (!response.ok) return null;

		return parseRating(await response.json());
	} catch {
		return null;
	}
}
