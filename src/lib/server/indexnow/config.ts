import { env } from '$env/dynamic/private';
import { deploymentMayIndex } from '$lib/seo/indexing';
import { seoPolicy } from '$lib/server/seo/config';

/**
 * The IndexNow key.
 *
 * **Not a secret**, despite being read from private env. It is served verbatim at
 * `/{key}.txt` so a search engine can confirm we control this host, so anyone who can fetch
 * that file has it. It is private only so a deployment can choose not to have one.
 *
 * The real secret on this feature is the webhook signing secret, which is never served
 * anywhere. Keep the two apart.
 */
export function indexNowKey(): string | null {
	const key = env.INDEXNOW_KEY?.trim();

	// IndexNow requires 8 to 128 hexadecimal-ish characters. A key outside that is a
	// misconfiguration that would be rejected on every submission, so it reads as absent
	// rather than being sent and refused forever.
	return key && /^[A-Za-z0-9-]{8,128}$/.test(key) ? key : null;
}

/**
 * Whether this deployment may tell a search engine anything at all.
 *
 * Every gate 28a already applies to indexing applies here too, and for the same reason:
 * notifying a search engine about a page that is served `noindex` is asking it to crawl
 * something we have told it to ignore. A preview deployment, a pre-launch one, an alias and an
 * unconfigured origin all send nothing.
 *
 * `requestOrigin` is the origin the webhook arrived on, so a webhook pointed at a preview
 * deployment cannot publish on the production domain's behalf.
 */
export function notificationsAllowed(requestOrigin: string): boolean {
	return indexNowKey() !== null && deploymentMayIndex(seoPolicy(), requestOrigin);
}
