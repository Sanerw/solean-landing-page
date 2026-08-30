import { browser } from '$app/environment';
import type { Model } from 'survey-core';
import type { QuestionnaireDocument } from './anamnesis-client';
import { answerStorageKey, dropOtherAnswers, loadAnswers, saveAnswers } from './answer-storage';
import { createSurvey } from './survey-model';

/**
 * Holds the one survey instance the questionnaire screens share, so answers survive
 * navigation between steps without being written anywhere.
 *
 * Browser only. Module state on the server is shared by every request, so caching an
 * answered survey there would hand one visitor's answers to the next. The server has no
 * answers to keep anyway, so it gets a fresh instance each time.
 */
class QuestionnaireSession {
	#key = '';
	#survey: Model | null = null;

	/**
	 * Bumped whenever engine state the screens read has changed, because survey-core is not
	 * reactive to Svelte. Answers bump it themselves; validation bumps it through `touch`,
	 * since attaching error messages changes what a renderer has to show.
	 */
	revision = $state(0);

	touch(): void {
		this.revision += 1;
	}

	surveyFor(document: QuestionnaireDocument): Model {
		const key = `${document.identifier}@${document.version}`;

		if (!browser) return createSurvey(document.model);

		// A different questionnaire, or a new version of the same one, is a different survey:
		// answers collected against the old model must not carry into it.
		if (this.#survey === null || this.#key !== key) {
			const storageKey = answerStorageKey(document.identifier, document.version);
			const survey = createSurvey(document.model);

			this.#key = key;
			this.#survey = survey;

			// Restored before the listener is attached, so resuming is not written straight back.
			dropOtherAnswers(storageKey);
			const saved = loadAnswers(storageKey);
			if (saved) survey.data = saved;

			survey.onValueChanged.add(() => {
				this.revision += 1;
				saveAnswers(storageKey, survey.data);
			});
		}

		return this.#survey;
	}
}

export const questionnaireSession = new QuestionnaireSession();
