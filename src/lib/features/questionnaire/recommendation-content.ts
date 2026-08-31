import { eur } from '$lib/domain';
import type { CheckoutFailure } from './checkout-client';

/**
 * Copy and prices for the screen that ends the questionnaire. Illustrative prototype
 * content, and the prices are marketing copy: Shopify owns the amount actually charged, so
 * these lines are kept in step with the SKU by hand.
 */
export const RECOMMENDATION = {
	headline: 'Congratulations, you did it!',
	body: [
		'Your health profile is complete and a licensed doctor will review your answers.',
		'Your personalised treatment plan is ready, order it now.'
	],
	/**
	 * The reference's third pill reads "Eligibility checked", which this product must not
	 * claim: nothing here judges eligibility, and the doctor's review has not happened yet.
	 */
	assurances: ['Health profile complete', 'Sent for doctor review', 'Plan ready'],
	action: 'Place your order',
	trust: ['Free delivery', 'Ongoing medical support', 'Pause or cancel anytime'],
	priceLines: [
		{ label: 'Treatment plan, first month supply', amount: eur(14_400) },
		{ label: 'Initial treatment fee', amount: eur(990) },
		{ label: 'First-order discount', amount: eur(-7_500) }
	],
	shippingLabel: 'Shipping',
	shippingValue: 'Free',
	totalLabel: 'Total today',
	totalNote: 'Confirmed at checkout, where the payment is taken.'
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
	'missing-email': {
		title: 'Your order needs an e-mail address',
		body: 'Your answers did not include one, and a checkout with no address is an order nobody could tell you about. Nothing has been charged, and your answers are already with a doctor.'
	},
	'not-configured': {
		title: 'Ordering is not available here',
		body: 'This installation of Solean cannot place orders. Nothing has been charged, and your answers are already with a doctor.'
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
