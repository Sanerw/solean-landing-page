import type { Money } from '$lib/domain';

/**
 * The shape of a recommendation once it has been trimmed for a screen. Shared rather than
 * owned by either half: the server module produces it and the browser renders it, and a
 * type imported out of `$lib/server` would drag a server-only module into the client graph.
 */

export interface RecommendedOption {
	/** The Shopify variant id, which is the only field the cart needs. */
	variantId: string;
	label: string;
	price: Money;
	/**
	 * How many days of treatment the SKU covers, when RxScale records one. Null is common:
	 * a listing without a duration says nothing about how long it lasts, and a screen that
	 * invented a number would be quoting a course of medication nobody promised.
	 */
	therapyDays: number | null;
	/** RxScale's own default for this plan. */
	preSelected: boolean;
}

export interface RecommendedPlan {
	id: string;
	name: string;
	image: string | null;
	/**
	 * `sku.digital` at RxScale: the prescription alone, no medication. The live storefront
	 * shows these under a heading of their own, and so must we. The price looks like a
	 * bargain until you read that nothing is delivered.
	 */
	prescriptionOnly: boolean;
	options: RecommendedOption[];
}
