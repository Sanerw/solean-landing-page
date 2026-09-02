import { cachedRating } from '$lib/features/marketing/rating-cache';
import { homePageQuery, type HomePage } from '$lib/sanity/queries';
import type { PageServerLoad } from './$types';

/**
 * The rating is read here rather than in the browser: no CORS, no third-party request on the
 * critical path, and the figures are in the server-rendered HTML instead of appearing after
 * paint. Null when Reviews.io cannot be reached, which the badge answers with its own
 * figures rather than an empty space.
 *
 * Nothing sets `cache-control` here. A `s-maxage` on this response caches the whole rendered
 * page at Vercel's edge, where a Sanity publish cannot reach it, and an editor's change waited
 * out the hour before it appeared. Reviews.io is protected by the cache around its own call
 * instead.
 */
export const load: PageServerLoad = async ({ fetch, locals }) => {
	const [rating, home] = await Promise.all([
		cachedRating(fetch),
		locals.sanity.loadQuery<HomePage | null>(homePageQuery, { language: locals.locale })
	]);

	return { rating, home: home.data };
};
