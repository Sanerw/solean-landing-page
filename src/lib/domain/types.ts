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
