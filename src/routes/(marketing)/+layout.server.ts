import { edgeCacheControl } from '$lib/http/edge-cache';
import { announcementQuery, type Announcement } from '$lib/sanity/queries';
import type { LayoutServerLoad } from './$types';

/**
 * The announcement bar sits above every marketing page, so its copy is read here rather than
 * on the landing page. Only the bar's own fields are projected: the rest of the home page
 * document is the landing page's business, and the legal pages should not pay for it.
 *
 * The cache header is set here for the same reason and with the same reach: one place owns it,
 * and it covers the marketing group alone. `setHeaders` throws on a second call for the same
 * header, so no page below may set `cache-control` of its own. The questionnaire is a different
 * route group and is deliberately not in it: those responses carry medical answers.
 */
export const load: LayoutServerLoad = async ({ locals, setHeaders }) => {
	const cacheControl = edgeCacheControl(locals.sanity.previewEnabled);
	if (cacheControl) {
		setHeaders({ 'cache-control': cacheControl });
	}

	const announcement = await locals.sanity.loadQuery<Announcement | null>(announcementQuery, {
		language: locals.locale
	});

	return { announcement: announcement.data };
};
