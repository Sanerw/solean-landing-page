import { cachedRating } from '$lib/features/marketing/rating-cache';
import { m } from '$lib/paraglide/messages';
import { homePageQuery, type HomePage } from '$lib/sanity/queries';
import { ogImage } from '$lib/seo/og-image';
import { pageSeo } from '$lib/server/seo/identity';
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

	// After the query, because the sharing card is the hero photograph this page already draws.
	// The inventory behind `pageSeo` is cached per server instance, so this is not a second
	// round trip in the ordinary case.
	const seo = await pageSeo(locals.locale, { kind: 'home' }, {
		title: m.title_home({}, { locale: locals.locale }),
		description: m.meta_home({}, { locale: locals.locale }),
		image: ogImage(home.data?.hero?.image)
	});

	return { rating, home: home.data, seo };
};
