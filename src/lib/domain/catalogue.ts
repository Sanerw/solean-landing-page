import type { Treatment } from './types';

export const TREATMENTS: readonly Treatment[] = [
	{ id: 'mounjaro', name: 'Mounjaro', form: 'injection' },
	{ id: 'wegovy', name: 'Wegovy', form: 'injection' },
	{ id: 'wegovy-pill', name: 'Wegovy Pill', form: 'tablet' }
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
