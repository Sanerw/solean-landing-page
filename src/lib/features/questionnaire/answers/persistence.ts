import { emptyAnswers, type Answers } from './types';

/**
 * Where an unfinished questionnaire waits between visits.
 *
 * **`localStorage`, deliberately, and never a cookie.** A cookie is sent to the server on
 * every request, so medical answers would travel in a header on each page load and land in
 * the host's access logs; `project-overview.md` states that nothing about the answers is
 * stored or logged server-side. Local storage keeps them in the browser, where the person who
 * typed them is the only one who has them.
 *
 * This reverses the "the browser stores nothing either" rule that held through feature 24d.
 * What replaces it is narrower and stated here: answers are kept, for 30 days, on this device
 * only, and are erased the moment the questionnaire has served its purpose.
 */

/** One key for the whole session: the answers and the uid that proves they were sent. */
const KEY = 'solean.questionnaire.session';

/** 30 days, agreed at review. Long enough to come back to, short enough not to linger. */
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export interface SavedSession {
	readonly answers: Answers;
	/**
	 * The submitted anamnesis, kept with the answers rather than left in memory.
	 *
	 * Not a convenience. `resolveStepEntry` refuses to re-open the questions once a uid
	 * exists, and that guard is the only thing standing between a reload and a second
	 * anamnesis for the same person: the answers now survive a reload, so without the uid
	 * beside them a refresh on the order screen would land on the last question with every
	 * answer filled in and Continue would file the record again.
	 */
	readonly anamnesisUid: string | null;
}

interface Saved extends SavedSession {
	readonly savedAt: number;
}

/**
 * Storage a private-mode browser may refuse to hand over. Reading it throws in Safari with
 * cookies blocked, and a questionnaire must not fail to open because a convenience is
 * unavailable, so every call is guarded and a failure means "nothing saved".
 */
function storage(): Storage | null {
	try {
		return window.localStorage;
	} catch {
		return null;
	}
}

/**
 * Only the keys a blank questionnaire has, and only where the type still matches.
 *
 * The stored document is input, not state: it can be old, hand-edited, or written by a
 * different version of this app. Copying it wholesale would put a key the definition no
 * longer has into the payload, or a string where an array belongs, and the first place that
 * would surface is RxScale refusing the submission.
 */
function reconcile(stored: unknown): Answers {
	const fresh = emptyAnswers();
	if (typeof stored !== 'object' || stored === null) return fresh;

	const source = stored as Record<string, unknown>;

	for (const key of Object.keys(fresh) as (keyof Answers)[]) {
		const value = source[key];

		if (fits(fresh[key], value)) (fresh[key] as unknown) = value;
	}

	return fresh;
}

/**
 * Whether a stored value can stand where an empty answer is.
 *
 * The empty value carries the shape, and the two are not always the same type: a choice is
 * empty at `null` and answered with a string, so comparing `typeof` against the empty value
 * refuses every answer a visitor actually gave. `false` and `null` are answers in their own
 * right here, which is why nothing tests truthiness.
 */
function fits(empty: unknown, value: unknown): boolean {
	if (Array.isArray(empty)) {
		return Array.isArray(value) && value.every((item) => typeof item === 'string');
	}

	// A choice or a date: unanswered, or the string the answer is.
	if (empty === null) return value === null || typeof value === 'string';
	if (typeof empty === 'boolean') return typeof value === 'boolean';

	return typeof value === 'string';
}

/** The session saved on this device, or null when there is none worth restoring. */
export function loadSession(): SavedSession | null {
	const store = storage();
	if (!store) return null;

	try {
		const raw = store.getItem(KEY);
		if (!raw) return null;

		const parsed = JSON.parse(raw) as Partial<Saved>;
		const savedAt = typeof parsed.savedAt === 'number' ? parsed.savedAt : 0;

		// Expiry is enforced on read as well as being written as a timestamp: local storage has
		// no expiry of its own, so nothing else would ever remove an abandoned questionnaire.
		if (Date.now() - savedAt > MAX_AGE_MS) {
			clearSession();
			return null;
		}

		return {
			answers: reconcile(parsed.answers),
			anamnesisUid: typeof parsed.anamnesisUid === 'string' ? parsed.anamnesisUid : null
		};
	} catch {
		// Unparseable is the same as absent, and it is not worth reporting: the only thing to
		// do about it is start over, which is what returning null does.
		clearSession();
		return null;
	}
}

export function saveSession(session: SavedSession): void {
	const store = storage();
	if (!store) return;

	try {
		const document: Saved = { savedAt: Date.now(), ...session };
		store.setItem(KEY, JSON.stringify(document));
	} catch {
		// A full or refused store is not a reason to interrupt somebody answering questions
		// about their health. They lose the convenience, not the questionnaire.
	}
}

/** Erase it. Called when the questionnaire is over, and when what is stored is unusable. */
export function clearSession(): void {
	try {
		storage()?.removeItem(KEY);
	} catch {
		// Nothing to do: the store already refuses us.
	}
}
