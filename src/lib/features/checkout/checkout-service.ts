import { ADD_ONS, TREATMENTS, findAddOn, findTreatment, type AddOn, type Treatment } from '$lib/domain';
import { journey } from '$lib/journey/journey.svelte';

export interface CheckoutSelection {
	treatment: Treatment | null;
	addOns: AddOn[];
}

export interface CheckoutService {
	listTreatments(): readonly Treatment[];
	listAddOns(): readonly AddOn[];
	selectTreatment(treatmentId: string | null): void;
	toggleAddOn(addOnId: string): void;
	getSelection(): CheckoutSelection;
}

class MockCheckoutService implements CheckoutService {
	listTreatments(): readonly Treatment[] {
		return TREATMENTS;
	}

	listAddOns(): readonly AddOn[] {
		return ADD_ONS;
	}

	/** An id the catalogue does not know is refused rather than persisted. */
	selectTreatment(treatmentId: string | null): void {
		if (treatmentId !== null && findTreatment(treatmentId) === null) return;
		journey.selectTreatment(treatmentId);
	}

	toggleAddOn(addOnId: string): void {
		if (findAddOn(addOnId) === null) return;
		journey.toggleAddOn(addOnId);
	}

	getSelection(): CheckoutSelection {
		const { selectedTreatmentId, selectedAddOnIds } = journey.session;

		return {
			treatment: selectedTreatmentId === null ? null : findTreatment(selectedTreatmentId),
			addOns: selectedAddOnIds
				.map(findAddOn)
				.filter((addOn): addOn is AddOn => addOn !== null)
		};
	}
}

export const checkoutService: CheckoutService = new MockCheckoutService();
