import { browser, dev } from '$app/environment';
import { emptyAnswers, type Answers, type QuestionId } from './types';

/**
 * The one set of answers the questionnaire screens share, so they survive navigation between
 * screens without being written anywhere.
 *
 * **Nothing here is persisted.** The answers live in this module and nowhere else, so a
 * reload starts the questionnaire over: the medical answers a person types never outlive the
 * page that is asking for them, not even in `sessionStorage`. Moving between screens is a
 * client-side navigation and keeps the module, which is why the walk itself still works.
 *
 * This is the same contract `survey-state.svelte.ts` holds for the RxScale-driven flow, which
 * 24c replaces with this one.
 */
class AnswerStore {
	#answers = $state(emptyAnswers());
	#started = $state(false);

	get answers(): Answers {
		return this.#answers;
	}

	/**
	 * Whether the visitor has moved off a screen themselves. False on every fresh load, which
	 * is what sends a reload back to the first screen rather than to the first unanswered one.
	 */
	get started(): boolean {
		return this.#started;
	}

	set<Id extends QuestionId>(id: Id, value: Answers[Id]): void {
		// Module state on the server is shared by every request, so a write here would put one
		// visitor's answer in front of the next. Nothing should be writing during SSR: answers
		// come from events. Loud in development, harmless in production, which is the rule this
		// project already applies to an unmapped question.
		if (!browser) {
			if (dev) throw new Error(`Answers were written on the server ("${id}")`);

			return;
		}

		this.#answers[id] = value;
	}

	markStarted(): void {
		this.#started = true;
	}

	/** Back to an empty questionnaire, with no trace of the last one. */
	reset(): void {
		this.#answers = emptyAnswers();
		this.#started = false;
	}
}

export const answerStore = new AnswerStore();
