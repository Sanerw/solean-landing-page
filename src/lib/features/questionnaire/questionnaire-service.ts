import type { Answer, QuestionnaireAnswers } from '$lib/domain';
import { journey } from '$lib/journey/journey.svelte';
import {
	QUESTIONNAIRE_SCHEMA,
	getFirstUnansweredIndex,
	getNextQuestionnaireStep,
	getPreviousQuestionnaireStep,
	getQuestionnaireProgress,
	getQuestionnaireStep,
	getQuestionnaireStepAccess,
	getResumeQuestionnaireStep,
	normalizeQuestionnaireAnswers,
	validateQuestionnaireAnswer
} from './schema';
import type {
	QuestionnaireProgress,
	QuestionnaireStep,
	QuestionnaireStepAccess,
	ValidationResult
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
	getAnswers(): QuestionnaireAnswers;
	getAnswer(stepId: string): Answer | undefined;
	validate(step: QuestionnaireStep, answer: Answer | undefined): ValidationResult;
	saveAnswer(stepId: string, answer: Answer): void;
	setCompleted(completed: boolean): void;
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

	// Storage outlives a schema edit, so the persisted marker is recomputed on every read
	// rather than trusted. An absent, negative, stale or out-of-range value cannot survive.
	getAnswers(): QuestionnaireAnswers {
		return normalizeQuestionnaireAnswers(
			QUESTIONNAIRE_SCHEMA,
			journey.session.questionnaire.answers
		);
	}

	getAnswer(stepId: string): Answer | undefined {
		return this.getAnswers().byQuestionId[stepId];
	}

	validate(step: QuestionnaireStep, answer: Answer | undefined): ValidationResult {
		return validateQuestionnaireAnswer(step, answer);
	}

	/**
	 * The service decides the marker, not the caller: writing the answer and its recomputed
	 * index through one mutation is what keeps the two from drifting apart.
	 */
	saveAnswer(stepId: string, answer: Answer): void {
		const byQuestionId = { ...this.getAnswers().byQuestionId, [stepId]: answer };

		journey.saveQuestionnaireAnswer({
			byQuestionId,
			firstUnansweredIndex: getFirstUnansweredIndex(QUESTIONNAIRE_SCHEMA, {
				byQuestionId,
				firstUnansweredIndex: 0
			})
		});
	}

	setCompleted(completed: boolean): void {
		journey.setQuestionnaireCompleted(completed);
	}

	clear(): void {
		journey.clearQuestionnaire();
	}
}

export const questionnaireService: QuestionnaireService = new MockQuestionnaireService();
