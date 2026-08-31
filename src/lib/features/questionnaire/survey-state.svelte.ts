import { browser } from '$app/environment';
import type { Model } from 'survey-core';
import type { QuestionnaireDocument } from './anamnesis-client';
import {
	anamnesisStorageKey,
	answerStorageKey,
	clearAnswers,
	dropStaleKeys,
	loadAnamnesisUid,
	loadAnswers,
	saveAnamnesisUid,
	saveAnswers
} from './answer-storage';
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

	#anamnesisUid: string | null = null;
	#anamnesisKey = '';
	#storageKey = '';

	/**
	 * The submitted anamnesis. Its presence is what ends the questionnaire: the record exists
	 * at RxScale, a doctor will read it, and nothing on this side can amend or replace it.
	 *
	 * Read through the revision rather than held in `$state`, because it is restored while the
	 * survey is created, and that happens inside a derived where writing state is forbidden.
	 */
	get anamnesisUid(): string | null {
		this.revision;

		return this.#anamnesisUid;
	}

	touch(): void {
		this.revision += 1;
	}

	/**
	 * The handoff is where this app stops needing the answers: the anamnesis is at RxScale and
	 * the payment is Shopify's. The uid stays behind, so a return finds a session that makes
	 * sense rather than a questionnaire nobody sent.
	 *
	 * Only the stored copy goes. Writing an empty `survey.data` would fire the change listener
	 * and save `{}` back over the key this is trying to remove.
	 */
	forgetAnswers(): void {
		if (this.#storageKey) clearAnswers(this.#storageKey);
	}

	recordSubmission(uid: string): void {
		this.#anamnesisUid = uid;
		if (this.#anamnesisKey) saveAnamnesisUid(this.#anamnesisKey, uid);
		this.revision += 1;
	}

	surveyFor(document: QuestionnaireDocument): Model {
		const key = `${document.identifier}@${document.version}`;

		if (!browser) return createSurvey(document.model);

		// A different questionnaire, or a new version of the same one, is a different survey:
		// answers collected against the old model must not carry into it.
		if (this.#survey === null || this.#key !== key) {
			const storageKey = answerStorageKey(document.identifier, document.version);
			const anamnesisKey = anamnesisStorageKey(document.identifier, document.version);
			const survey = createSurvey(document.model);

			this.#key = key;
			this.#survey = survey;
			this.#anamnesisKey = anamnesisKey;
			this.#storageKey = storageKey;

			// Restored before the listener is attached, so resuming is not written straight back.
			dropStaleKeys([storageKey, anamnesisKey]);
			const saved = loadAnswers(storageKey);
			if (saved) survey.data = saved;
			this.#anamnesisUid = loadAnamnesisUid(anamnesisKey);

			survey.onValueChanged.add(() => {
				this.revision += 1;
				saveAnswers(storageKey, survey.data);
			});
		}

		return this.#survey;
	}
}

export const questionnaireSession = new QuestionnaireSession();
