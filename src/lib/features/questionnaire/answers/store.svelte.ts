import { browser, dev } from '$app/environment';
import { clearSession, loadSession, saveSession } from './persistence';
import { emptyAnswers, type Answers, type QuestionId } from './types';

/**
 * The one set of answers the questionnaire screens share.
 *
 * **They are persisted, on this device only.** Every write is mirrored into `localStorage` so
 * somebody who leaves mid-questionnaire finds their answers where they left them, for 30
 * days. `persistence.ts` owns where that is and why it is not a cookie. Nothing reaches a
 * server until the submission, which is unchanged.
 *
 * The store is erased the moment the questionnaire has served its purpose: the answers have
 * gone to RxScale and the visitor has left for the checkout. Keeping them past that point
 * would mean a stranger on a shared computer could read a completed medical questionnaire,
 * and there would be nothing left to resume anyway.
 */
class AnswerStore {
	#answers = $state(emptyAnswers());
	#started = $state(false);
	#anamnesisUid = $state<string | null>(null);
	/** Guards against a restore overwriting answers typed before it ran. */
	#restored = false;

	get answers(): Answers {
		return this.#answers;
	}

	/**
	 * Read what this device has, once, on the client.
	 *
	 * Called from the questionnaire's own layout rather than at module scope: this file is
	 * imported during SSR too, where `localStorage` does not exist and where module state is
	 * shared between requests, so restoring there would put one visitor's answers in front of
	 * the next.
	 */
	restore(): void {
		if (!browser || this.#restored) return;

		this.#restored = true;

		const saved = loadSession();
		if (!saved) return;

		this.#answers = saved.answers;
		this.#anamnesisUid = saved.anamnesisUid;
		// Answers on this device are the proof that the walk has begun, which is what a fresh
		// load otherwise has no way to know: `started` is what stops an address the visitor has
		// not reached from opening, and a restored session has reached one.
		this.#started = true;
	}

	/**
	 * Whether the visitor has moved off a screen themselves. False on every fresh load, which
	 * is what sends a reload back to the first screen rather than to the first unanswered one.
	 */
	get started(): boolean {
		return this.#started;
	}

	/** One answer, for a component that renders a single question. */
	get<Id extends QuestionId>(id: Id): Answers[Id] {
		return this.#answers[id];
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
		this.#save();
	}

	/** Every write goes through here, so nothing can change without the copy following it. */
	#save(): void {
		saveSession({ answers: this.#answers, anamnesisUid: this.#anamnesisUid });
	}

	/**
	 * The submitted anamnesis. Its presence is what ends the questionnaire: the record exists
	 * at RxScale, a doctor will read it, and nothing on this side can amend or replace it.
	 */
	get anamnesisUid(): string | null {
		return this.#anamnesisUid;
	}

	recordSubmission(uid: string): void {
		this.#anamnesisUid = uid;
		// Stored with the answers, because it is what stops a reload from filing a second
		// anamnesis for the same person. See `SavedSession` for the whole reasoning.
		this.#save();
	}

	markStarted(): void {
		this.#started = true;
		// The step a resume returns to is derived from the answers, so nothing about the
		// position is stored; what has to survive is that there are answers at all.
		this.#save();
	}

	/**
	 * The questionnaire is over: the record is with a doctor and the visitor is leaving for
	 * the checkout. Only the stored copy goes, not the in-memory one, because the browser is
	 * mid-navigation and the screen it is still showing reads from it.
	 */
	finish(): void {
		clearSession();
	}

	/** Back to an empty questionnaire, with no trace of the last one, saved copy included. */
	reset(): void {
		this.#answers = emptyAnswers();
		this.#started = false;
		this.#anamnesisUid = null;
		clearSession();
	}
}

export const answerStore = new AnswerStore();
