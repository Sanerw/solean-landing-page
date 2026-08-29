import { error } from '@sveltejs/kit';
import { getArticleBySlug } from '$lib/features/learn/content';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const article = getArticleBySlug(params.slug);

	if (!article) {
		error(404, 'Article not found');
	}

	return { article };
};
