import { redirect, type Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { legacyGermanPath } from '$lib/i18n/legacy-paths';

/**
 * The middleware resolves the locale from the URL, strips the prefix before SvelteKit routes
 * the request, and holds the locale for the duration of it. Because it de-localises the URL,
 * `/en/learn/x` and `/learn/x` reach the same route: the route tree is not duplicated per
 * language and no load function grows a locale parameter.
 */
export const handle: Handle = ({ event, resolve }) => {
	// Before anything else: German lived at `/de/...` while the catalogues were being filled,
	// and both addresses still answer. One canonical URL per language, so the old one moves.
	const moved = legacyGermanPath(event.url.pathname);
	if (moved) {
		redirect(308, `${moved}${event.url.search}`);
	}

	return paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			// The document's language is the one thing that cannot come from a message, because
			// it is an attribute on the element that wraps every message.
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});
};
