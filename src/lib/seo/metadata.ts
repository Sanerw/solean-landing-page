import type { Locale } from '$lib/paraglide/runtime';
import { plain } from '$lib/sanity/plain';
import type { AlternateLink } from './links';

/** What `og:site_name` says. The logo prints it on every page. */
export const SITE_NAME = 'Solean';

/**
 * Open Graph wants a language-and-territory tag rather than a bare language. German is the
 * German market's; English is `en_GB` rather than `en_US` because this site addresses the EU
 * and nothing here is a US offering.
 */
const OG_LOCALE: Record<Locale, string> = { de: 'de_DE', en: 'en_GB' };

export interface OgImage {
	url: string;
	width: number;
	height: number;
	alt: string;
}

/**
 * The half of a page's metadata that needs an absolute origin: where the page lives, what it is
 * called elsewhere, and the picture a chat client draws. Absent when no origin is configured or
 * the page is not in the published inventory, which is the same rule the canonical follows.
 */
export interface PageSharing {
	canonical: string;
	alternates: AlternateLink[];
	image?: OgImage;
}

/**
 * One public page's metadata.
 *
 * `title` and `description` are deliberately outside `sharing`: a deployment with no
 * `PUBLIC_SITE_URL` still renders a titled page, and losing the title to a missing SEO setting
 * would be a visible regression rather than a quiet one.
 */
export interface PageSeo {
	title: string;
	description: string;
	type: 'website' | 'article';
	locale: Locale;
	sharing: PageSharing | null;
	/**
	 * The structured data, already serialised and already escaped for a `<script>` element.
	 * Text rather than an object because the layout prints it verbatim: see `toJsonLd`, where
	 * the escaping is a security control rather than formatting.
	 */
	jsonLd?: string | null;
}

/** One `<meta>` element, as the attribute that names it and the value it carries. */
export interface MetaTag {
	/** Open Graph keys itself on `property`; Twitter on `name`. Exactly one is set. */
	property?: string;
	name?: string;
	content: string;
}

/**
 * The sharing tags for one page.
 *
 * Empty without `sharing`, because an Open Graph block whose `og:url` is missing describes a
 * page a scraper cannot address. The title and the description are still rendered by the page
 * itself in that case; only the sharing half goes.
 *
 * Every value passes through `plain()`: a Sanity string carries invisible source markers while
 * preview is on, and a marker inside a `content` attribute travels into whatever scrapes it.
 */
export function sharingTags(seo: PageSeo | null | undefined): MetaTag[] {
	if (!seo?.sharing) return [];

	const { canonical, image } = seo.sharing;
	const tags: MetaTag[] = [
		{ property: 'og:type', content: seo.type },
		{ property: 'og:site_name', content: SITE_NAME },
		{ property: 'og:locale', content: OG_LOCALE[seo.locale] },
		{ property: 'og:url', content: canonical },
		{ property: 'og:title', content: plain(seo.title) },
		{ property: 'og:description', content: plain(seo.description) }
	];

	// The other languages this page exists in, which Open Graph spells as a repeated key.
	for (const alternate of seo.sharing.alternates) {
		const locale = alternate.hreflang;
		if (locale === 'x-default' || locale === seo.locale) continue;
		if (locale in OG_LOCALE) {
			tags.push({ property: 'og:locale:alternate', content: OG_LOCALE[locale as Locale] });
		}
	}

	if (image) {
		tags.push(
			{ property: 'og:image', content: image.url },
			{ property: 'og:image:width', content: String(image.width) },
			{ property: 'og:image:height', content: String(image.height) },
			{ property: 'og:image:alt', content: plain(image.alt) }
		);
	}

	// A card with a picture where there is one, and the plain card where there is not. Naming
	// `summary_large_image` without an image gives a scraper a promise the page cannot keep.
	tags.push({ name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' });

	return tags;
}
