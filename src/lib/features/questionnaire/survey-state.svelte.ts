import { browser } from '$app/environment';
import type { Model } from 'survey-core';
import type { QuestionnaireDocument } from './anamnesis-client';
import { createSurvey } from './survey-model';

/**
 * Holds the one survey instance the questionnaire screens share, so answers survive
 * navigation between steps without being written anywhere.
 *
 * **Nothing here is persisted.** Answers, the submitted anamnesis uid and the chosen plan
 * live in this module and nowhere else, so a reload starts the questionnaire over: the
 * medical answers a person types never outlive the page that is asking for them, not even
 * in `sessionStorage`. Moving between steps is a client-side navigation and keeps the
 * module, which is why the walk itself still works.
 *
 * The cost is deliberate and worth stating: a reload after the submission cannot reach the
 * order screen again. The anamnesis exists at RxScale either way, and walking the
 * questionnaire a second time files a second one.
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
	#recommendationChoice: RecommendationChoice | null = null;

	/**
	 * The submitted anamnesis. Its presence is what ends the questionnaire: the record exists
	 * at RxScale, a doctor will read it, and nothing on this side can amend or replace it.
	 *
	 * Read through the revision rather than held in `$state`, because it is set while the
	 * survey is created, and that happens inside a derived where writing state is forbidden.
	 */
	get anamnesisUid(): string | null {
		this.revision;

		return this.#anamnesisUid;
	}

	get recommendationChoice(): RecommendationChoice | null {
		this.revision;

		return this.#recommendationChoice;
	}

	touch(): void {
		this.revision += 1;
	}

	/**
	 * The handoff is where this app stops needing the answers: the anamnesis is at RxScale and
	 * the payment is Shopify's. The uid stays behind, so a browser that comes back to a live
	 * page finds a session that makes sense rather than a questionnaire nobody sent.
	 *
	 * Emptying `survey.data` is the whole of it now that nothing is written down.
	 */
	forgetAnswers(): void {
		if (this.#survey) this.#survey.data = {};
		this.revision += 1;
	}

	recordSubmission(uid: string): void {
		this.#anamnesisUid = uid;
		this.revision += 1;
	}

	recordRecommendationChoice(variantId: string | null): void {
		this.#recommendationChoice = { confirmed: true, variantId };
		this.revision += 1;
	}

	/** Returns the completion step to the choice, so the plan can still be changed. */
	forgetRecommendationChoice(): void {
		this.#recommendationChoice = null;
		this.revision += 1;
	}

	surveyFor(document: QuestionnaireDocument): Model {
		const key = `${document.identifier}@${document.version}`;

		if (!browser) return createSurvey(document.model);

		// A different questionnaire, or a new version of the same one, is a different survey:
		// answers collected against the old model must not carry into it.
		if (this.#survey === null || this.#key !== key) {
			const survey = createSurvey(document.model);

			this.#key = key;
			this.#survey = survey;
			this.#anamnesisUid = null;
			this.#recommendationChoice = null;

			survey.onValueChanged.add(() => {
				this.revision += 1;
			});
		}

		return this.#survey;
	}
}

/** Confirmed on the choice screen. Null is a real answer: RxScale recommended nothing. */
export interface RecommendationChoice {
	confirmed: true;
	variantId: string | null;
}

export const questionnaireSession = new QuestionnaireSession();
