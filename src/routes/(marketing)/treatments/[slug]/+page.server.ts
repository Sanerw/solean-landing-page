import { error } from '@sveltejs/kit';
import { findTreatment, treatmentDisplayName } from '$lib/domain';
import { cachedRating } from '$lib/features/marketing/rating-cache';
import { m } from '$lib/paraglide/messages';
import type { Locale } from '$lib/paraglide/runtime';
import { toSharedSections, toTreatmentPages } from '$lib/features/treatments/from-sanity';
import {
	treatmentsQuery,
	treatmentsPageQuery,
	type SanityImage,
	type SanityTreatment,
	type SanityTreatmentsPage
} from '$lib/sanity/queries';
import { ogImage } from '$lib/seo/og-image';
import { pageSeo } from '$lib/server/seo/identity';
import type { PageServerLoad } from './$types';

/**
 * The page's own title, description and sharing card, which name the treatment.
 *
 * The name comes from the catalogue, which owns it, exactly as the rendered page does. The
 * slug is known to exist by the time this runs: the load answers an unknown one with a 404
 * before asking for metadata.
 */
function treatmentSeo(locale: Locale, slug: string, photo: SanityImage | undefined) {
	const treatment = findTreatment(slug);
	const name = treatment ? treatmentDisplayName(treatment) : slug;

	return pageSeo(
		locale,
		{ kind: 'treatment', slug },
		{
			title: m.title_treatment({ name }, { locale }),
			description: m.meta_treatment({ name }, { locale }),
			image: ogImage(photo),
			// The trail the page draws above its title. "Treatments" carries no path on purpose:
			// the page renders it as text rather than a link, because that index is undrawn and
			// would answer 404, and the markup may not send a crawler where the page will not
			// send a reader.
			breadcrumb: [
				{ name: m.nav_home({}, { locale }), path: '/' },
				{ name: m.nav_treatments({}, { locale }) },
				{ name, path: `/treatments/${slug}` }
			]
		}
	);
}

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

	// After the 404, because a slug nobody published is not a page to describe. The photograph
	// is read off the document rather than the mapped page: the mapped one carries a width
	// ladder built for the gallery frame, and a scraper needs one fixed crop instead.
	const seo = await treatmentSeo(
		locals.locale,
		params.slug,
		treatments.data?.find((document) => document.treatmentId === params.slug)?.photo
	);

	return {
		slug: params.slug,
		page,
		// Ordered by the catalogue so the comparison's own sort has a stable input, and sent as
		// entries because a Map does not survive serialisation to the browser.
		treatments: [...pages.values()],
		shared: toSharedSections(shared.data),
		rating,
		seo
	};
};
