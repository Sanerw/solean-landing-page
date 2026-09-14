import { beforeEach, describe, expect, it, vi } from 'vitest';
import { consentTransition, mixpanelInitOptions } from './client';

/**
 * The SDK, `$app/environment` and the token are all stubbed so the consent gate can be
 * exercised at all: `analyticsEnabled()` is false on the server, so without `browser` every
 * call would be refused for the wrong reason and the test would prove nothing.
 *
 * The replay share is zero so no recording is started here. This file is about the gate, and
 * `config.test.ts` already owns the sampling.
 */
const sdk = vi.hoisted(() => ({
	init: vi.fn(),
	register: vi.fn(),
	track: vi.fn(),
	identify: vi.fn(),
	people: { set: vi.fn(), set_once: vi.fn() },
	get_distinct_id: vi.fn(() => 'jonas@example.com'),
	opt_in_tracking: vi.fn(),
	opt_out_tracking: vi.fn(),
	set_config: vi.fn(),
	start_session_recording: vi.fn(() => Promise.resolve()),
	stop_session_recording: vi.fn()
}));

vi.mock('mixpanel-browser/dist/mixpanel-with-async-recorder.cjs', () => ({ default: sdk }));
vi.mock('$app/environment', () => ({ browser: true, dev: false }));
vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_MIXPANEL_TOKEN: 'token', PUBLIC_MIXPANEL_REPLAY_PERCENT: '0' }
}));

/** The SDK is loaded once per module instance, so each case starts from a fresh one. */
async function freshClient() {
	vi.resetModules();

	return import('./client');
}

/**
 * A regression harness rather than a unit test of behaviour. Each assertion here stands for a
 * decision recorded in `AGENTS.md`, and the SDK fails silently or leaks quietly when one of
 * them is undone: nothing throws, nothing logs, and the damage is visible only in Mixpanel.
 */
describe('mixpanelInitOptions', () => {
	const options = mixpanelInitOptions('/recorder.js');

	it('leaves autocapture off, which is what keeps the heatmap safe', () => {
		// Not a preference. `capture_text_content` lives in the autocapture config, and
		// `Autocapture.getFullConfig()` returns `{}` while this is false, so `$el_text` cannot
		// be switched on by accident. Turning autocapture on to "improve" the heatmap would
		// start reporting the wording of medical questions and the answers chosen.
		expect(options.autocapture).toBe(false);
	});

	it('collects heatmap data', () => {
		expect(options.record_heatmap_data).toBe(true);
	});

	it('masks every text node and every input explicitly', () => {
		// Both default to true, and both are stated because the SDK flips `maskAll` to false as
		// soon as a masking selector is configured without them.
		expect(options.record_mask_all_text).toBe(true);
		expect(options.record_mask_all_inputs).toBe(true);
	});

	it('records no channel that would carry page content into a replay', () => {
		expect(options.record_console).toBe(false);
		expect(options.record_network).toBe(false);
		expect(options.record_canvas).toBe(false);
		expect(options.record_collect_fonts).toBe(false);
		expect(options.record_block_selector).toBe('img, video, audio');
	});

	it('forwards the IP, which is the only thing a location comes from', () => {
		// Reversed on 2026-09-14 and still a guard rather than a preference: flipping it back
		// empties every country, region and city in the panel, silently and with no error
		// anywhere. It is asserted in this direction for the same reason it was asserted in the
		// other one.
		expect(options.ip).toBe(true);
	});

	it('starts opted out, so consent cannot be skipped by a future caller', () => {
		expect(options.opt_out_tracking_by_default).toBe(true);
	});

	it('leaves the SDK page view off, because ours is sent by hand', () => {
		// This does not silence the heatmap's own `$mp_web_page_view`, which
		// `record_heatmap_data` forces on. It silences the SDK's ordinary one, which would only
		// ever see the first load in a client-routed app.
		expect(options.track_pageview).toBe(false);
	});

	it('serves the recorder from the address it is given', () => {
		// The SDK's own CDN URL for this version is a 404 that answers with HTML, which Chrome
		// rejects as ERR_BLOCKED_BY_ORB, and recording then never starts.
		expect(options.recorder_src).toBe('/recorder.js');
	});
});

/**
 * The consent path's one piece of real logic. It is unreachable through the UI today, because
 * `ConsentBanner` renders only while the decision is missing, so this is the whole coverage
 * that stands behind it.
 */
describe('consentTransition', () => {
	it('stops when a yes becomes a no', () => {
		expect(consentTransition('granted', 'denied')).toBe('stop');
	});

	it('stops on a no from an unknown state, because stopping twice costs nothing', () => {
		expect(consentTransition(null, 'denied')).toBe('stop');
	});

	it('resumes only when a no becomes a yes', () => {
		expect(consentTransition('denied', 'granted')).toBe('resume');
	});

	it('does nothing on an ordinary load, so a stored yes cannot force a recording', () => {
		// The seeded decision, applied before anything is loaded, and the repeat of a decision
		// already in force. Resuming here would bypass `record_sessions_percent` entirely.
		expect(consentTransition(null, 'granted')).toBe('none');
		expect(consentTransition('granted', 'granted')).toBe('none');
		expect(consentTransition('denied', 'denied')).toBe('none');
	});

	it('does nothing when a decision is cleared rather than changed', () => {
		for (const previous of ['granted', 'denied', null] as const) {
			expect(consentTransition(previous, null)).toBe('none');
		}
	});
});

/**
 * The identity seam. Every assertion here stands for the decision of 2026-09-14 that put a
 * real e-mail address into analytics: it may travel only behind the same gate an event does,
 * and the decision that counts is the one in force at delivery, not at the call.
 */
describe('identity', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('sends nothing before anyone has consented', async () => {
		const { identifyVisitor, setProfileOnce } = await freshClient();

		expect(identifyVisitor('jonas@example.com', { $email: 'jonas@example.com' })).toBe(false);
		expect(setProfileOnce({ first_locale: 'de' })).toBe(false);
		expect(sdk.init).not.toHaveBeenCalled();
	});

	it('sends nothing after a refusal', async () => {
		const { identifyVisitor, setAnalyticsConsent } = await freshClient();

		setAnalyticsConsent('denied');

		expect(identifyVisitor('jonas@example.com', { $email: 'jonas@example.com' })).toBe(false);
	});

	it('names the person and writes the traits once consent is granted', async () => {
		const { identifyVisitor, setAnalyticsConsent } = await freshClient();

		setAnalyticsConsent('granted');

		expect(identifyVisitor('jonas@example.com', { $email: 'jonas@example.com' })).toBe(true);

		await vi.waitFor(() => expect(sdk.identify).toHaveBeenCalledWith('jonas@example.com'));
		// `identify` first, because it is what flushes the People queue `set_once` fills.
		expect(sdk.people.set).toHaveBeenCalledWith({ $email: 'jonas@example.com' });
	});

	it('drops a call whose consent was withdrawn while the SDK was still importing', async () => {
		const { identifyVisitor, setAnalyticsConsent } = await freshClient();

		setAnalyticsConsent('granted');
		expect(identifyVisitor('jonas@example.com', { $email: 'jonas@example.com' })).toBe(true);

		// The import has not resolved yet, so this is the realistic race: the banner answered a
		// moment after a screen that identified.
		setAnalyticsConsent('denied');

		await vi.waitFor(() => expect(sdk.opt_out_tracking).toHaveBeenCalled());
		expect(sdk.identify).not.toHaveBeenCalled();
		expect(sdk.people.set).not.toHaveBeenCalled();
	});

	it('queues first-visit properties behind the same gate', async () => {
		const { setProfileOnce, setAnalyticsConsent } = await freshClient();

		setAnalyticsConsent('granted');

		expect(setProfileOnce({ first_locale: 'de', first_landing_path: '/' })).toBe(true);

		await vi.waitFor(() =>
			expect(sdk.people.set_once).toHaveBeenCalledWith({
				first_locale: 'de',
				first_landing_path: '/'
			})
		);
	});
});

/**
 * The join key the deferred revenue import will read off an order. Its whole contract is that
 * it never blocks a purchase, so every refusal below is a null rather than a throw.
 */
describe('visitorDistinctId', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		sdk.get_distinct_id.mockReturnValue('jonas@example.com');
	});

	it('gives nothing before anyone has consented', async () => {
		const { visitorDistinctId } = await freshClient();

		expect(visitorDistinctId()).toBeNull();
	});

	it('gives nothing after a refusal', async () => {
		const { visitorDistinctId, setAnalyticsConsent } = await freshClient();

		setAnalyticsConsent('denied');

		expect(visitorDistinctId()).toBeNull();
	});

	it('gives nothing while the SDK is still importing', async () => {
		const { visitorDistinctId, setAnalyticsConsent, track } = await freshClient();

		setAnalyticsConsent('granted');
		track('page_viewed', { path: '/' });

		// The import has been started and has not resolved, which is the state a visitor is in
		// if they consent on the screen that orders. An order with no join key beats a checkout
		// click that waited for an analytics bundle.
		expect(visitorDistinctId()).toBeNull();
	});

	it('gives the id once the SDK is up and consent stands', async () => {
		const { visitorDistinctId, setAnalyticsConsent, track } = await freshClient();

		setAnalyticsConsent('granted');
		track('page_viewed', { path: '/' });
		await vi.waitFor(() => expect(sdk.register).toHaveBeenCalled());

		expect(visitorDistinctId()).toBe('jonas@example.com');
	});

	it('treats an id the SDK cannot give as no id', async () => {
		const { visitorDistinctId, setAnalyticsConsent, track } = await freshClient();

		setAnalyticsConsent('granted');
		track('page_viewed', { path: '/' });
		await vi.waitFor(() => expect(sdk.register).toHaveBeenCalled());

		sdk.get_distinct_id.mockReturnValue('');

		expect(visitorDistinctId()).toBeNull();
	});
});
