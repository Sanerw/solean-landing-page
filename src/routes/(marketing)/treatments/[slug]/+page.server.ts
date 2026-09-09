import { error } from '@sveltejs/kit';
import { cachedRating } from '$lib/features/marketing/rating-cache';
import { toSharedSections, toTreatmentPages } from '$lib/features/treatments/from-sanity';
import {
	treatmentsQuery,
	treatmentsPageQuery,
	type SanityTreatment,
	type SanityTreatmentsPage
} from '$lib/sanity/queries';
import type { PageServerLoad } from './$types';

/**
 * The rating is read here, not in the browser, for the reasons the landing page's load
 * records: no CORS, no third-party request on the critical path, and the figures are in the
 * server-rendered HTML instead of appearing after paint. `cachedRating` is the same shared
 * instance the landing page uses, so a visitor moving between the two pages reads one set of
 * figures and Reviews.io is not called twice.
 *
 * Every treatment is read, not just the one being viewed: the plan comparison lists them all,
 * and one response is what stops the table and the dose selector above it holding two
 * different price lists. From feature 27b the copy and the prices are Sanity's, so they are
 * resolved here rather than during render, and `locals.locale` decides the language.
 */
export const load: PageServerLoad = async ({ params, fetch, locals }) => {
	const [rating, treatments, shared] = await Promise.all([
		cachedRating(fetch),
		locals.sanity.loadQuery<SanityTreatment[] | null>(treatmentsQuery, {
			language: locals.locale
		}),
		locals.sanity.loadQuery<SanityTreatmentsPage | null>(treatmentsPageQuery, {
			language: locals.locale
		})
	]);

	const pages = toTreatmentPages(treatments.data);
	const page = pages.get(params.slug);

	// No document is the 404 now, where an absent fixture entry used to be. That also covers a
	// treatment the catalogue knows but nobody has written a page for.
	if (!page) {
		error(404, 'No such treatment');
	}

	return {
		slug: params.slug,
		page,
		// Ordered by the catalogue so the comparison's own sort has a stable input, and sent as
		// entries because a Map does not survive serialisation to the browser.
		treatments: [...pages.values()],
		shared: toSharedSections(shared.data),
		rating
	};
};
