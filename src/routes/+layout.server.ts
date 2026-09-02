import type { LayoutServerLoad } from './$types';

/**
 * Preview is off for every visitor until they enable it at `/preview/enable`, so this is a
 * boolean on the layout rather than anything the page has to ask for.
 */
export const load: LayoutServerLoad = ({ locals }) => {
	return { previewEnabled: locals.sanity.previewEnabled };
};
