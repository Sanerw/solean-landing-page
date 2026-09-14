import { track } from './client';

/**
 * Every event this site sends, and the only place a name or a property key is written.
 * Mixpanel is case-sensitive and treats a typo as a new event forever, so no caller composes
 * one.
 *
 * **What may never appear in a property.** No answer value, no anamnesis uid, no medication
 * or dose. `project-overview.md` states that the answers never reach analytics, and the funnel
 * is medical: "this visitor ordered Mounjaro 5 mg" is health data about a person even when the
 * person is an anonymous id. These events carry position in the funnel and nothing that
 * describes the human walking it.
 *
 * **Nor the contact details, which is a narrower rule than it was.** From 2026-09-14 the
 * e-mail, the name and the telephone number do reach Mixpanel, through `identity.ts`. None of
 * them may be a property *built here*: the profile is where a person is described, and a
 * property repeated on every event would be a second, uncontrolled copy of that.
 *
 * Which is not the same as saying an event never carries the address. Once `identify` has run,
 * the SDK stamps the e-mail onto every later event as `distinct_id` and `$user_id`, because
 * that is what an identity is. `analytics.spec.ts` asserts the rule this comment states, the
 * properties, and names those keys as the identity rather than a leak.
 */

/**
 * A questionnaire path is an answer in disguise, which is why no page view is sent for one.
 * The model branches on `visibleIf`, so which steps a person is shown is derived from what
 * they answered: a view of `/questionnaire/diabetes-followup` reports the reply that
 * unlocked it as surely as the reply itself would. The funnel is measured by the three
 * events below instead, which say where someone reached without saying what they said.
 *
 * **This governs `page_viewed` and nothing else.** Since heatmaps were turned on, Mixpanel's
 * own `$mp_web_page_view` carries the full URL and `$mp_click` carries `$pathname`, so
 * questionnaire paths do reach the project. That was accepted with the replay on 2026-09-03
 * and rests on the same reasoning; what still may not travel is the wording of an answer,
 * which `mp-sensitive` keeps out of the click properties. This rule is the one that keeps our
 * own funnel events free of the path, and it stays.
 */
export function isTrackablePath(path: string): boolean {
	return path !== '/questionnaire' && !path.startsWith('/questionnaire/');
}

/**
 * One-shot events, guarded per page load. The module has the same lifetime as the survey
 * session it reports on, so a reload legitimately starts a new one and moving between steps
 * does not.
 */
const sent = new Set<string>();

function once(event: string, properties: Record<string, string | number | boolean>): void {
	if (sent.has(event)) return;

	// Marked only once it is actually away. A visitor who arrives on the questionnaire from an
	// advert answers the consent banner while standing on it, and an event spent against a
	// gate that dropped it would leave that arrival permanently unrecorded.
	if (track(event, properties)) sent.add(event);
}

/** A page was viewed. Sent on the first load and on every client-side navigation after it. */
export function trackPageView(path: string): void {
	if (!isTrackablePath(path)) return;

	track('page_viewed', { path });
}

/**
 * The visitor opened a questionnaire step. Fires on the first one only, and carries the step
 * it entered at rather than the one it is on, so a deep link is distinguishable from the
 * front door without reporting progress step by step.
 */
export function trackQuestionnaireStarted(entryStepId: string): void {
	once('questionnaire_started', { entry_step_id: entryStepId });
}

/**
 * One-shot per screen rather than per event name, which is why it has a set of its own: this
 * event is meant to fire a dozen times in a walk, once for each screen, and exactly once for
 * each. The name is still one constant, never composed.
 */
const screensReported = new Set<string>();

/**
 * The visitor reached a questionnaire screen. Sent on entry rather than on Continue, because
 * somebody who opens a screen and abandons it never presses Continue, and they are precisely
 * who this event exists to count.
 *
 * **It names the screen, decided on 2026-09-14.** The build plan wrote this event as the
 * number alone, inheriting `isTrackablePath`'s rule. Two facts overruled it: the screen id
 * already travels, on the heatmap's `$mp_web_page_view` and on `questionnaire_started`'s own
 * `entry_step_id`; and four of the twelve screens are conditional, so screen five is a
 * different question for different people and an index alone says how far somebody got rather
 * than what stopped them.
 *
 * The id names the question asked, never the reply. No answer value travels with it.
 */
export function trackQuestionnaireProgressed(
	screenId: string,
	screenNumber: number,
	screenTotal: number
): void {
	if (screensReported.has(screenId)) return;

	// Marked only once it is away, the rule `once` follows and for the same reason: a screen
	// spent against a gate the visitor has not yet answered would never be reported again.
	if (track('questionnaire_progressed', {
		screen_id: screenId,
		screen_number: screenNumber,
		screen_total: screenTotal
	})) {
		screensReported.add(screenId);
	}
}

/**
 * RxScale accepted the submission and a doctor will read the record. The count is of survey
 * steps in the plan the branching produced, which is a shape of questionnaire rather than
 * anything about the answers.
 */
export function trackAnamnesisSubmitted(surveyStepCount: number): void {
	once('anamnesis_submitted', { survey_step_count: surveyStepCount });
}

/**
 * The value moment: the cart exists at Shopify and the browser is leaving for the checkout.
 * Sent immediately, because the redirect follows it within the same tick.
 *
 * `plan_mode` is the commerce distinction the screen itself makes, a delivered treatment
 * against a prescription alone. It is deliberately not the product or the dose.
 */
export function trackCheckoutStarted(planMode: string, hasRecommendation: boolean): void {
	track('checkout_started', { plan_mode: planMode, has_recommendation: hasRecommendation }, true);
}
