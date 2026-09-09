import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { handlePreviewMode, handleQueryLoader, setServerClient } from '@sanity/sveltekit';
import { deLocalizeUrl } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { entryRedirect } from '$lib/i18n/entry-locale';
import { legacyGermanPath } from '$lib/i18n/legacy-paths';
import { serverClient } from '$lib/sanity/client.server';

setServerClient(serverClient);

const VARIES_BY = 'Accept-Language, Cookie';

/**
 * The middleware resolves the locale from the URL, strips the prefix before SvelteKit routes
 * the request, and holds the locale for the duration of it. Because it de-localises the URL,
 * `/en/learn/x` and `/learn/x` reach the same route: the route tree is not duplicated per
 * language and no load function grows a locale parameter.
 */
const handleLocale: Handle = ({ event, resolve }) => {
	// Before anything else: German lived at `/de/...` while the catalogues were being filled,
	// and both addresses still answer. One canonical URL per language, so the old one moves.
	const moved = legacyGermanPath(event.url.pathname);
	if (moved) {
		redirect(308, `${moved}${event.url.search}`);
	}

	// An address that names no language is answered in the language the visitor is already
	// reading, or failing that the one their browser asks for. Documents only: a data or asset
	// request answering 307 would break the navigation it belongs to, and the address it would
	// move to is the page's anyway.
	if (event.request.headers.get('sec-fetch-dest') === 'document') {
		const preferred = entryRedirect(event.url, {
			cookie: event.request.headers.get('cookie'),
			acceptLanguage: event.request.headers.get('accept-language')
		});

		if (preferred) {
			// Not `redirect()`: this response has to carry `Vary` itself, being the one decision
			// on the site made from request headers rather than from the URL.
			return new Response(null, {
				status: 307,
				headers: { location: preferred.href, vary: VARIES_BY }
			});
		}
	}

	return paraglideMiddleware(event.request, async ({ request, locale }) => {
		event.request = request;
		// Sanity keeps one document per language, so every query needs the locale as a
		// parameter. Load functions read it here rather than re-deriving it from the URL.
		event.locals.locale = locale;

		const response = await resolve(event, {
			// The document's language is the one thing that cannot come from a message, because
			// it is an attribute on the element that wraps every message.
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});

		// The other half of the rule above: this page was served rather than redirected because
		// of those two headers, so a shared cache may not hand it to somebody who sends others.
		// Both are named, not just the language: a 307 produced for a remembered English would
		// otherwise be replayed to a German visitor who happens to send the same Accept-Language.
		if (event.url.pathname === deLocalizeUrl(event.url).pathname) {
			response.headers.append('Vary', VARIES_BY);
		}

		return response;
	});
};

// Locale first, so the Sanity handles and everything they resolve run with it already set.
export const handle = sequence(
	handleLocale,
	handlePreviewMode({ client: serverClient, preview: { redirect } }),
	handleQueryLoader()
);
