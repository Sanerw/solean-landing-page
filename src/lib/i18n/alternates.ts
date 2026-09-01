import { deLocalizeHref, localizeHref, locales, type Locale } from '$lib/paraglide/runtime';

export interface Alternate {
	locale: Locale;
	href: string;
}

/**
 * `localizeHref('/', { locale: 'de' })` returns `/de/`, which the server answers with a 308
 * to `/de`. An hreflang pointing at a redirect makes a search engine follow one before it can
 * index the alternate, so the slash is dropped everywhere except the root itself.
 */
function withoutTrailingSlash(href: string): string {
	return href.length > 1 && href.endsWith('/') ? href.slice(0, -1) : href;
}

/**
 * The alternates for one page: the same content in every locale, addressed from the
 * de-localised path so a visitor already on `/de/x` is offered `/x` rather than `/de/de/x`.
 */
export function alternatesFor(pathname: string): { canonical: string; alternates: Alternate[] } {
	const canonical = withoutTrailingSlash(deLocalizeHref(pathname));

	return {
		canonical,
		alternates: locales.map((locale) => ({
			locale,
			href: withoutTrailingSlash(localizeHref(canonical, { locale }))
		}))
	};
}
