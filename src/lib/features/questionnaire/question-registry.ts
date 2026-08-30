import type { Component } from 'svelte';
import type { Question } from 'survey-core';
import CommentField from './fields/CommentField.svelte';
import CheckboxField from './fields/CheckboxField.svelte';
import DateField from './fields/DateField.svelte';
import MultipleTextField from './fields/MultipleTextField.svelte';
import ExpressionField from './fields/ExpressionField.svelte';
import RadiogroupField from './fields/RadiogroupField.svelte';
import TextField from './fields/TextField.svelte';

/**
 * One prop shape for every renderer, so the screen composes them without branching on type.
 * `value` is `unknown` because the model's types do not agree on one: a radiogroup answers
 * with a string, a checkbox with an array. Each renderer narrows what it accepts.
 */
export interface QuestionFieldProps {
	question: Question;
	controlId: string;
	invalid: boolean;
	describedBy: string | undefined;
	value: unknown;
	onchange: (next: unknown) => void;
	/**
	 * The model's free-text companion for an "other" choice. SurveyJS keeps it apart from the
	 * answer, in `question.comment`, and sends it as `<name>-Comment`.
	 */
	comment: string;
	oncomment: (next: string) => void;
}

type QuestionRenderer = Component<QuestionFieldProps>;

/**
 * How the screen frames the renderer: several controls answering one question need a
 * fieldset and legend, one control needs a label, and a display-only element needs neither
 * because there is nothing to name.
 */
export type QuestionPresentation = 'control' | 'group' | 'display';

interface RegistryEntry {
	renderer: QuestionRenderer;
	presentation: QuestionPresentation;
}

const BY_TYPE: Record<string, RegistryEntry> = {
	radiogroup: { renderer: RadiogroupField, presentation: 'group' },
	text: { renderer: TextField, presentation: 'control' },
	expression: { renderer: ExpressionField, presentation: 'display' },
	'os-date-picker': { renderer: DateField, presentation: 'control' },
	comment: { renderer: CommentField, presentation: 'control' },
	multipletext: { renderer: MultipleTextField, presentation: 'group' },
	checkbox: { renderer: CheckboxField, presentation: 'group' }
};

export type RendererLookup =
	| { renderer: QuestionRenderer; presentation: QuestionPresentation; reason: null }
	| { renderer: null; presentation: 'display'; reason: string };

/**
 * Keyed by the question, not only its type: a type we render in general can still carry a
 * capability we do not have yet, and answering it would fail the model's own validation.
 * Either way the caller shows the question as unrenderable rather than skipping it.
 */
export function rendererFor(question: Question): RendererLookup {
	const entry = BY_TYPE[question.getType()];

	if (!entry) {
		return {
			renderer: null,
			presentation: 'display',
			reason: `no renderer for type "${question.getType()}"`
		};
	}

	return { renderer: entry.renderer, presentation: entry.presentation, reason: null };
}
