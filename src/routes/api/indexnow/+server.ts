import { notifyIndexNow } from '$lib/server/indexnow/client';
import { verifyWebhook } from '$lib/server/indexnow/signature';
import { urlsToNotify } from '$lib/seo/notify-urls';
import { seoPolicy } from '$lib/server/seo/config';
import type { RequestHandler } from './$types';

/**
 * The Sanity publication webhook.
 *
 * Sanity calls this when a document is published or deleted; this asks IndexNow to recrawl the
 * pages that change as a result. The projection Sanity sends is dashboard configuration, the
 * way the Customer.io campaign is, so the contract is written down in
 * `blueprint/reference/seo-launch.md` rather than enforced here beyond what safety needs.
 *
 * **The status policy is not `/api/reminder`'s.** That endpoint answers 204 to nearly
 * everything because a failed marketing mail may never disturb somebody answering medical
 * questions. This one is called by a machine, and Sanity keeps a delivery log: an unsigned call
 * has to be a 401 and a malformed one a 400, or a webhook wired up wrongly reports success
 * forever and nobody ever finds out.
 *
 * What the outbound call did is deliberately **not** in the status. Whether IndexNow accepted,
 * refused or could not be reached is our problem to log, not Sanity's to retry: a retry storm
 * against a rate-limited service makes the situation worse, and the sitemap already advertises
 * every page.
 */
export const POST: RequestHandler = async ({ request, url }) => {
	// The raw bytes, read once and before anything parses them: the signature covers exactly
	// these, so parsing first and re-serialising would never verify.
	const body = await request.text();

	if (!(await verifyWebhook(request.headers, body))) {
		return new Response(null, { status: 401 });
	}

	let event: unknown;
	try {
		event = JSON.parse(body);
	} catch {
		return new Response(null, { status: 400 });
	}

	// An array passes a bare `typeof` check and would then derive nothing and answer 204, which
	// is exactly the silent success this endpoint's status policy exists to prevent.
	if (typeof event !== 'object' || event === null || Array.isArray(event)) {
		return new Response(null, { status: 400 });
	}

	// `null` when no origin is configured, which `notifyIndexNow` would refuse anyway. Deriving
	// nothing here keeps the URL list empty rather than building strings against a placeholder.
	const origin = seoPolicy().origin;
	const urls = origin ? urlsToNotify(origin, event) : [];

	const outcome = urls.length > 0 ? await notifyIndexNow(url.origin, urls) : 'skipped';

	// The outcome, never the URLs: a log line is not the place for a list of what changed.
	if (outcome === 'refused' || outcome === 'unreachable') {
		console.warn(`[indexnow] webhook accepted, submission ${outcome}`);
	}

	return new Response(null, { status: 204 });
};
