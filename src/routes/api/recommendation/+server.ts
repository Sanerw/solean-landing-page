import { env } from '$env/dynamic/public';
import { json } from '@sveltejs/kit';
import { fetchRecommendation } from '$lib/server/rxscale/recommendation';
import type { RequestHandler } from './$types';

/**
 * What RxScale recommends for one submitted anamnesis, trimmed to what a screen can show.
 * The raw document is over a megabyte of catalogue graph, so it is read here and most of it
 * never leaves this process.
 *
 * The uid is the visitor's own and is used for one upstream read. Nothing is stored or
 * logged, and the endpoint answers for whatever uid it is given: the anamnesis is the
 * capability, exactly as it is at RxScale's own public endpoint.
 */
export const GET: RequestHandler = async ({ url }) => {
	const anamnesisUid = (url.searchParams.get('anamnesis') ?? '').trim();
	if (!anamnesisUid) return json({ ok: false, reason: 'missing-anamnesis' }, { status: 400 });

	const storeDomain = (env.PUBLIC_SHOPIFY_STORE_DOMAIN ?? '').trim();
	if (!storeDomain) return json({ ok: false, reason: 'not-configured' }, { status: 500 });

	const result = await fetchRecommendation(anamnesisUid, storeDomain);

	return result.ok ? json(result) : json(result, { status: result.reason === 'not-configured' ? 500 : 502 });
};
