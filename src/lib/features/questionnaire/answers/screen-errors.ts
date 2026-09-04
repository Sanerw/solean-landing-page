import type { QuestionId } from './types';
import type { ValidationCode } from './validate';

/**
 * Which of the two things that can be wrong with an answer the screen shows.
 *
 * Two validators reach one question. Ours says the answer is missing or malformed; RxScale's
 * says a complete answer is not eligible. **Ours wins**, and the order is not arbitrary:
 * showing theirs first would tell somebody who has typed nothing that they cannot be
 * treated, which is both wrong and alarming.
 *
 * They also differ in kind, which is why this returns a tagged result rather than a string.
 * Ours is a code the screen translates, because 24a made the wording ours to own in two
 * languages. Theirs is a German sentence passed through untouched, because a refusal is a
 * clinical statement and paraphrasing one is a decision nobody has taken.
 */
export type ScreenError =
	| { readonly source: 'ours'; readonly code: ValidationCode }
	| { readonly source: 'theirs'; readonly text: string };

export function screenErrorFor(
	id: QuestionId,
	ours: Partial<Record<QuestionId, ValidationCode>>,
	theirs: Partial<Record<QuestionId, string>>
): ScreenError | null {
	const code = ours[id];
	if (code) return { source: 'ours', code };

	const text = theirs[id];

	return text ? { source: 'theirs', text } : null;
}

/** Whether anything on the screen blocks it, from either source. */
export function hasBlockingError(
	ids: readonly QuestionId[],
	ours: Partial<Record<QuestionId, ValidationCode>>,
	theirs: Partial<Record<QuestionId, string>>
): boolean {
	return ids.some((id) => screenErrorFor(id, ours, theirs) !== null);
}
