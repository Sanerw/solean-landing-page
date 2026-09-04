import { error } from '@sveltejs/kit';
import { LEGAL_SLUGS } from '$lib/features/legal/from-sanity';
import { legalPageQuery, type SanityLegalPage } from '$lib/sanity/queries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const page = await locals.sanity.loadQuery<SanityLegalPage | null>(legalPageQuery, {
		slug: LEGAL_SLUGS.legalNotice,
		language: locals.locale
	});

	// A legal page with no text is not a page. Failing loudly is the same choice the home page
	// and the article make: this site has no fallback copy anywhere, and inventing one here
	// would leave a stale policy on screen with nothing to say it was stale.
	if (!page.data) {
		error(404, 'This document has not been published');
	}

	return { page: page.data };
};
