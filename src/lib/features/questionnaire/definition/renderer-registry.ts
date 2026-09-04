import type { Component } from 'svelte';
import ChoiceField from '../fields/ChoiceField.svelte';
import CommentField from '../fields/CommentField.svelte';
import ConsentField from '../fields/ConsentField.svelte';
import DateField from '../fields/DateField.svelte';
import MultiChoiceField from '../fields/MultiChoiceField.svelte';
import NumberInputField from '../fields/NumberInputField.svelte';
import TextInputField from '../fields/TextInputField.svelte';
import type { FieldProps } from './field-props';
import type { AnyQuestion, QuestionKind } from './kinds';

/**
 * Which component draws which kind.
 *
 * Keyed by our own `QuestionKind`, not RxScale's type string, which is the whole difference
 * between this and `question-registry.ts`. Their types described a SurveyJS element; ours
 * describe what a person operates.
 *
 * A `Record<QuestionKind, ...>` rather than a lookup with a fallback: adding a kind without a
 * component is then a build error, not a question that silently fails to draw at runtime.
 */

/**
 * How the screen frames the control. Several controls answering one question need a fieldset
 * and a legend; one control needs a label.
 */
export type Presentation = 'control' | 'group';

interface RegistryEntry {
	readonly renderer: Component<FieldProps>;
	readonly presentation: Presentation;
}

const BY_KIND: Record<QuestionKind, RegistryEntry> = {
	single: { renderer: ChoiceField, presentation: 'group' },
	multi: { renderer: MultiChoiceField, presentation: 'group' },
	text: { renderer: TextInputField, presentation: 'control' },
	number: { renderer: NumberInputField, presentation: 'control' },
	date: { renderer: DateField, presentation: 'control' },
	comment: { renderer: CommentField, presentation: 'control' },
	consent: { renderer: ConsentField, presentation: 'group' }
};

export type RendererLookup =
	| { readonly entry: RegistryEntry; readonly reason: null }
	| { readonly entry: null; readonly reason: string };

/**
 * The component for a question, or the reason it cannot be drawn.
 *
 * The registry itself can never miss: the record is exhaustive and the compiler enforces it.
 * What this catches is the case the type system cannot see, a choice question whose options
 * resolve empty for the answers so far, which would render as a question with nothing to
 * pick. `project-overview.md` requires that to fail visibly rather than be skipped.
 */
export function rendererFor(
	question: AnyQuestion,
	options: readonly unknown[]
): RendererLookup {
	const entry = BY_KIND[question.kind];

	if ((question.kind === 'single' || question.kind === 'multi') && options.length === 0) {
		return { entry: null, reason: `"${question.id}" resolved no options to choose from` };
	}

	return { entry, reason: null };
}
