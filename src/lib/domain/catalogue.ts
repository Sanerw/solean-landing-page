import { eur } from './money';
import type { Treatment } from './types';

/** One plan price covers every treatment; the reference price list has a single figure. */
const TREATMENT_PLAN_PRICE = eur(14_400);

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

export function findTreatment(id: string): Treatment | null {
	return TREATMENTS.find((treatment) => treatment.id === id) ?? null;
}

/**
 * How a treatment is named on screen. The catalogue holds "Wegovy" once and the form beside
 * it, because the injection and the tablet are two products with one brand; every surface that
 * lists them has to say which is which. The rule lives here so the navigation dropdown, the
 * treatment page and anything later cannot disagree about a product's name.
 *
 * The words are not translated: "Mounjaro" is a brand, and the German market writes
 * "Injection" attached to it exactly as this does.
 */
export function treatmentDisplayName(treatment: Treatment): string {
	return treatment.form === 'tablet' ? treatment.name : `${treatment.name} Injection`;
}
