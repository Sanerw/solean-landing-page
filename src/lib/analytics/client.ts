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
type MixpanelInitOptions = NonNullable<Parameters<Mixpanel['init']>[1]>;

/**
 * The SDK's settings, returned as a value rather than written inline at the call site, so
 * the ones this project's privacy story rests on can be asserted by a test that never loads
 * Mixpanel. Every flag here is a decision or a default pinned on purpose; none is incidental,
 * and `client.test.ts` fails if one of them moves.
 */
export function mixpanelInitOptions(recorderSrc: string): MixpanelInitOptions {
	return {
		api_host: mixpanelApiHost(),

		// The gate. Even reaching this line means someone consented, but the SDK still starts
		// opted out and is opted in below, so a future caller cannot skip the decision.
		opt_out_tracking_by_default: true,

		/**
		 * Off, and not negotiable on this site. Autocapture reports the text of the elements a
		 * visitor clicks, and on `/questionnaire/[step]` that text is the wording of medical
		 * questions and the answers chosen, in clear.
		 *
		 * Heatmaps do not need it, and leaving it off is what makes them safe: the click
		 * properties are built by the same code either way, but `capture_text_content` lives in
		 * the autocapture config, and `Autocapture.getFullConfig()` returns `{}` while this is
		 * `false`. `$el_text` is therefore unreachable rather than merely defaulted off.
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

		/**
		 * Heatmaps, on for every page, the same decision and the same date as the replay above.
		 *
		 * It buys clicks and scroll depth, and it costs two things worth naming. Collection
		 * runs through the Autocapture module whatever `autocapture` is set to, so `$mp_click`,
		 * `$mp_dead_click`, `$mp_rage_click` and `$mp_web_page_view` start being sent; they are
		 * exempt from event billing, not from the privacy rules. And `$mp_web_page_view`
		 * carries the full URL, so questionnaire paths now reach Mixpanel through it. That is
		 * the replay trade again rather than a new one, but `isTrackablePath` no longer keeps
		 * every questionnaire path out of the project, only out of `page_viewed`.
		 *
		 * `$mp_click` reports the tracked attributes of every ancestor, `aria-label` among
		 * them, and the choice fields put the answer's own wording there for screen readers.
		 * `QuestionnaireShell` carries `mp-sensitive` for exactly that reason; without it this
		 * flag would send the chosen answer in clear.
		 */
		record_heatmap_data: true,

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

		/**
		 * Our own page views are sent by hand from the root layout, because SvelteKit navigates
		 * on the client and the SDK's own listener would only ever see the first load. This does
		 * not silence the heatmap's `$mp_web_page_view`, which the flag above forces on.
		 */
		track_pageview: false,

		debug: dev
	};
}

/**
 * Start recording, then re-apply the heatmap flag, and the second half is the part that is
 * not obvious.
 *
 * `is_recording_heatmap_data()` is `getSessionReplayId() && record_heatmap_data`, and
 * `autocapture.init()` has already run synchronously inside `mixpanel.init()`, before the
 * recorder bundle loaded and assigned a replay id. Its listeners register off the raw config
 * and so survive, but the one thing it does eagerly, the `$mp_web_page_view` that anchors a
 * heatmap to a page, is skipped. Later client-side navigations send one; the page the visitor
 * arrived on never does, and that is usually the landing page.
 *
 * `set_config` re-runs `autocapture.init()` whenever the key is present, and each `init*`
 * helper removes its listener before re-adding it, so nothing is doubled. The declared return
 * type of `start_session_recording` is `void`, but the SDK returns the promise that settles
 * once the recorder is up, which is the only moment this is worth doing.
 */
function anchorHeatmapToRecording(mixpanel: Mixpanel): void {
	const started = mixpanel.start_session_recording() as unknown as Promise<void> | void;

	void Promise.resolve(started).then(() => {
		mixpanel.set_config({ record_heatmap_data: true });
	});
}

let loading: Promise<Mixpanel | null> | null = null;
let consent: ConsentState = null;

/**
 * What a change of mind has to do to an SDK that has already been loaded and opted in.
 *
 * Separated from the call site because the rule is wrong in both directions by default.
 * `opt_out_tracking` refuses every later event inside the SDK, and nothing undoes that on its
 * own, so a visitor who declined and then agreed would have `mayTrack` say yes while the SDK
 * quietly dropped everything. Resuming on every yes is the other mistake: an ordinary load
 * with a stored yes would force a recording past the configured share.
 */
export type ConsentTransition = 'stop' | 'resume' | 'none';

export function consentTransition(previous: ConsentState, next: ConsentState): ConsentTransition {
	// Deliberately not `previous === 'granted'`: an unknown previous state that turns into a
	// no should stop, because the cost of stopping twice is nothing and the cost of missing it
	// is a recording that outlives the refusal.
	if (next === 'denied') return previous === 'denied' ? 'none' : 'stop';

	return next === 'granted' && previous === 'denied' ? 'resume' : 'none';
}

/**
 * Called by the consent store, and the only writer. Held here rather than read from the
 * store so `track` stays a plain function that a `.ts` module can call.
 */
export function setAnalyticsConsent(next: ConsentState): void {
	const transition = consentTransition(consent, next);
	consent = next;

	// No SDK yet means nothing to undo or redo: a stored decision seeded at load is applied by
	// `load` itself, which starts opted out and opts in once.
	if (!loading) return;

	void loading.then((mixpanel) => {
		if (!mixpanel) return;

		if (transition === 'stop') {
			// The recorder has to be stopped by name. `opt_out_tracking` clears persistence and
			// refuses further events, but it never touches rrweb, so a session already being
			// recorded would go on being recorded after the person withdrew.
			mixpanel.stop_session_recording();

			// Not just a flag: it clears the identifiers the SDK has already stored, which is what
			// makes a withdrawn consent take effect rather than only stop new events.
			mixpanel.opt_out_tracking();
		}

		if (transition === 'resume') {
			mixpanel.opt_in_tracking();

			// Through the same sampling a fresh load uses. `start_session_recording` forces a
			// recording, so resuming without the roll would record every visitor who changed
			// their mind regardless of the configured share.
			//
			// The identifiers were cleared on the way out, so this is a new anonymous visitor
			// rather than the old one resumed. That is the honest outcome of a withdrawal.
			if (shouldRecordSession(replaySessionsPercent())) anchorHeatmapToRecording(mixpanel);
		}
	});
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

	mixpanel.init(token, mixpanelInitOptions(recorderSrc));

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
	 *
	 * The heatmap rides on the same decision: no recording means no replay id, and without one
	 * `is_recording_heatmap_data()` is false, so turning the share down turns both off.
	 */
	if (shouldRecordSession(replaySessionsPercent())) anchorHeatmapToRecording(mixpanel);

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
