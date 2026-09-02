import { articlesQuery as query, type ArticleListItem } from '$lib/sanity/queries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const params = { language: locals.locale };
	const initial = await locals.sanity.loadQuery<ArticleListItem[]>(query, params);

	// `useQuery` on the client expects exactly these three field names.
	return { query, params, options: { initial } };
};
