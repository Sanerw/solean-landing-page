import { CONSENT_COOKIE, toDecision } from '$lib/analytics/consent';
import type { LayoutServerLoad } from './$types';

/**
 * Preview is off for every visitor until they enable it at `/preview/enable`, so this is a
 * boolean on the layout rather than anything the page has to ask for.
 *
 * The analytics decision is read here for one reason: the banner must not appear to someone
 * who already answered, and only the server sees the cookie before the first paint.
 */
export const load: LayoutServerLoad = ({ locals, cookies }) => {
	return {
		previewEnabled: locals.sanity.previewEnabled,
		analyticsConsent: toDecision(cookies.get(CONSENT_COOKIE))
	};
};
