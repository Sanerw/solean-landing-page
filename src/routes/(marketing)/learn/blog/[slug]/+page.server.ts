import { error } from '@sveltejs/kit';
import { articleQuery as query, type ArticleDetail } from '$lib/sanity/queries';
import type { PageServerLoad } from './$types';

/**
 * Server-side, not a universal load: the Sanity read has to run where the preview token and
 * the draft perspective live, and `locals.locale` is set by the Paraglide handle. Translations
 * are separate documents, so the language is part of the query, never an afterthought.
 */
export const load: PageServerLoad = async ({ locals, params: { slug } }) => {
	const params = { slug, language: locals.locale };
	const initial = await locals.sanity.loadQuery<ArticleDetail | null>(query, params);

	if (!initial.data) {
		error(404, 'Article not found');
	}

	// The shape `useQuery` expects on the client, when preview upgrades this to a live query.
	return { query, params, options: { initial } };
};
