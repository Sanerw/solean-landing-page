import { NONE_VALUE, OTHER_VALUE, type AnyQuestion } from '../definition/kinds';

/**
 * What a selection becomes when one option is toggled.
 *
 * "None of the above" and a real answer cannot both be true, and something has to enforce
 * that. It is not the validator: `validateScreen` reports `none-with-others` rather than
 * repairing it, because a pure function that rewrites its input is testable as neither a
 * check nor a transform. So the rule lives here, the component applies it as the visitor
 * clicks, and the validator stays as the backstop for a state the UI cannot produce.
 *
 * `survey-core` did this for the old components for free. It is the one behaviour lost by
 * leaving the engine, and the one thing in this module that is not simply list arithmetic.
 */

/** The next selection after `value` is toggled on a multi-choice question. */
export function toggleMulti(
	selected: readonly string[],
	value: string,
	checked: boolean
): readonly string[] {
	if (!checked) return selected.filter((entry) => entry !== value);

	// Choosing "none of the above" is a statement about everything else, so it replaces it.
	if (value === NONE_VALUE) return [NONE_VALUE];

	// And choosing anything real contradicts it.
	return [...selected.filter((entry) => entry !== NONE_VALUE), value];
}

/**
 * Free text belonging to an "other" that is no longer selected.
 *
 * Kept rather than cleared: a visitor who unticks "other" by accident and ticks it again
 * should find their sentence still there. Nothing sends it while the option is deselected,
 * because 24b's mapper reads the selection before the text, so keeping it costs nothing and
 * losing it would be rude.
 */
export function keepsOtherText(question: AnyQuestion, selected: unknown): boolean {
	if (question.hasOther !== true) return false;

	return Array.isArray(selected) ? selected.includes(OTHER_VALUE) : selected === OTHER_VALUE;
}
