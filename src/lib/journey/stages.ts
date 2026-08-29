import { findTreatment, type PatientProfile } from '$lib/domain';
import type { JourneySession } from './session';

export type JourneyStage = 'browsing' | 'questionnaire' | 'checkout' | 'order';

export type StageAccess = { allowed: true } | { allowed: false; redirectTo: string; reason: string };

/** Ordered, one stage per route group, so the guard maps onto routing directly. */
export const STAGES: readonly JourneyStage[] = ['browsing', 'questionnaire', 'checkout', 'order'];

// Feature 7 owns the questionnaire entry point; this is the group root it redirects from.
const QUESTIONNAIRE_ENTRY = '/questionnaire';
const CHECKOUT_ENTRY = '/checkout/account';

export function nextStage(stage: JourneyStage): JourneyStage | null {
	return STAGES[STAGES.indexOf(stage) + 1] ?? null;
}

/** The furthest stage the session's facts justify, never a stored value that could drift. */
export function reachedStage(session: JourneySession): JourneyStage {
	if (session.orderId !== null) return 'order';
	if (session.questionnaire.completed && session.selectedTreatmentId !== null) {
		if (findTreatment(session.selectedTreatmentId) !== null) return 'checkout';
	}
	if (session.questionnaire.completed || Object.keys(session.questionnaire.answers.byQuestionId).length > 0) {
		return 'questionnaire';
	}

	return 'browsing';
}

export function canEnter(stage: JourneyStage, session: JourneySession): StageAccess {
	switch (stage) {
		case 'browsing':
		case 'questionnaire':
			return { allowed: true };

		case 'checkout': {
			if (!session.questionnaire.completed) {
				return {
					allowed: false,
					redirectTo: QUESTIONNAIRE_ENTRY,
					reason: 'The questionnaire has not been completed yet.'
				};
			}
			// A stored id is not a guarantee: session storage outlives a catalogue edit, so a
			// treatment that no longer resolves must block checkout exactly as an absent one does.
			if (session.selectedTreatmentId === null || findTreatment(session.selectedTreatmentId) === null) {
				return {
					allowed: false,
					redirectTo: QUESTIONNAIRE_ENTRY,
					reason: 'No treatment has been selected yet.'
				};
			}

			return { allowed: true };
		}

		case 'order': {
			if (session.orderId === null) {
				return {
					allowed: false,
					redirectTo: CHECKOUT_ENTRY,
					reason: 'No order has been placed yet.'
				};
			}

			return { allowed: true };
		}
	}
}

/**
 * Assembles the domain profile from the pieces the session collects at different points.
 * Patient details arrive at checkout, so this stays `null` for the whole questionnaire.
 */
export function toPatientProfile(session: JourneySession): PatientProfile | null {
	const { patient, selectedTreatmentId, questionnaire } = session;

	if (patient === null || selectedTreatmentId === null || !questionnaire.completed) return null;

	return { ...patient, answers: questionnaire.answers, selectedTreatmentId };
}
