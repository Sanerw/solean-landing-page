import { journalArticlesFrom } from '$lib/features/learn/journal';
import { m } from '$lib/paraglide/messages';
import { articlesQuery, type ArticleListItem } from '$lib/sanity/queries';
import { ogImage } from '$lib/seo/og-image';
import { pageSeo } from '$lib/server/seo/identity';
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
	const articles = await locals.sanity.loadQuery<ArticleListItem[] | null>(articlesQuery, {
		language: locals.locale
	});

	// The featured card's photograph, which is the newest article's: the query orders by the
	// review date and `splitJournal` features the first, so this is the picture on the page.
	const seo = await pageSeo(locals.locale, { kind: 'journal' }, {
		title: m.title_journal({}, { locale: locals.locale }),
		description: m.meta_journal({}, { locale: locals.locale }),
		image: ogImage(articles.data?.[0]?.hero)
	});

	return { articles: journalArticlesFrom(articles.data ?? []), seo };
};
