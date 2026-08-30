import type { Component } from 'svelte';
import type { Question } from 'survey-core';
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
}

type QuestionRenderer = Component<QuestionFieldProps>;

interface RegistryEntry {
	renderer: QuestionRenderer;
	/** Several controls answering one question need a fieldset and legend, one needs a label. */
	group: boolean;
}

const BY_TYPE: Record<string, RegistryEntry> = {
	radiogroup: { renderer: RadiogroupField, group: true },
	text: { renderer: TextField, group: false }
};

export type RendererLookup =
	| { renderer: QuestionRenderer; group: boolean; reason: null }
	| { renderer: null; group: false; reason: string };

function hasOtherChoice(question: Question): boolean {
	return 'hasOther' in question && question.hasOther === true;
}

/**
 * Keyed by the question, not only its type: a type we render in general can still carry a
 * capability we do not have yet, and answering it would fail the model's own validation.
 * Either way the caller shows the question as unrenderable rather than skipping it.
 */
export function rendererFor(question: Question): RendererLookup {
	const entry = BY_TYPE[question.getType()];

	if (!entry) {
		return { renderer: null, group: false, reason: `no renderer for type "${question.getType()}"` };
	}

	if (hasOtherChoice(question)) {
		return {
			renderer: null,
			group: false,
			reason: 'the free-text "other" choice is not implemented yet'
		};
	}

	return { renderer: entry.renderer, group: entry.group, reason: null };
}
