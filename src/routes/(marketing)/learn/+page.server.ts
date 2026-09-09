import { journalArticlesFrom } from '$lib/features/learn/journal';
import { articlesQuery, type ArticleListItem } from '$lib/sanity/queries';
import { seoLinks } from '$lib/server/seo/identity';
import type { PageServerLoad } from './$types';

/**
 * Server-side, like the article page's own read: the preview token and the draft perspective
 * live there, and `locals.locale` is set by the Paraglide handle. Translations are separate
 * documents, so the language is part of the query rather than a filter afterwards.
 *
 * An empty list is not an error. The Journal renders its own header and says nothing about
 * articles, which is what an unpublished dataset should look like rather than a 500.
 */
export const load: PageServerLoad = async ({ locals }) => {
	const [articles, seo] = await Promise.all([
		locals.sanity.loadQuery<ArticleListItem[] | null>(articlesQuery, {
			language: locals.locale
		}),
		seoLinks(locals.locale, { kind: 'journal' })
	]);

	return { articles: journalArticlesFrom(articles.data ?? []), seo };
};
