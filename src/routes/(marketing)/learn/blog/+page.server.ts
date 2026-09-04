import { redirect } from '@sveltejs/kit';
import { ROUTES } from '$lib/features/marketing/content';
import { localizeHref } from '$lib/paraglide/runtime';
import type { PageServerLoad } from './$types';

/**
 * `/learn/blog` has no page of its own; the Journal at `/learn` is the index. It used to
 * resolve the newest article and send the reader into it, which left the site with no listing
 * at all. Localised, because the bare path is German.
 */
export const load: PageServerLoad = () => redirect(308, localizeHref(ROUTES.learn));
