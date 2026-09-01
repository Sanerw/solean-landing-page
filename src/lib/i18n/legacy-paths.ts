/**
 * German moved from `/de/...` to the bare path when it became the default locale. The old
 * prefix still resolves, which would leave the same page reachable at two addresses while
 * `hreflang` names only one, so it is redirected instead of quietly served.
 *
 * Matching is on the whole segment: `/dentist` is not a German page.
 */
export function legacyGermanPath(pathname: string): string | null {
	if (pathname !== '/de' && !pathname.startsWith('/de/')) return null;

	const rest = pathname.slice('/de'.length);

	return rest === '' || rest === '/' ? '/' : rest;
}
