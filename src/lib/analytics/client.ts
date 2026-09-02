import { browser, dev } from '$app/environment';
import { getLocale } from '$lib/paraglide/runtime';
import { mixpanelApiHost, mixpanelToken } from './config';
import { mayTrack, type ConsentState } from './consent';

/**
 * The one place Mixpanel is spoken to. Everything above it calls `track` and knows nothing
 * about the SDK, the consent state, or whether this deployment measures at all.
 *
 * **The SDK is imported dynamically and only once a consented event is sent.** Two reasons,
 * and the second is the important one. It keeps roughly sixty kilobytes out of the bundle a
 * visitor downloads before deciding, and it means a visitor who declines never fetches the
 * analytics vendor's code at all: the refusal is honoured by the network tab, not only by a
 * flag inside a script that already ran.
 */

type Mixpanel = typeof import('mixpanel-browser').default;

let loading: Promise<Mixpanel | null> | null = null;
let consent: ConsentState = null;

/**
 * Called by the consent store, and the only writer. Held here rather than read from the
 * store so `track` stays a plain function that a `.ts` module can call.
 */
export function setAnalyticsConsent(next: ConsentState): void {
	consent = next;

	// Opting out is not just a flag: it clears the identifiers the SDK has already stored,
	// which is what makes a withdrawn consent take effect rather than only stop new events.
	if (next === 'denied' && loading) {
		void loading.then((mixpanel) => mixpanel?.opt_out_tracking());
	}
}

export function analyticsEnabled(): boolean {
	return browser && mixpanelToken() !== null;
}

async function load(): Promise<Mixpanel | null> {
	const token = mixpanelToken();
	if (!token) return null;

	const { default: mixpanel } = await import('mixpanel-browser');

	mixpanel.init(token, {
		api_host: mixpanelApiHost(),

		// The gate. Even reaching this line means someone consented, but the SDK still starts
		// opted out and is opted in below, so a future caller cannot skip the decision.
		opt_out_tracking_by_default: true,

		/**
		 * Off, and not negotiable on this site. Autocapture reports the text of the elements a
		 * visitor clicks, and on `/questionnaire/[step]` that text is the wording of medical
		 * questions and the answers chosen. Session recording is worse. Both would send exactly
		 * what `survey-state.svelte.ts` refuses to even write to `sessionStorage`.
		 */
		autocapture: false,
		record_sessions_percent: 0,

		/**
		 * No IP is forwarded, so Mixpanel derives no location from it. The site is single-market
		 * anyway, which makes geo resolution worth nothing and worth not collecting.
		 */
		ip: false,

		// `localStorage` rather than the SDK's default cookie, so the only cookie this feature
		// sets is the consent record itself and the policy has one thing to describe.
		persistence: 'localStorage',

		// Page views are sent by hand from the root layout, because SvelteKit navigates on the
		// client and the SDK's own listener would only ever see the first load.
		track_pageview: false,

		debug: dev
	});

	mixpanel.opt_in_tracking();
	mixpanel.register({ platform: 'web', locale: getLocale() });

	return mixpanel;
}

/**
 * Send an event, or do nothing at all. Nothing at all is the common case: no token, no
 * consent, or the server, and each of those is an ordinary state rather than a failure.
 *
 * `immediate` exists for the events fired on the way out of the app. Mixpanel batches by
 * default, and a batched event queued a moment before `location.assign` never leaves.
 *
 * Returns whether the event was accepted for delivery, which is what lets a caller tell a
 * sent event from one the gate dropped. A one-shot event that spent itself on a visitor who
 * had not consented yet could never be sent again.
 */
export function track(
	event: string,
	properties: Record<string, string | number | boolean> = {},
	immediate = false
): boolean {
	if (!analyticsEnabled() || !mayTrack(consent)) return false;

	loading ??= load().catch(() => null);

	void loading.then((mixpanel) => {
		// Consent can be withdrawn while the SDK is still loading; the decision at delivery is
		// the one that counts.
		if (!mixpanel || !mayTrack(consent)) return;

		mixpanel.track(
			event,
			properties,
			immediate ? { send_immediately: true, transport: 'sendBeacon' } : {}
		);
	});

	return true;
}
