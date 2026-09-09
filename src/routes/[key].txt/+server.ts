import { error, text } from '@sveltejs/kit';
import { indexNowKey } from '$lib/server/indexnow/config';
import type { RequestHandler } from './$types';

export const prerender = false;

/**
 * The IndexNow key verification file.
 *
 * A search engine that receives a submission fetches `https://{host}/{key}.txt` and expects the
 * key back as the whole body. That is the entire ownership proof, which is why the key is a
 * public identifier rather than a credential.
 *
 * This is the first dynamic route at the top level of the site. `robots.txt` and `sitemap.xml`
 * are static segments and outrank it, but that is a property of SvelteKit's route sorting
 * rather than of this file, so `seo.spec.ts` asserts it rather than assuming it.
 *
 * A request for any other key is a 404, so the route says nothing about whether a key is
 * configured at all.
 */
export const GET: RequestHandler = ({ params, setHeaders }) => {
	const key = indexNowKey();
	if (!key || params.key !== key) {
		error(404, 'Not found');
	}

	setHeaders({ 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=0, s-maxage=3600' });

	return text(key);
};
