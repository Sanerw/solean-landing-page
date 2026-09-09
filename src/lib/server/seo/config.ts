import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { IndexingPolicy } from '$lib/seo/indexing';
import { parseSiteOrigin } from '$lib/seo/origin';

export function seoPolicy(): IndexingPolicy {
	return {
		origin: parseSiteOrigin(publicEnv.PUBLIC_SITE_URL, !privateEnv.VERCEL && !privateEnv.VERCEL_ENV),
		enabled: privateEnv.SEO_INDEXING_ENABLED === 'true',
		// Missing Vercel system variables must not make a hosted preview look like a local run.
		vercelEnvironment: privateEnv.VERCEL_ENV ?? (privateEnv.VERCEL ? 'unknown' : undefined)
	};
}
