import { browser } from '$app/environment';
import type { AnswerData } from './answers';

/**
 * In-progress answers, kept in `sessionStorage` so a refresh does not throw the walk away.
 *
 * Per tab and cleared when the tab closes, which is as long as an unsubmitted anamnesis
 * should outlive the person typing it. Nothing here is logged: the value is real medical
 * content, and the only places it may travel are the submission and this key.
 */
const ANSWERS_PREFIX = 'solean:questionnaire:';
const ANAMNESIS_PREFIX = 'solean:anamnesis:';
const RECOMMENDATION_PREFIX = 'solean:recommendation:';

export interface RecommendationChoice {
	confirmed: true;
	variantId: string | null;
}

/** Version included, so a model change cannot resume against answers to the old one. */
export function answerStorageKey(identifier: string, version: string): string {
	return `${ANSWERS_PREFIX}${identifier}@${version}`;
}

/**
 * The uid of the submitted anamnesis. Kept beside the answers and swept by the same rule,
 * so a new model version can never pair old answers with a live submission.
 */
export function anamnesisStorageKey(identifier: string, version: string): string {
	return `${ANAMNESIS_PREFIX}${identifier}@${version}`;
}

/** The recommendation choice belongs to the same versioned questionnaire session. */
export function recommendationStorageKey(identifier: string, version: string): string {
	return `${RECOMMENDATION_PREFIX}${identifier}@${version}`;
}

/** Storage can be unavailable or full, and neither is a reason to lose the questionnaire. */
function storage(): Storage | null {
	if (!browser) return null;

	try {
		return window.sessionStorage;
	} catch {
		return null;
	}
}

export function loadAnswers(key: string): AnswerData | null {
	const raw = storage()?.getItem(key);
	if (!raw) return null;

	try {
		const parsed: unknown = JSON.parse(raw);

		return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
			? (parsed as AnswerData)
			: null;
	} catch {
		// A key we cannot read is a key we should not keep.
		clearAnswers(key);

		return null;
	}
}

export function saveAnswers(key: string, data: AnswerData): void {
	try {
		storage()?.setItem(key, JSON.stringify(data));
	} catch {
		// Full or blocked storage costs the resume, not the questionnaire.
	}
}

export function loadAnamnesisUid(key: string): string | null {
	const raw = storage()?.getItem(key);

	return raw ? raw : null;
}

export function saveAnamnesisUid(key: string, uid: string): void {
	try {
		storage()?.setItem(key, uid);
	} catch {
		// A uid we cannot store is a resume we cannot offer, not a failed submission.
	}
}

export function loadRecommendationChoice(key: string): RecommendationChoice | null {
	const raw = storage()?.getItem(key);
	if (!raw) return null;

	try {
		const parsed: unknown = JSON.parse(raw);
		if (typeof parsed !== 'object' || parsed === null) return null;

		const value = parsed as Record<string, unknown>;
		if (value.confirmed !== true) return null;
		if (value.variantId !== null && typeof value.variantId !== 'string') return null;

		return { confirmed: true, variantId: value.variantId };
	} catch {
		return null;
	}
}

export function saveRecommendationChoice(key: string, variantId: string | null): void {
	try {
		storage()?.setItem(key, JSON.stringify({ confirmed: true, variantId }));
	} catch {
		// A blocked store loses refresh continuity, not the submitted questionnaire.
	}
}

export function clearRecommendationChoice(key: string): void {
	try {
		storage()?.removeItem(key);
	} catch {
		// As above.
	}
}

export function clearAnswers(key: string): void {
	try {
		storage()?.removeItem(key);
	} catch {
		// As above.
	}
}

/**
 * Drops everything this app stored for another questionnaire or another version of this one.
 * A new version can have renamed or removed the questions those answers belong to, so
 * resuming against them would submit something nobody was asked.
 */
export function dropStaleKeys(keep: readonly string[]): void {
	const store = storage();
	if (!store) return;

	try {
		const stale = Object.keys(store).filter(
			(name) =>
				(name.startsWith(ANSWERS_PREFIX) ||
					name.startsWith(ANAMNESIS_PREFIX) ||
					name.startsWith(RECOMMENDATION_PREFIX)) &&
				!keep.includes(name)
		);
		for (const name of stale) store.removeItem(name);
	} catch {
		// As above.
	}
}
