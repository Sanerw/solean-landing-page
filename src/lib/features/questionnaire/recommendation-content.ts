import { eur } from '$lib/domain';
import type { CheckoutFailure } from './checkout-client';

/**
 * Copy for the screen that ends the questionnaire. No price is written here any more: every
 * amount shown comes from the recommendation, which reads the shop's own catalogue, so there
 * is nothing left to keep in step by hand.
 */
export const RECOMMENDATION = {
	choiceHeadline: 'Choose your treatment',
	choiceBody: 'Select the treatment or prescription you want to continue with.',
	/**
	 * The screen that covers the recommendation read. The reference's second item reads
	 * "Checking your eligibility", which this funnel must not claim: the questionnaire never
	 * judges, and approval happens in RxScale's doctor review. These two name the two waits
	 * that are actually happening.
	 */
	building: {
		headline: "We're building your plan",
		steps: [
			{ label: 'Your answers are with our clinical team', done: true },
			{ label: 'Matching treatments to your profile', done: false }
		]
	},
	choiceLabel: 'Your plan',
	/**
	 * The two purchases, as the switch above the list names them. They are separated rather
	 * than listed together because one delivers medication and the other does not.
	 */
	modes: {
		treatment: 'Treatment',
		prescription: 'Prescription only'
	},
	noPlans: {
		title: 'A doctor is reviewing your answers',
		body: 'No plan has been matched to your profile yet. You can still place your order, and the doctor decides what is prescribed after reviewing what you told us.'
	},
	action: 'Go to checkout',
	/** Names the choice back, so the button is not the one place the decision goes unsaid. */
	actionFor: (plan: string) => `Checkout with ${plan}`,
	/**
	 * The reference's footnote, and the truth this screen must not let a choice imply: what
	 * is picked here is a preference, and the doctor reviewing the answers decides.
	 */
	reviewNote: 'Treatment is prescribed only after clinical review and may differ from your choice.',
	/** Only ever shown for a treatment: a prescription delivers no days of anything. */
	durationFor: (days: number) => `${days}-day treatment`,
	ordering: 'Opening your checkout'
} as const;

/**
 * One screen per refusal. Every one of them says that nothing was charged, because the person
 * pressed a button expecting a payment page and got this instead, and none of them repeats
 * what the service said: an upstream message can carry account detail.
 */
export const CHECKOUT_FAILURES: Record<CheckoutFailure, { title: string; body: string }> = {
	'missing-anamnesis': {
		title: 'Your health profile is not attached',
		body: 'An order without it would reach the pharmacy with nothing for a doctor to review, so it was not placed. Nothing has been charged.'
	},
	'not-configured': {
		title: 'Ordering is not available here',
		body: 'This installation of Solean cannot place orders. Nothing has been charged, and your answers are already with a doctor.'
	},
	'not-recommended': {
		title: 'That treatment is not available to you',
		body: 'The medical review of your answers does not cover the plan you picked, so it was not ordered and nothing has been charged. Choose one of the plans shown above.'
	},
	refused: {
		title: 'Your order was not accepted',
		body: 'The medical service could not create a checkout for this plan. Nothing has been charged.'
	},
	unavailable: {
		title: 'We could not reach the checkout',
		body: 'The medical service did not answer, so nothing was ordered and nothing has been charged. Try again in a moment.'
	}
};
