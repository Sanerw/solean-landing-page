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
	 * One mutation for the whole answer map and its progress marker. Splitting them into two
	 * setters is what would let a resume point drift away from the answers it describes, so
	 * the questionnaire service hands both over together and this never recomputes either.
	 */
	saveQuestionnaireAnswer(answers: QuestionnaireAnswers): void {
		update((current) => ({
			...current,
			questionnaire: { ...current.questionnaire, answers }
		}));
	},

	setQuestionnaireCompleted(completed: boolean): void {
		update((current) => ({
			...current,
			questionnaire: { ...current.questionnaire, completed }
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
