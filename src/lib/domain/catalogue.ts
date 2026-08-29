import { eur } from './money';
import type { AddOn, Treatment } from './types';

/** One plan price covers every treatment; the reference price list has a single figure. */
const TREATMENT_PLAN_PRICE = eur(14_400);

export const INITIAL_TREATMENT_FEE = eur(990);
export const FIRST_ORDER_DISCOUNT = eur(-7_500);

export const TREATMENTS: readonly Treatment[] = [
	{
		id: 'mounjaro',
		name: 'Mounjaro',
		form: 'injection',
		// Not in the reference: no artboard states a dose for either injection.
		dose: '2.5 mg',
		claim: 'Lose up to 23% body weight',
		price: TREATMENT_PLAN_PRICE
	},
	{
		id: 'wegovy',
		name: 'Wegovy',
		form: 'injection',
		dose: '0.25 mg',
		claim: 'Lose up to 21% body weight',
		price: TREATMENT_PLAN_PRICE
	},
	{
		id: 'wegovy-pill',
		name: 'Wegovy Pill',
		form: 'tablet',
		dose: '1.5 mg',
		claim: 'Lose up to 17% body weight',
		price: TREATMENT_PLAN_PRICE
	}
];

// `unit` is provisional until the feature 10 decision; see decision 3 in the spec.
export const ADD_ONS: readonly AddOn[] = [
	{
		id: 'doctor-consultation',
		name: 'Doctor consultation',
		description: '30-minute private video consultation',
		price: eur(4_900),
		unit: 'one-off'
	},
	{
		id: 'weight-coaching',
		name: '1:1 weight coaching',
		// Not in the reference: the artboards show only a "Learn more" link here.
		description: 'Monthly session with a dedicated weight-loss coach',
		price: eur(2_900),
		unit: 'per-session'
	},
	{
		id: 'body-smart-scale',
		name: 'Body smart scale',
		description: 'Connected scale tracking weight and body composition',
		price: eur(3_900),
		unit: 'one-off'
	}
];

/**
 * A persisted id is not a guarantee: session storage can outlive a catalogue edit,
 * so every lookup returns `null` on a miss rather than assuming the id is still valid.
 */
export function findTreatment(id: string): Treatment | null {
	return TREATMENTS.find((treatment) => treatment.id === id) ?? null;
}

export function findAddOn(id: string): AddOn | null {
	return ADD_ONS.find((addOn) => addOn.id === id) ?? null;
}
