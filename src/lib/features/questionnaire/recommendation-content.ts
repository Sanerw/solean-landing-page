import { eur } from '$lib/domain';

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
