/**
 * The model's own question names, confirmed against `LIVE: MedQ NEW RECOMMENDER (01/26)`
 * version 1. Configuration rather than literals in a component, because RxScale can rename
 * a question in their Admin Tool and the code that reads an answer must be the one place
 * that has to change.
 */

/** Height and weight, asked as one `multipletext` with an item each. */
export const WEIGHT_QUESTION = {
	name: 'WeightSize',
	heightItem: 'size',
	weightItem: 'weight'
} as const;
