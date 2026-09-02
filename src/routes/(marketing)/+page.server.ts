import { fetchRating } from '$lib/features/marketing/reviews-client';
import { homePageQuery, type HomePage } from '$lib/sanity/queries';
import type { PageServerLoad } from './$types';

/**
 * The rating is read here rather than in the browser: no CORS, no third-party request on the
 * critical path, and the figures are in the server-rendered HTML instead of appearing after
 * paint. Null when Reviews.io cannot be reached, which the badge answers with its own
 * figures rather than an empty space.
 */
export const load: PageServerLoad = async ({ fetch, setHeaders, locals }) => {
	// Cached at the edge, so the shop's own traffic does not become traffic on Reviews.io. A
	// rating that is an hour stale is not a defect; a rate-limited third party would be.
	setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' });

	const [rating, home] = await Promise.all([
		fetchRating(fetch),
		locals.sanity.loadQuery<HomePage | null>(homePageQuery, { language: locals.locale })
	]);

	return { rating, home: home.data };
};
