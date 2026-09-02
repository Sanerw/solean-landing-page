import { announcementQuery, type Announcement } from '$lib/sanity/queries';
import type { LayoutServerLoad } from './$types';

/**
 * The announcement bar sits above every marketing page, so its copy is read here rather than
 * on the landing page. Only the bar's own fields are projected: the rest of the home page
 * document is the landing page's business, and the legal pages should not pay for it.
 */
export const load: LayoutServerLoad = async ({ locals }) => {
	const announcement = await locals.sanity.loadQuery<Announcement | null>(announcementQuery, {
		language: locals.locale
	});

	return { announcement: announcement.data };
};
