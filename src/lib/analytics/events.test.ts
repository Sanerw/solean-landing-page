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

		for (const path of ['/', '/en', '/learn', '/learn/blog/mounjaro-vs-wegovy', '/privacy']) {
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
