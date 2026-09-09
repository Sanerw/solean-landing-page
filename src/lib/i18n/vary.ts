import { deLocalizeUrl } from '$lib/paraglide/runtime';

/**
 * Which request headers this response was decided from, and so what a shared cache has to key
 * it by. It matters from the moment a page is cacheable at all: get it wrong and the edge hands
 * a German page to somebody who asked for English, which is the failure the language work of
 * 2026-09-09 had just removed.
 *
 * Every address depends on the cookie, prefixed or not, because Paraglide's `cookie` strategy
 * runs before `url`: a remembered German turns `/en/learn` into a 307 to `/learn`, and a
 * remembered English does the reverse.
 *
 * Only an address that names no language also depends on `Accept-Language`, because that is the
 * one case `entryRedirect` reads it in. Naming it on `/en/...` too would be free correctness and
 * expensive caching: browsers send long, varied language strings, and each distinct one would be
 * a cache entry of its own for a page whose answer never changes with it.
 */
export function variesBy(url: URL): string {
	return url.pathname === deLocalizeUrl(url).pathname ? 'Accept-Language, Cookie' : 'Cookie';
}
