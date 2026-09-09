import { error, text } from '@sveltejs/kit';
import { deploymentMayIndex } from '$lib/seo/indexing';
import { toSitemapXml } from '$lib/seo/sitemap';
import { seoPolicy } from '$lib/server/seo/config';
import { publishedPages } from '$lib/server/seo/inventory';
import type { RequestHandler } from './$types';

export const prerender = false;

/**
 * The published pages, for a crawler.
 *
 * It reads nothing off the request but the origin it was asked on: no locale cookie, no
 * `Accept-Language`, no draft perspective. Both languages of every page are listed in one
 * document, so what a crawler is offered cannot depend on who fetched it.
 *
 * Before launch this is an empty `urlset` rather than a 404. A document saying "nothing is
 * published here" is the truth about a deployment that is `noindex` throughout, and it is also
 * what makes the switch itself observable: the same URL answers with content on the day
 * indexing is approved.
 */
export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const policy = seoPolicy();
	const origin = policy.origin;

	// `X-Robots-Tag: noindex` is not set here: the SEO hook already adds it to every response
	// that is not an indexable HTML page, which a sitemap never is. Setting it as well appended
	// a second copy, and `noindex, noindex` is a header nobody meant to write.
	if (!origin || !deploymentMayIndex(policy, url.origin)) {
		setHeaders({ 'content-type': 'application/xml; charset=utf-8' });

		return text(toSitemapXml(origin ?? url.origin, []));
	}

	let pages;
	try {
		pages = await publishedPages();
	} catch {
		// A content outage is not an empty site. Answering 200 with no URLs would tell a crawler
		// every page had been withdrawn, which is a removal it would act on; 503 is a retry.
		error(503, 'The published content could not be read');
	}

	setHeaders({
		'content-type': 'application/xml; charset=utf-8',
		'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=60'
	});

	return text(toSitemapXml(origin, pages));
};
