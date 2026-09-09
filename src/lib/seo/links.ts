import { baseLocale } from '$lib/paraglide/runtime';
import { localePath, type PageIdentity } from './pages';

export interface AlternateLink {
	hreflang: string;
	href: string;
}

/** What the document head renders: one canonical, and alternates only where they are real. */
export interface PageLinks {
	canonical: string;
	alternates: AlternateLink[];
}

export function absoluteUrl(origin: string, path: string): string {
	return `${origin}${path}`;
}

/**
 * The links for one published page.
 *
 * The canonical is built from the page's own identity rather than from the request, so a
 * tracking parameter, an alias host or a locale cookie cannot change it. `null` when no origin
 * is configured: an invented domain is worse than no canonical, and neither may cost a visitor
 * the page.
 *
 * A page published in one language only gets no alternates at all. `hreflang` describes a set,
 * and a set of one says nothing a crawler can act on while claiming a translation exists.
 */
export function pageLinks(
	origin: string | null,
	identity: PageIdentity | null | undefined
): PageLinks | null {
	if (!origin || !identity) return null;

	const canonical = absoluteUrl(origin, localePath(identity.path, identity.language));
	const equivalents = identity.equivalents.filter(
		(equivalent, index, all) =>
			all.findIndex((other) => other.locale === equivalent.locale) === index
	);

	// Reciprocity is the rule a crawler checks: a set that does not name the page it is on is
	// discarded whole, so a page missing from its own set is offered no set.
	const reciprocal =
		equivalents.length > 1 && equivalents.some(({ locale }) => locale === identity.language);
	if (!reciprocal) return { canonical, alternates: [] };

	const alternates: AlternateLink[] = equivalents.map(({ locale, path }) => ({
		hreflang: locale,
		href: absoluteUrl(origin, localePath(path, locale))
	}));

	// `x-default` is what a visitor whose language is neither of ours is sent to, so it names
	// the site's own default rather than whichever translation happens to sort first.
	const fallback = equivalents.find(({ locale }) => locale === baseLocale);
	if (fallback) {
		alternates.push({
			hreflang: 'x-default',
			href: absoluteUrl(origin, localePath(fallback.path, baseLocale))
		});
	}

	return { canonical, alternates };
}
