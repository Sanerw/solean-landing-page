import type { Answer, QuestionnaireAnswers } from '$lib/domain';
import { journey } from '$lib/journey/journey.svelte';

export interface QuestionnaireService {
	getAnswers(): QuestionnaireAnswers;
	saveAnswer(questionId: string, answer: Answer): void;
	setCompleted(completed: boolean): void;
	clear(): void;
}

class MockQuestionnaireService implements QuestionnaireService {
	getAnswers(): QuestionnaireAnswers {
		return journey.session.questionnaire.answers;
	}

	saveAnswer(questionId: string, answer: Answer): void {
		journey.setAnswer(questionId, answer);
	}

	setCompleted(completed: boolean): void {
		journey.setQuestionnaireCompleted(completed);
	}

	clear(): void {
		journey.clearQuestionnaire();
	}
}

export const questionnaireService: QuestionnaireService = new MockQuestionnaireService();
