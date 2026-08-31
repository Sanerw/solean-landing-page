import { eur } from '$lib/domain';
import type { CheckoutFailure } from './checkout-client';

/**
 * Copy for the screen that ends the questionnaire. No price is written here any more: every
 * amount shown comes from the recommendation, which reads the shop's own catalogue, so there
 * is nothing left to keep in step by hand.
 */
export const RECOMMENDATION = {
	headline: 'Congratulations, you did it!',
	body: [
		'Your health profile is complete and a licensed doctor will review your answers.',
		'Choose the plan you want and we will take you to checkout.'
	],
	/**
	 * The reference's third pill reads "Eligibility checked", which this product must not
	 * claim: nothing here judges eligibility, and the doctor's review has not happened yet.
	 */
	assurances: ['Health profile complete', 'Sent for doctor review', 'Plan ready'],
	loading: 'Preparing your plan.',
	choiceLabel: 'Your plan',
	treatmentsHeading: 'Your treatment.',
	prescriptionsHeading: 'Prescription only.',
	/**
	 * The one line on this screen that has to be read. These cost a fraction of a treatment
	 * because nothing is dispensed or delivered, and a price seen without that reads as a
	 * discount on the same purchase.
	 */
	prescriptionsNote: 'The signed prescription alone. No medication is dispensed or delivered.',
	noPlans: {
		title: 'A doctor is reviewing your answers',
		body: 'No plan has been matched to your profile yet. You can still place your order, and the doctor decides what is prescribed after reviewing what you told us.'
	},
	action: 'Place your order',
	ordering: 'Opening your checkout',
	trust: ['Ongoing medical support', 'Pause or cancel anytime'],
	totalNote: 'Prices come from the shop. The total is confirmed at checkout, where the payment is taken.'
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
