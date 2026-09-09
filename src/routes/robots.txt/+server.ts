import { text } from '@sveltejs/kit';
import { deploymentMayIndex } from '$lib/seo/indexing';
import { toRobotsTxt } from '$lib/seo/sitemap';
import { seoPolicy } from '$lib/server/seo/config';
import type { RequestHandler } from './$types';

export const prerender = false;

/**
 * A route rather than the static file it replaces, because what it says depends on the launch
 * switch and on the origin it was asked on: an alias or a preview deployment must not advertise
 * the sitemap of the real one.
 *
 * The sitemap is named only once indexing is on. Crawling itself is never blocked, for the
 * reason `toRobotsTxt` records: `noindex` only works on a page a crawler is allowed to fetch.
 */
export const GET: RequestHandler = ({ url, setHeaders }) => {
	const policy = seoPolicy();
	const enabled = policy.origin !== null && deploymentMayIndex(policy, url.origin);

	setHeaders({
		'content-type': 'text/plain; charset=utf-8',
		'cache-control': 'public, max-age=0, s-maxage=3600'
	});

	return text(toRobotsTxt(enabled ? `${policy.origin}/sitemap.xml` : null));
};
