/**
 * The shared endpoint. Submitting here forwards the notification to every participating engine,
 * so there is no per-engine list to keep.
 *
 * **Google is not one of them** and never has been. This reaches Bing, Yandex, Seznam, Naver
 * and Yep. Google discovery stays with the sitemap.
 */
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

/**
 * Far below the protocol's 10,000, because this notifies a delta rather than a site. A publish
 * that resolves to more than a handful of URLs is a bug in the derivation, and refusing it is
 * how that bug becomes visible instead of becoming traffic.
 */
export const MAX_URLS = 20;

export interface IndexNowSubmission {
	host: string;
	key: string;
	keyLocation: string;
	urlList: string[];
}

/**
 * The submission body, or `null` when there is nothing legitimate to send.
 *
 * Every URL is checked against the origin rather than trusted. IndexNow answers 422 for a URL
 * outside the host, so a stray one would cost the whole batch, and a batch is only ever built
 * from URLs this app derived: a mismatch means a bug, not a retryable condition.
 */
export function buildSubmission(
	origin: string,
	key: string,
	urls: readonly string[]
): IndexNowSubmission | null {
	const unique = [...new Set(urls)];
	if (unique.length === 0 || unique.length > MAX_URLS) return null;
	if (!unique.every((url) => url.startsWith(`${origin}/`) || url === `${origin}/`)) return null;

	return {
		host: new URL(origin).host,
		key,
		// Named explicitly rather than left to the default `/{key}.txt` convention. Both are
		// legal; saying it removes any doubt about where the engine should look.
		keyLocation: `${origin}/${key}.txt`,
		urlList: unique
	};
}

export type SubmissionOutcome = 'accepted' | 'refused' | 'unreachable' | 'skipped';

/**
 * What a status code means.
 *
 * `202` is an acceptance: it says the key is still being validated, which is the normal answer
 * for the first submission after a key changes. Treating it as a failure would log an error on
 * every launch day.
 */
export function classifyStatus(status: number): SubmissionOutcome {
	return status === 200 || status === 202 ? 'accepted' : 'refused';
}

/**
 * Why a submission was refused, for a log line. IndexNow distinguishes these and the difference
 * is what tells somebody whether to fix the key, the URLs or the rate.
 */
export function refusalReason(status: number): string {
	switch (status) {
		case 400:
			return 'malformed submission';
		case 403:
			return 'key not valid for this host';
		case 422:
			return 'URLs do not belong to this host, or the key does not match';
		case 429:
			return 'rate limited';
		default:
			return `unexpected status ${status}`;
	}
}
