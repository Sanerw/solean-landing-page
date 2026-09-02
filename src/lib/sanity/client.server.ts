import { SANITY_API_READ_TOKEN } from '$env/static/private';
import { client } from '$lib/sanity/client';

/**
 * Reads drafts, so it is server-only and never imported from a component. The token may be
 * empty: without one the site still renders published content and preview simply stays off.
 */
export const serverClient = client.withConfig({
	token: SANITY_API_READ_TOKEN,
	useCdn: false,
	stega: true
});
