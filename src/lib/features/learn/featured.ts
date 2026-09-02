import { error, redirect } from '@sveltejs/kit';
import { ROUTES } from '$lib/features/marketing/content';
import { localizeHref } from '$lib/paraglide/runtime';
import { featuredArticleSlugQuery } from '$lib/sanity/queries';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Sends a reader to the newest article. Shared by `/learn` and `/learn/blog`, which are both
 * signposts rather than pages of their own.
 *
 * The slug is read from Sanity rather than kept as a constant, because an editor can rename it
 * now. A hardcoded slug would send both of these, and the 404 page's own "read the article"
 * button, to a 404 the moment someone renamed the article in the Studio.
 */
export async function redirectToFeaturedArticle(locals: RequestEvent['locals']): Promise<never> {
	const slug = await locals.sanity.loadQuery<string | null>(featuredArticleSlugQuery, {
		language: locals.locale
	});

	if (!slug.data) {
		error(404, 'No article has been published yet');
	}

	// Localised: the bare path is German, so an unprefixed redirect would drop an English
	// reader into the German article.
	redirect(307, localizeHref(ROUTES.learnArticle(slug.data)));
}
