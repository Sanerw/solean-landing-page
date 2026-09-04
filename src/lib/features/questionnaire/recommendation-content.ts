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
		 * The prescription-only group as one card beneath the treatments, which is where the
		 * reference puts it. It is a peer of the treatments rather than a tab beside them: the
		 * distinction is not one a visitor has been told about before this screen.
		 */
		prescriptionCard: {
			title: m.rec_script_card_title(),
			badge: m.rec_script_card_badge(),
			body: m.rec_script_card_body()
		},
		/** The second screen, reached only by choosing that card. */
		prescriptionStep: {
			headline: m.rec_script_headline(),
			body: m.rec_script_body(),
			note: m.rec_script_note(),
			action: m.rec_script_action(),
			back: m.rec_back()
		},
		/** Only when a group's listings disagree; see `groupPrice`. */
		priceFrom: (price: string) => m.rec_price_from({ price }),
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
		refused: { title: m.fail_refused_title(), body: m.fail_refused_body() },
		unavailable: { title: m.fail_unavailable_title(), body: m.fail_unavailable_body() }
	};
}
