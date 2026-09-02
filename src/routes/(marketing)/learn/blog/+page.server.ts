import { redirectToFeaturedArticle } from '$lib/features/learn/featured';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => redirectToFeaturedArticle(locals);
