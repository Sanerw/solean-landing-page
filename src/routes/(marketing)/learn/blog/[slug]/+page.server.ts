import { error } from '@sveltejs/kit';
import { journalArticlesFrom, neighboursOf } from '$lib/features/learn/journal';
import {
	articleQuery as query,
	articlesQuery,
	type ArticleDetail,
	type ArticleListItem
} from '$lib/sanity/queries';
import { m } from '$lib/paraglide/messages';
import { plain } from '$lib/sanity/plain';
import { ogImage } from '$lib/seo/og-image';
import { pageSeo } from '$lib/server/seo/identity';
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

	// After the 404, because the title is the document's own: an article nobody published has
	// no title to give. `plain` because these two strings end up in `content` attributes, and a
	// preview marker inside one travels to whatever scrapes it.
	const document = initial.data;
	const seo = await pageSeo(
		locals.locale,
		{ kind: 'article', slug },
		{
			title: `${plain(document.seoTitle ?? document.title)} | Solean`,
			description: plain(document.seoDescription ?? document.summary ?? ''),
			type: 'article',
			image: ogImage(document.hero),
			article: {
				// The article's own headline, without the site suffix the `<title>` wears.
				headline: plain(document.title),
				description: plain(document.seoDescription ?? document.summary ?? ''),
				...(document.reviewedAt ? { published: document.reviewedAt } : {}),
				...(document._updatedAt ? { modified: document._updatedAt } : {}),
				...(document.reviewer?.name ? { reviewer: plain(document.reviewer.name) } : {})
			},
			// The trail the page draws: it carries a "back to the Journal" link, and the header's
			// logo goes home. Every step here is a link a reader can actually follow.
			breadcrumb: [
				{ name: m.nav_home({}, { locale: locals.locale }), path: '/' },
				{ name: m.nav_learn({}, { locale: locals.locale }), path: '/learn' },
				{ name: plain(document.title), path: `/learn/blog/${slug}` }
			]
		}
	);

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
		neighbours: { previous: link(previous), next: link(next) },
		seo
	};
};
