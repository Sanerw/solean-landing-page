import type { QuestionnaireAnswers } from '$lib/domain';
import { emptySession, type JourneySession } from './session';
import { reachedStage, type JourneyStage } from './stages';
import { clearSession, readSession, writeSession } from './storage';

// `readSession` is a no-op on the server, so a module singleton can never leak
// state between requests: each server instance keeps the empty session it started with.
let session = $state<JourneySession>(readSession() ?? emptySession());

const stage = $derived(reachedStage(session));

/** Every mutation replaces the session and persists in one place, so nothing can drift. */
function update(mutate: (current: JourneySession) => JourneySession): void {
	session = mutate(session);
	writeSession(session);
}

export const journey = {
	get session(): JourneySession {
		return session;
	},

	/** Derived from the session's facts. Read-only on purpose: there is no setter. */
	get stage(): JourneyStage {
		return stage;
	},

	/**
	 * One mutation for everything an answer implies: the map, the resume marker, whether the
	 * questionnaire is complete, and which treatment was chosen. Splitting these into
	 * separate setters is what would let them drift apart, so the questionnaire service
	 * computes all four together and this never recomputes any of them.
	 */
	saveQuestionnaireProgress(progress: {
		answers: QuestionnaireAnswers;
		completed: boolean;
		selectedTreatmentId: string | null;
	}): void {
		update((current) => ({
			...current,
			questionnaire: { answers: progress.answers, completed: progress.completed },
			selectedTreatmentId: progress.selectedTreatmentId
		}));
	},

	clearQuestionnaire(): void {
		update((current) => ({ ...current, questionnaire: emptySession().questionnaire }));
	},

	selectTreatment(treatmentId: string | null): void {
		update((current) => ({ ...current, selectedTreatmentId: treatmentId }));
	},

	toggleAddOn(addOnId: string): void {
		update((current) => ({
			...current,
			selectedAddOnIds: current.selectedAddOnIds.includes(addOnId)
				? current.selectedAddOnIds.filter((id) => id !== addOnId)
				: [...current.selectedAddOnIds, addOnId]
		}));
	},

	setOrderId(orderId: string | null): void {
		update((current) => ({ ...current, orderId }));
	},

	reset(): void {
		session = emptySession();
		clearSession();
	}
};
