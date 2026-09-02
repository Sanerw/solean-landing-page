import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { env } from '$env/dynamic/private';
import { handlePreviewMode, handleQueryLoader, setServerClient } from '@sanity/sveltekit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { legacyGermanPath } from '$lib/i18n/legacy-paths';
import { serverClient } from '$lib/sanity/client.server';

setServerClient(serverClient);

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

	return paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;
		// Sanity keeps one document per language, so every query needs the locale as a
		// parameter. Load functions read it here rather than re-deriving it from the URL.
		event.locals.locale = locale;

		return resolve(event, {
			// The document's language is the one thing that cannot come from a message, because
			// it is an attribute on the element that wraps every message.
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});
};

/**
 * `/preview/enable` writes this value into the preview cookie and every later request compares
 * the cookie against it again. Left unset, `handlePreviewMode` invents one per process: harmless
 * under `pnpm dev`, where the process that wrote the cookie is the one that reads it, and fatal
 * on Vercel, where the instance answering the page is almost never the instance that answered
 * `/preview/enable`. The comparison fails, `previewEnabled` stays false, and Presentation shows
 * published content with no visual editing. One value every instance shares is what makes the
 * cookie mean the same thing twice.
 *
 * Absent it falls back to that per-process value, which is the tokenless deployment: preview is
 * unreachable there anyway, so a missing variable is not an error. Dynamic for the same reason
 * the read token is, in `client.server.ts`.
 */
const previewSecret = env.SANITY_PREVIEW_SECRET || undefined;

// Locale first, so the Sanity handles and everything they resolve run with it already set.
export const handle = sequence(
	handleLocale,
	handlePreviewMode({ client: serverClient, preview: { redirect, secret: previewSecret } }),
	handleQueryLoader()
);
