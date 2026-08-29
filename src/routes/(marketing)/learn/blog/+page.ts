import { redirect } from '@sveltejs/kit';
import { FEATURED_ARTICLE_SLUG, ROUTES } from '$lib/features/marketing/content';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	redirect(307, ROUTES.learnArticle(FEATURED_ARTICLE_SLUG));
};
