import { describe, expect, it } from 'vitest';
import { consentTransition, mixpanelInitOptions } from './client';

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

	it('forwards no IP', () => {
		expect(options.ip).toBe(false);
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
