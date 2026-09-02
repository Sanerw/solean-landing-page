import { error } from '@sveltejs/kit';
import { articleQuery as query, type ArticleDetail } from '$lib/sanity/queries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params: { slug } }) => {
	const params = { slug, language: locals.locale };
	const initial = await locals.sanity.loadQuery<ArticleDetail | null>(query, params);

	if (!initial.data) {
		error(404, 'Article not found');
	}

	return { query, params, options: { initial } };
};
