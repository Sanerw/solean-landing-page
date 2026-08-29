import type { PatientDetails, QuestionnaireAnswers, ShippingAddress } from '$lib/domain';

// 2: an answer became a record of field id to answer, because one step now holds several
// fields. Feature 7 sessions are deliberately discarded rather than migrated: the stored
// data is one fictional answer in a prototype, so a migration path would outlive its worth.
/** Bumped whenever the persisted shape changes; a mismatch discards the session. */
export const SESSION_VERSION = 2;

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
