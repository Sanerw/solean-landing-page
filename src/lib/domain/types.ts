export type TreatmentForm = 'injection' | 'tablet';

/**
 * The join, not the content. The id keys the Shopify variant on one side and every piece of
 * editorial content that names a treatment on the other, so it lives in code where an editor
 * cannot rename it out from under either.
 *
 * `dose`, `claim` and `price` left at feature 27b. They had had no readers since 26c, and what
 * replaced them is Sanity: the page's doses and prices are editable there now.
 */
export interface Treatment {
	id: string;
	name: string;
	form: TreatmentForm;
}
