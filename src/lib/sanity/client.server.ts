import { env } from '$env/dynamic/private';
import { client } from '$lib/sanity/client';

/**
 * Reads drafts, so it is server-only and never imported from a component. The token may be
 * absent: without one the site still renders published content and preview simply stays off.
 * Dynamic for that reason, since a static import turns an absent variable into a build failure,
 * which would make the documented tokenless deployment impossible.
 *
 * Separated from the client it configures so a test can read it, the way the analytics client's
 * options are: a flag here fails silently rather than loudly.
 */
export const serverClientConfig = {
	token: env.SANITY_API_READ_TOKEN,
	// Published reads go through Sanity's own CDN, which answered in 15 ms against the API's
	// 65 ms when both were measured on 2026-09-09, once per query and up to three per page.
	//
	// This cannot serve a stale draft, and not by care: `createQueryStore`'s loader passes
	// `useCdn: false` explicitly on every perspective other than `published`, so preview reads
	// the API whatever is set here. See
	// `@sanity/sveltekit/dist/query/store/createQueryStore.js` before doubting it.
	useCdn: true,
	stega: true
};

export const serverClient = client.withConfig(serverClientConfig);
