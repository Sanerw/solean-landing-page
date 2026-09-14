import { beforeEach, describe, expect, it, vi } from 'vitest';

// The client reaches `$app/environment` and the Paraglide runtime, neither of which exists
// outside SvelteKit. Stubbing it also makes the assertion the right one: what matters here is
// exactly which name and which properties leave this module, not that Mixpanel received them.
type TrackArgs = [string, Record<string, string | number | boolean>?, boolean?];

const track = vi.fn<(...args: TrackArgs) => boolean>(() => true);
vi.mock('./client', () => ({ track: (...args: TrackArgs) => track(...args) }));

/** Module state guards the one-shot events, so each test gets a fresh module. */
async function events() {
	vi.resetModules();
	track.mockReset();
	track.mockReturnValue(true);

	return import('./events');
}

describe('isTrackablePath', () => {
	it('sends marketing, learn and legal paths', async () => {
		const { isTrackablePath } = await events();

		for (const path of ['/', '/en', '/learn', '/learn/mounjaro-vs-wegovy', '/privacy']) {
			expect(isTrackablePath(path)).toBe(true);
		}
	});

	it('never sends a questionnaire path', async () => {
		const { isTrackablePath } = await events();

		// The model branches on `visibleIf`, so the presence of a step in someone's walk is
		// derived from what they answered. The path is the answer.
		for (const path of ['/questionnaire', '/questionnaire/weight', '/questionnaire/complete']) {
			expect(isTrackablePath(path)).toBe(false);
		}
	});

	it('does not mistake a path that merely starts with the same letters', async () => {
		const { isTrackablePath } = await events();

		expect(isTrackablePath('/questionnaires-explained')).toBe(true);
	});
});

describe('trackPageView', () => {
	it('sends the path it was given', async () => {
		const { trackPageView } = await events();

		trackPageView('/learn');

		expect(track).toHaveBeenCalledWith('page_viewed', { path: '/learn' });
	});

	it('sends nothing at all for a questionnaire step', async () => {
		const { trackPageView } = await events();

		trackPageView('/questionnaire/diabetes-followup');

		expect(track).not.toHaveBeenCalled();
	});
});

describe('funnel events', () => {
	beforeEach(() => {
		track.mockClear();
	});

	it('sends questionnaire_started once per session, whatever the walk', async () => {
		const { trackQuestionnaireStarted } = await events();

		trackQuestionnaireStarted('start');
		trackQuestionnaireStarted('weight');
		trackQuestionnaireStarted('goals');

		expect(track).toHaveBeenCalledTimes(1);
		expect(track).toHaveBeenCalledWith('questionnaire_started', { entry_step_id: 'start' });
	});

	it('does not spend a one-shot event on a gate that dropped it', async () => {
		const { trackQuestionnaireStarted } = await events();

		// Someone arriving from an advert answers the consent banner while standing on the
		// first question. The event has to survive being refused until they answer it.
		track.mockReturnValue(false);
		trackQuestionnaireStarted('start');
		expect(track).toHaveBeenCalledTimes(1);

		track.mockReturnValue(true);
		trackQuestionnaireStarted('start');
		expect(track).toHaveBeenCalledTimes(2);

		// And once it is away, it stays away.
		trackQuestionnaireStarted('start');
		expect(track).toHaveBeenCalledTimes(2);
	});

	it('sends anamnesis_submitted with the step count and nothing else', async () => {
		const { trackAnamnesisSubmitted } = await events();

		trackAnamnesisSubmitted(14);

		expect(track).toHaveBeenCalledWith('anamnesis_submitted', { survey_step_count: 14 });
	});

	it('sends checkout_started immediately, because a redirect follows it', async () => {
		const { trackCheckoutStarted } = await events();

		trackCheckoutStarted('prescription', true);

		expect(track).toHaveBeenCalledWith(
			'checkout_started',
			{ plan_mode: 'prescription', has_recommendation: true },
			true
		);
	});

	it('reports an order placed on the fallback variant as having no recommendation', async () => {
		const { trackCheckoutStarted } = await events();

		trackCheckoutStarted('treatment', false);

		expect(track).toHaveBeenCalledWith(
			'checkout_started',
			{ plan_mode: 'treatment', has_recommendation: false },
			true
		);
	});
});

describe('the privacy boundary', () => {
	it('never carries an answer, an e-mail, a uid, or a medication', async () => {
		const { trackAnamnesisSubmitted, trackCheckoutStarted, trackPageView, trackQuestionnaireStarted } =
			await events();

		trackPageView('/');
		trackQuestionnaireStarted('start');
		trackAnamnesisSubmitted(9);
		trackCheckoutStarted('treatment', true);

		const forbidden = ['email', 'anamnesis', 'uid', 'variant', 'dose', 'answer', 'weight'];
		const keys = track.mock.calls.flatMap(([, properties]) => Object.keys(properties ?? {}));


		expect(keys.length).toBeGreaterThan(0);
		for (const key of keys) {
			for (const term of forbidden) {
				expect(key.toLowerCase()).not.toContain(term);
			}
		}
	});
});

describe('trackQuestionnaireProgressed', () => {
	it('names the screen, its position and the walk it belongs to', async () => {
		const { trackQuestionnaireProgressed } = await events();

		trackQuestionnaireProgressed('medication-history', 3, 12);

		expect(track).toHaveBeenCalledWith('questionnaire_progressed', {
			screen_id: 'medication-history',
			screen_number: 3,
			screen_total: 12
		});
	});

	it('reports one screen once, however often the effect re-runs', async () => {
		const { trackQuestionnaireProgressed } = await events();

		// Svelte re-runs the effect on any dependency change, and going back to a screen is a
		// navigation like any other. Neither is a second visit worth counting.
		for (let i = 0; i < 4; i++) trackQuestionnaireProgressed('about-you', 1, 12);

		expect(track).toHaveBeenCalledTimes(1);
	});

	it('reports each screen of the walk, because the drop-off is between them', async () => {
		const { trackQuestionnaireProgressed } = await events();

		trackQuestionnaireProgressed('about-you', 1, 12);
		trackQuestionnaireProgressed('your-details', 2, 12);

		expect(track).toHaveBeenCalledTimes(2);
		expect(track.mock.calls.map(([, properties]) => properties?.screen_id)).toEqual([
			'about-you',
			'your-details'
		]);
	});

	it('does not spend a screen on a gate that refused it', async () => {
		const { trackQuestionnaireProgressed } = await events();

		// Nothing is sent before consent, so a visitor who answers the banner while standing on a
		// screen has to be reported on the next attempt rather than lost with the first.
		track.mockReturnValueOnce(false);

		trackQuestionnaireProgressed('about-you', 1, 12);
		trackQuestionnaireProgressed('about-you', 1, 12);

		expect(track).toHaveBeenCalledTimes(2);
	});

	it('carries a walk total of its own, because the walk length varies', async () => {
		const { trackQuestionnaireProgressed } = await events();

		// Four of the twelve screens are conditional, so a total is a property of one visitor's
		// walk rather than a constant of the questionnaire.
		trackQuestionnaireProgressed('disclaimers', 8, 8);

		expect(track).toHaveBeenCalledWith(
			'questionnaire_progressed',
			expect.objectContaining({ screen_number: 8, screen_total: 8 })
		);
	});
});
