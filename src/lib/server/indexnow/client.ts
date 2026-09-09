import {
	buildSubmission,
	classifyStatus,
	INDEXNOW_ENDPOINT,
	refusalReason,
	type SubmissionOutcome
} from '$lib/seo/indexnow';
import { seoPolicy } from '$lib/server/seo/config';
import { indexNowKey, notificationsAllowed } from './config';

/**
 * How long one URL stays quiet after it has been submitted.
 *
 * An editor correcting a typo publishes the same document several times in a minute, and each
 * publish fires the webhook. Without this, one sitting produces one submission per keystroke's
 * worth of second thoughts, and IndexNow rate-limits the key for the trouble. Five minutes is
 * far shorter than any engine's recrawl, so nothing is actually delayed by it.
 */
const COLLAPSE_MS = 5 * 60 * 1000;

type Fetch = typeof globalThis.fetch;

/**
 * The one place IndexNow is spoken to, and only ever from the server.
 *
 * A factory rather than a module-level cache, so a test builds its own instance and no state
 * leaks between cases. `submit` never throws and never retries: a notification is a courtesy,
 * and nothing about a search engine being unreachable may become this app's problem.
 */
export function createNotifier(fetchImpl: Fetch = globalThis.fetch) {
	const submittedAt = new Map<string, number>();

	function fresh(urls: readonly string[], now: number): string[] {
		return urls.filter((url) => now - (submittedAt.get(url) ?? -Infinity) >= COLLAPSE_MS);
	}

	return async function submit(
		requestOrigin: string,
		urls: readonly string[]
	): Promise<SubmissionOutcome> {
		// Every gate first, before anything is built and before the key is even read.
		if (!notificationsAllowed(requestOrigin)) return 'skipped';

		const key = indexNowKey();
		const origin = seoPolicy().origin;
		if (!key || !origin) return 'skipped';

		const now = Date.now();
		const pending = fresh(urls, now);
		if (pending.length === 0) return 'skipped';

		const body = buildSubmission(origin, key, pending);
		if (!body) return 'skipped';

		// Recorded before the call, not after: a submission that timed out may well have
		// arrived, and repeating it on the next publish is the wasteful outcome, not the safe
		// one. The window expires either way.
		for (const url of body.urlList) submittedAt.set(url, now);

		let response: Response;
		try {
			response = await fetchImpl(INDEXNOW_ENDPOINT, {
				method: 'POST',
				headers: { 'content-type': 'application/json; charset=utf-8' },
				body: JSON.stringify(body)
			});
		} catch {
			// Unreachable is not an error worth a stack trace. The sitemap still advertises
			// every page, so the only cost is that this one page waits for an ordinary crawl.
			console.warn('[indexnow] the service could not be reached');

			return 'unreachable';
		}

		const outcome = classifyStatus(response.status);
		if (outcome === 'refused') {
			// The count, never the URLs: a log line is not the place for a list of what changed,
			// and the key and the signature may never appear in one at all.
			console.error(
				`[indexnow] refused ${body.urlList.length} url(s): ${refusalReason(response.status)}`
			);
		}

		return outcome;
	};
}

/** One per server instance, so the collapse window means something across requests. */
export const notifyIndexNow = createNotifier();
