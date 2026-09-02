import { browser, dev } from '$app/environment';
/**
 * The recorder, served from our own origin instead of Mixpanel's CDN, and this is a fix
 * rather than a preference. The SDK asks for
 * `https://cdn.mxpnl.com/libs/mixpanel-recorder-BbPxtaqp.js`, and that URL is a 404 that
 * answers with an HTML error page, so Chrome rejects it as ERR_BLOCKED_BY_ORB and recording
 * never starts. The file itself ships inside the package; `?url` emits it as an asset and
 * hands us a same-origin address for it.
 *
 * The hash in the name is the installed version's. On a `mixpanel-browser` upgrade this
 * import fails the build, which is the failure worth having: the alternative is a silent
 * 404 at runtime that nobody notices until the replays are missing.
 */
import recorderSrc from 'mixpanel-browser/dist/async-modules/mixpanel-recorder-BbPxtaqp.js?url';
import { getLocale } from '$lib/paraglide/runtime';
import {
	mixpanelApiHost,
	mixpanelToken,
	replaySessionsPercent,
	shouldRecordSession
} from './config';
import { mayTrack, type ConsentState } from './consent';

/**
 * The one place Mixpanel is spoken to. Everything above it calls `track` and knows nothing
 * about the SDK, the consent state, or whether this deployment measures at all.
 *
 * **The SDK is imported dynamically and only once a consented event is sent.** Two reasons,
 * and the second is the important one. It keeps roughly sixty kilobytes out of the bundle a
 * visitor downloads before deciding, and it means a visitor who declines never fetches the
 * analytics vendor's code at all: the refusal is honoured by the network tab, not only by a
 * flag inside a script that already ran. The session recorder is a second script, fetched
 * from `cdn.mxpnl.com` only once recording actually starts, so the same holds for it.
 */

/**
 * The recorder build, not the default entry point, and this is not interchangeable. In
 * `mixpanel-browser`'s main bundle `load_extra_bundle` throws "not available in this build",
 * so `record_sessions_percent` is read, the sampling passes, and recording then fails to
 * start with no error anyone sees. Only the `with-async-recorder` build ships a loader.
 *
 * The recorder itself is a second script the SDK appends from `cdn.mxpnl.com`, and only at
 * the moment recording begins, so it stays behind the consent gate like everything else.
 */
type MixpanelModule = typeof import('mixpanel-browser/dist/mixpanel-with-async-recorder.cjs');
type Mixpanel = MixpanelModule extends { default: infer T } ? T : MixpanelModule;

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
	//
	// The recorder has to be stopped by name. `opt_out_tracking` clears persistence and
	// refuses further events, but it never touches rrweb, so a session already being recorded
	// would go on being recorded after the person withdrew.
	if (next === 'denied' && loading) {
		void loading.then((mixpanel) => {
			mixpanel?.stop_session_recording();
			mixpanel?.opt_out_tracking();
		});
	}
}

export function analyticsEnabled(): boolean {
	return browser && mixpanelToken() !== null;
}

async function load(): Promise<Mixpanel | null> {
	const token = mixpanelToken();
	if (!token) return null;

	const imported = await import('mixpanel-browser/dist/mixpanel-with-async-recorder.cjs');
	// A CommonJS build, so the interop shape depends on the bundler: Vite gives the namespace
	// a `default`, a plain CJS require gives the module object itself.
	const mixpanel = ((imported as { default?: Mixpanel }).default ?? imported) as Mixpanel;

	mixpanel.init(token, {
		api_host: mixpanelApiHost(),

		// The gate. Even reaching this line means someone consented, but the SDK still starts
		// opted out and is opted in below, so a future caller cannot skip the decision.
		opt_out_tracking_by_default: true,

		/**
		 * Off, and not negotiable on this site. Autocapture reports the text of the elements a
		 * visitor clicks, and on `/questionnaire/[step]` that text is the wording of medical
		 * questions and the answers chosen, in clear.
		 */
		autocapture: false,

		/**
		 * Session replay, on for every page including the questionnaire. A product decision,
		 * taken knowingly on 2026-09-03, and the masking below is what it rests on.
		 *
		 * What the masking does not cover, and what accepting this meant: the questionnaire
		 * model is public and identical for every visitor, fetched by uid without
		 * authentication. A recording therefore keeps the structure, the option positions and
		 * the click, and those plus the model reconstruct the answers even though every label
		 * is masked. Replays of the funnel should be treated as medical records: access
		 * restricted, retention short, and named in the privacy policy.
		 */
		record_sessions_percent: replaySessionsPercent(),

		// Same-origin, for the 404 the import above describes. It also means the feature adds
		// no third-party script to a page.
		recorder_src: recorderSrc,

		/**
		 * Stated rather than inherited, and that is deliberate. Both masks default to true in
		 * 2.82.1, but the SDK also flips `maskAll` to false the moment a masking *selector* is
		 * configured without one of these (`getPrivacyConfig`, the migration branch). Setting
		 * them explicitly means a later "unmask just the headings" cannot silently unmask the
		 * whole page.
		 */
		record_mask_all_text: true,
		record_mask_all_inputs: true,

		// Defaults, pinned for the same reason: each one is a channel that would otherwise
		// carry page content into a replay.
		record_block_selector: 'img, video, audio',
		record_network: false,
		record_canvas: false,
		record_collect_fonts: false,

		// The SDK records console output by default. Nothing should log an answer, but a
		// recording is the wrong place to discover that something did.
		record_console: false,

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

	/**
	 * Started by name, and it has to be. The SDK's own auto-start runs once, inside `init`,
	 * behind its opt-out check, and this client is opted out at exactly that moment by design;
	 * nothing re-runs it afterwards except `reset`, which an app without accounts never calls.
	 * Left to the SDK, `record_sessions_percent` would be read, the sampling would pass, and
	 * no recording would ever start, silently.
	 *
	 * Sampling is ours for the same reason: `start_session_recording` forces a recording and
	 * ignores the configured share, so the share has to be honoured before the call.
	 */
	if (shouldRecordSession(replaySessionsPercent())) mixpanel.start_session_recording();

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
