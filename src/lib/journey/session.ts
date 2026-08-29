import type { PatientDetails, QuestionnaireAnswers, ShippingAddress } from '$lib/domain';

/** Bumped whenever the persisted shape changes; a mismatch discards the session. */
export const SESSION_VERSION = 1;

export interface JourneySession {
	version: typeof SESSION_VERSION;
	questionnaire: { answers: QuestionnaireAnswers; completed: boolean };
	selectedTreatmentId: string | null;
	selectedAddOnIds: string[];
	patient: PatientDetails | null;
	shipping: ShippingAddress | null;
	orderId: string | null;
}

export function emptySession(): JourneySession {
	return {
		version: SESSION_VERSION,
		questionnaire: {
			answers: { byQuestionId: {}, firstUnansweredIndex: 0 },
			completed: false
		},
		selectedTreatmentId: null,
		selectedAddOnIds: [],
		patient: null,
		shipping: null,
		orderId: null
	};
}
