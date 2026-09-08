import { error } from '@sveltejs/kit';
import { journalArticlesFrom, neighboursOf } from '$lib/features/learn/journal';
import {
	articleQuery as query,
	articlesQuery,
	type ArticleDetail,
	type ArticleListItem
} from '$lib/sanity/queries';
import type { PageServerLoad } from './$types';

/**
 * Server-side, not a universal load: the Sanity read has to run where the preview token and
 * the draft perspective live, and `locals.locale` is set by the Paraglide handle. Translations
 * are separate documents, so the language is part of the query, never an afterthought.
 *
 * The library is read alongside the article for the two neighbour links. It is the Journal's
 * own query rather than a slimmer one of this page's, because the neighbours are only correct
 * while the two agree about the order: a second `order()` written here is one edit away from
 * the Journal and the article disagreeing about what "next" means.
 */
export const load: PageServerLoad = async ({ locals, params: { slug } }) => {
	const params = { slug, language: locals.locale };
	const [initial, library] = await Promise.all([
		locals.sanity.loadQuery<ArticleDetail | null>(query, params),
		locals.sanity.loadQuery<ArticleListItem[] | null>(articlesQuery, { language: locals.locale })
	]);

	if (!initial.data) {
		error(404, 'Article not found');
	}

	const { previous, next } = neighboursOf(journalArticlesFrom(library.data ?? []), slug);
	const link = (article?: { title: string; slug: string }) =>
		article && { title: article.title, slug: article.slug };

	// The shape `useQuery` expects on the client, when preview upgrades this to a live query.
	// The neighbours sit outside it: they are not this article's content, and a live query on
	// the article should not be re-running the library on every keystroke in the Studio.
	return {
		query,
		params,
		options: { initial },
		neighbours: { previous: link(previous), next: link(next) }
	};
};
