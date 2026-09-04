import type { AnyQuestion, ChoiceOption } from './kinds';

/**
 * The one shape every field component takes.
 *
 * Deliberately narrower than the props the RxScale-driven components took: those received a
 * `survey-core` Question and reached into it for choices, placeholders and error state. Here
 * the screen resolves all of that first, so a component reads its props and nothing else.
 * That is what lets a component be rendered from a test or a preview harness without an
 * engine behind it.
 */
export interface FieldProps {
	readonly question: AnyQuestion;
	/** Already resolved, so a component never calls `optionsFor` itself. */
	readonly options: readonly ChoiceOption[];
	readonly controlId: string;
	/**
	 * `unknown` because the kinds do not agree on one type: a `single` answers with a string,
	 * a `multi` with an array, a `consent` with a boolean. Each component narrows what it
	 * accepts, and `kinds.ts` is what guarantees the pairing at the definition.
	 */
	readonly value: unknown;
	readonly onchange: (next: unknown) => void;
	/** The `<id>Other` free text. Empty string when the question has no "other". */
	readonly other: string;
	readonly onother: (next: string) => void;
	readonly invalid: boolean;
	readonly describedBy: string | undefined;
}
