import type { QuestionnaireAnswers } from '$lib/domain';
import { journey } from '$lib/journey/journey.svelte';
import {
	QUESTIONNAIRE_SCHEMA,
	getFirstUnansweredIndex,
	getNextQuestionnaireStep,
	getPatientWeightKg,
	getSelectedTreatmentId,
	isQuestionnaireComplete,
	getPreviousQuestionnaireStep,
	getQuestionnaireProgress,
	getQuestionnaireStep,
	getQuestionnaireStepAccess,
	getResumeQuestionnaireStep,
	normalizeQuestionnaireAnswers,
	validateQuestionnaireStep
} from './schema';
import type {
	QuestionnaireProgress,
	QuestionnaireStep,
	QuestionnaireStepAccess,
	StepAnswers,
	StepValidationResult
} from './types';

/**
 * The only questionnaire state and schema boundary components may use. Components never
 * import the fixture or touch storage, so a real adapter can replace this whole surface.
 */
export interface QuestionnaireService {
	getStep(stepId: string): QuestionnaireStep | null;
	getProgress(stepId: string): QuestionnaireProgress | null;
	getPreviousStep(stepId: string): QuestionnaireStep | null;
	getNextStep(stepId: string): QuestionnaireStep | null;
	getStepAccess(stepId: string): QuestionnaireStepAccess;
	getResumeStepId(): string | null;
	getPatientWeightKg(): number | null;
	getAnswers(): QuestionnaireAnswers;
	getStepAnswers(stepId: string): StepAnswers | undefined;
	validate(step: QuestionnaireStep, answers: StepAnswers | undefined): StepValidationResult;
	saveAnswer(stepId: string, answers: StepAnswers): void;
	isComplete(): boolean;
	getQuestionCount(): number;
	getSelectedTreatmentId(): string | null;
	clear(): void;
}

class MockQuestionnaireService implements QuestionnaireService {
	getStep(stepId: string): QuestionnaireStep | null {
		return getQuestionnaireStep(QUESTIONNAIRE_SCHEMA, stepId);
	}

	getProgress(stepId: string): QuestionnaireProgress | null {
		return getQuestionnaireProgress(QUESTIONNAIRE_SCHEMA, stepId);
	}

	getPreviousStep(stepId: string): QuestionnaireStep | null {
		return getPreviousQuestionnaireStep(QUESTIONNAIRE_SCHEMA, stepId);
	}

	getNextStep(stepId: string): QuestionnaireStep | null {
		return getNextQuestionnaireStep(QUESTIONNAIRE_SCHEMA, stepId);
	}

	getStepAccess(stepId: string): QuestionnaireStepAccess {
		return getQuestionnaireStepAccess(QUESTIONNAIRE_SCHEMA, stepId, this.getAnswers());
	}

	getResumeStepId(): string | null {
		return getResumeQuestionnaireStep(QUESTIONNAIRE_SCHEMA, this.getAnswers())?.id ?? null;
	}

	getPatientWeightKg(): number | null {
		return getPatientWeightKg(QUESTIONNAIRE_SCHEMA, this.getAnswers());
	}

	// Storage outlives a schema edit, so the persisted marker is recomputed on every read
	// rather than trusted. An absent, negative, stale or out-of-range value cannot survive.
	getAnswers(): QuestionnaireAnswers {
		return normalizeQuestionnaireAnswers(
			QUESTIONNAIRE_SCHEMA,
			journey.session.questionnaire.answers
		);
	}

	getStepAnswers(stepId: string): StepAnswers | undefined {
		return this.getAnswers().byQuestionId[stepId];
	}

	validate(step: QuestionnaireStep, answers: StepAnswers | undefined): StepValidationResult {
		return validateQuestionnaireStep(step, answers);
	}

	/**
	 * The service decides the marker, not the caller: writing the answer and its recomputed
	 * index through one mutation is what keeps the two from drifting apart.
	 */
	saveAnswer(stepId: string, answers: StepAnswers): void {
		const byQuestionId = { ...this.getAnswers().byQuestionId, [stepId]: answers };
		const next = {
			byQuestionId,
			firstUnansweredIndex: getFirstUnansweredIndex(QUESTIONNAIRE_SCHEMA, {
				byQuestionId,
				firstUnansweredIndex: 0
			})
		};

		// Everything an answer implies, computed here and written once. There is deliberately
		// no way to set completion or the treatment on their own.
		journey.saveQuestionnaireProgress({
			answers: next,
			completed: isQuestionnaireComplete(QUESTIONNAIRE_SCHEMA, next),
			selectedTreatmentId: getSelectedTreatmentId(QUESTIONNAIRE_SCHEMA, next)
		});
	}

	isComplete(): boolean {
		return isQuestionnaireComplete(QUESTIONNAIRE_SCHEMA, this.getAnswers());
	}

	/** The schema's own total, so no screen states a second number. */
	getQuestionCount(): number {
		return QUESTIONNAIRE_SCHEMA.questionCount;
	}

	getSelectedTreatmentId(): string | null {
		return getSelectedTreatmentId(QUESTIONNAIRE_SCHEMA, this.getAnswers());
	}

	clear(): void {
		journey.clearQuestionnaire();
	}
}

export const questionnaireService: QuestionnaireService = new MockQuestionnaireService();
