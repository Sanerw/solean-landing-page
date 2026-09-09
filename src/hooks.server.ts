import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { entryRedirect } from '$lib/i18n/entry-locale';
import { legacyGermanPath } from '$lib/i18n/legacy-paths';
import { variesBy } from '$lib/i18n/vary';
import { serverClient } from '$lib/sanity/client.server';
import { isPreviewRequest } from '$lib/sanity/preview-request';
import { loadPublishedQuery } from '$lib/sanity/query.server';

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
				headers: { location: preferred.href, vary: variesBy(event.url) }
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
		// of the headers `variesBy` names, so a shared cache may not hand it to somebody who
		// sends others. Unconditional now, where it once covered the prefix-less addresses only:
		// from the moment these pages carry `s-maxage`, an `/en/...` response cached without
		// `Vary: Cookie` would be replayed to a visitor whose remembered German should have
		// bounced them off it.
		response.headers.append('Vary', variesBy(event.url));

		return response;
	});
};

/**
 * Built once per server instance, on the first request that is actually previewing. Everything
 * it imports is the Studio, so this is the one place allowed to reach for it.
 *
 * `handlePreviewMode` mints its preview secret when it is constructed, which used to happen at
 * boot and now happens here. The property that matters is unchanged: one secret per instance,
 * so a preview cookie does not survive a new one.
 */
let previewHandle: Promise<Handle> | undefined;

function sanityPreview(): Promise<Handle> {
	previewHandle ??= import('@sanity/sveltekit').then(
		({ handlePreviewMode, handleQueryLoader, setServerClient }) => {
			setServerClient(serverClient);

			return sequence(
				handlePreviewMode({ client: serverClient, preview: { redirect } }),
				handleQueryLoader()
			);
		}
	);

	return previewHandle;
}

/**
 * Preview gets the vendor's handles, with drafts, the source map and the overlays. Everybody
 * else gets the two fields this app actually reads.
 */
const handleSanity: Handle = async ({ event, resolve }) => {
	if (isPreviewRequest(event.url.pathname, event.request.headers.get('cookie'))) {
		return (await sanityPreview())({ event, resolve });
	}

	event.locals.sanity = { previewEnabled: false, loadQuery: loadPublishedQuery };

	return resolve(event);
};

// Locale first, so the Sanity handle and everything it resolves run with it already set.
export const handle = sequence(handleLocale, handleSanity);
