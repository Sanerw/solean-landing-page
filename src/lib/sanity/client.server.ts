import { env } from '$env/dynamic/private';
import { client } from '$lib/sanity/client';

/**
 * Reads drafts, so it is server-only and never imported from a component. The token may be
 * absent: without one the site still renders published content and preview simply stays off.
 * Dynamic for that reason, since a static import turns an absent variable into a build failure,
 * which would make the documented tokenless deployment impossible.
 */
export const serverClient = client.withConfig({
	token: env.SANITY_API_READ_TOKEN,
	useCdn: false,
	stega: true
});
