import type { Money } from './money';

export type TreatmentForm = 'injection' | 'tablet';

export interface Treatment {
	id: string;
	name: string;
	form: TreatmentForm;
	dose: string;
	claim: string;
	price: Money;
}

export type AddOnUnit = 'one-off' | 'per-session';

export interface AddOn {
	id: string;
	name: string;
	description: string;
	price: Money;
	unit: AddOnUnit;
}

/** Calendar date as `YYYY-MM-DD`; the session round-trips through JSON, so never a `Date`. */
export type IsoDate = string;

export type Answer =
	| { kind: 'single-select'; optionId: string }
	| { kind: 'multi-select'; optionIds: string[] }
	| { kind: 'numeric'; value: number; unit?: string }
	| { kind: 'contact'; fields: Record<string, string> };

export interface QuestionnaireAnswers {
	byQuestionId: Record<string, Answer>;
	/** Drives resume. Feature 7 sets it, because only the schema knows step order. */
	firstUnansweredIndex: number;
}

/** Collected at checkout, not in the questionnaire. */
export interface PatientDetails {
	firstName: string;
	lastName: string;
	email: string;
	phone?: string;
	dateOfBirth: IsoDate;
}

export type PatientProfile = PatientDetails & {
	answers: QuestionnaireAnswers;
	selectedTreatmentId: string;
};

export interface ShippingAddress {
	street: string;
	postcode: string;
	city: string;
	country: string;
	/** Always presented as conditional on clinical approval. */
	deliveryEstimate: string;
}

export interface PricingBreakdown {
	subtotal: Money;
	discount: Money;
	shipping: Money;
	total: Money;
}

export type OrderStatus =
	| 'review-in-progress'
	| 'approved'
	| 'declined'
	| 'more-information-required'
	| 'prescription-issued'
	| 'dispatched';

/** Ids only: the catalogue owns names and prices, so an order never restates them. */
export interface OrderLineItems {
	treatmentId: string;
	addOnIds: string[];
}

export interface Order {
	/** Reference in the style `#SL-24819`. */
	id: string;
	lineItems: OrderLineItems;
	pricing: PricingBreakdown;
	status: OrderStatus;
}
