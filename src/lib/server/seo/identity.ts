import type { Locale } from '$lib/paraglide/runtime';
import { pageLinks } from '$lib/seo/links';
import type { OgImage, PageSeo } from '$lib/seo/metadata';
import { structuredData, toJsonLd, type ArticleFacts, type Crumb } from '$lib/seo/structured-data';
import { findIdentity, type PageKey } from '$lib/seo/pages';
import { seoPolicy } from './config';
import { publishedPages } from './inventory';

/** What a page knows about itself before the origin is consulted. */
export interface PageContent {
	title: string;
	description: string;
	type?: PageSeo['type'];
	/** The photograph the page already displays. Absent where it shows none. */
	image?: OgImage;
	/** Set on an article, so the graph can describe it as one. */
	article?: ArticleFacts;
	/** The trail the page itself draws. A step the page does not link carries no `url`. */
	breadcrumb?: Crumb[];
}

/**
 * One public page's metadata: what it says, and where it lives when an origin is configured.
 *
 * The sharing half is `null` when there is nothing truthful to say: no configured origin, no
 * published document behind the URL, or a content service that could not be reached. The title
 * and the description are unconditional, because a page must not lose its title to an SEO
 * setting.
 *
 * It never throws. A page's head is worth an absent link; it is not worth a visitor losing the
 * page, and on the questionnaire's side of the site it would be worth losing a submission.
 */
export async function pageSeo(
	locale: Locale,
	key: PageKey,
	content: PageContent
): Promise<PageSeo> {
	const seo: PageSeo = {
		title: content.title,
		description: content.description,
		type: content.type ?? 'website',
		locale,
		sharing: null
	};

	const { origin } = seoPolicy();
	if (!origin) return seo;

	try {
		const links = pageLinks(origin, findIdentity(await publishedPages(), key, locale));

		if (!links) return seo;

		// The image rides with the sharing half rather than beside it: a card whose picture is
		// absolute but whose `og:url` is missing describes a page a scraper cannot address.
		const shared: PageSeo = {
			...seo,
			sharing: { ...links, ...(content.image ? { image: content.image } : {}) }
		};

		// Serialised here rather than in the layout: every `@id` in the graph is absolute, so it
		// belongs where the origin is known, and the browser is handed text it only has to print.
		return {
			...shared,
			jsonLd: toJsonLd(
				structuredData({
					seo: shared,
					origin,
					...(content.article ? { article: content.article } : {}),
					...(content.breadcrumb ? { breadcrumb: content.breadcrumb } : {})
				})
			)
		};
	} catch {
		return seo;
	}
}
