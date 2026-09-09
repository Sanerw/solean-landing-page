import type { Locale } from '$lib/paraglide/runtime';
import { pageLinks, type PageLinks } from '$lib/seo/links';
import { findIdentity, type PageKey } from '$lib/seo/pages';
import { seoPolicy } from './config';
import { publishedPages } from './inventory';

/**
 * The canonical and language links for the page being served, or `null` when there is nothing
 * truthful to say: no configured origin, no published document behind the URL, or a content
 * service that could not be reached.
 *
 * It never throws. A page's head is worth an absent link; it is not worth a visitor losing the
 * page, and on the questionnaire's side of the site it would be worth losing a submission.
 */
export async function seoLinks(locale: Locale, key: PageKey): Promise<PageLinks | null> {
	const { origin } = seoPolicy();
	if (!origin) return null;

	try {
		return pageLinks(origin, findIdentity(await publishedPages(), key, locale));
	} catch {
		return null;
	}
}
