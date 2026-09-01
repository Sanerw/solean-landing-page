import { m } from '$lib/paraglide/messages';
import type { CheckoutFailure } from './checkout-client';

/**
 * Copy for the screen that ends the questionnaire. No price is written here any more: every
 * amount shown comes from the recommendation, which reads the shop's own catalogue, so there
 * is nothing left to keep in step by hand.
 *
 * A function rather than a constant, so its messages resolve against the active locale at
 * call time instead of freezing whichever one was current at import.
 */
export function recommendation() {
	return {
		eyebrow: m.rec_eyebrow(),
		choiceHeadline: m.rec_choice_headline(),
		choiceBody: m.rec_choice_body(),
		/**
		 * The screen that covers the recommendation read. The reference's second item reads
		 * "Checking your eligibility", which this funnel must not claim: the questionnaire never
		 * judges, and approval happens in RxScale's doctor review. These two name the two waits
		 * that are actually happening.
		 */
		building: {
			headline: m.rec_building_headline(),
			steps: [
				{ label: m.rec_building_step_1(), done: true },
				{ label: m.rec_building_step_2(), done: false }
			]
		},
		choiceLabel: m.rec_choice_label(),
		/**
		 * The two purchases, as the switch above the list names them. They are separated rather
		 * than listed together because one delivers medication and the other does not.
		 */
		modes: {
			treatment: m.rec_mode_treatment(),
			prescription: m.rec_mode_prescription()
		},
		noPlans: {
			title: m.rec_no_plans_title(),
			body: m.rec_no_plans_body()
		},
		action: m.rec_action(),
		/** Names the choice back, so the button is not the one place the decision goes unsaid. */
		actionFor: (plan: string) => m.rec_action_for({ plan }),
		/**
		 * The reference's footnote, and the truth this screen must not let a choice imply: what
		 * is picked here is a preference, and the doctor reviewing the answers decides.
		 */
		reviewNote: m.rec_review_note(),
		/** Only ever shown for a treatment: a prescription delivers no days of anything. */
		durationFor: (days: number) => m.rec_duration({ days }),
		ordering: m.rec_ordering()
	};
}

/**
 * One screen per refusal. Every one of them says that nothing was charged, because the person
 * pressed a button expecting a payment page and got this instead, and none of them repeats
 * what the service said: an upstream message can carry account detail.
 */
export function checkoutFailures(): Record<CheckoutFailure, { title: string; body: string }> {
	return {
		'missing-anamnesis': {
			title: m.fail_missing_anamnesis_title(),
			body: m.fail_missing_anamnesis_body()
		},
		'not-configured': {
			title: m.fail_not_configured_title(),
			body: m.fail_not_configured_body()
		},
		'not-recommended': {
			title: m.fail_not_recommended_title(),
			body: m.fail_not_recommended_body()
		},
		refused: { title: m.fail_refused_title(), body: m.fail_refused_body() },
		unavailable: { title: m.fail_unavailable_title(), body: m.fail_unavailable_body() }
	};
}
