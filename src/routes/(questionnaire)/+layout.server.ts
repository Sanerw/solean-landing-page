import { testimonialsQuery, type SanityTestimonial } from '$lib/sanity/queries';
import type { LayoutServerLoad } from './$types';

/**
 * The motivation screen borrows one marketing story. Read here rather than in `+layout.ts`
 * because that load also runs in the browser, and the Sanity client would then reach the
 * funnel's bundle, carrying Sanity UI's stylesheet into the questionnaire with it.
 */
export const load: LayoutServerLoad = async ({ locals }) => {
	const stories = await locals.sanity.loadQuery<SanityTestimonial[]>(testimonialsQuery, {
		language: locals.locale
	});

	return { stories: stories.data ?? [] };
};
