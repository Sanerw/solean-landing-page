import { error } from '@sveltejs/kit';
import { cachedRating } from '$lib/features/marketing/rating-cache';
import { findTreatmentPage } from '$lib/features/treatments/content';
import type { PageServerLoad } from './$types';

/**
 * The rating is read here, not in the browser, for the reasons the landing page's load
 * records: no CORS, no third-party request on the critical path, and the figures are in the
 * server-rendered HTML instead of appearing after paint. `cachedRating` is the same shared
 * instance the landing page uses, so a visitor moving between the two pages reads one set of
 * figures and Reviews.io is not called twice.
 *
 * The page itself is resolved here only to decide whether it exists. What is returned is the
 * slug, because the copy is built from messages during render: baking the strings into the
 * load payload would freeze them to the locale of whichever request produced them, and would
 * send every string over the wire for no gain.
 */
export const load: PageServerLoad = async ({ params, fetch }) => {
	if (!findTreatmentPage(params.slug)) {
		error(404, 'No such treatment');
	}

	return { slug: params.slug, rating: await cachedRating(fetch) };
};
