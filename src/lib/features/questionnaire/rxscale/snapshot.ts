import type { QuestionnaireDocument, SurveyModelJson } from '../anamnesis-client';
import document from './model-snapshot.json';

/**
 * RxScale's questionnaire, committed rather than fetched.
 *
 * Through feature 23 this document arrived on every entry to the flow and was rendered
 * directly. From feature 24 the questions are ours and this is the contract they are mapped
 * onto: it supplies their `visibleIf`, their `validators` and their exact question names, and
 * `pnpm check:model` is what says when the live document has moved away from it.
 *
 * The trade is deliberate and recorded in `project-overview.md`: RxScale can no longer change
 * the funnel without a deploy here, and in exchange a change of theirs fails a command
 * instead of a visitor's submission.
 */
export const MODEL_SNAPSHOT = document as unknown as QuestionnaireDocument;

export const SNAPSHOT_MODEL: SurveyModelJson = MODEL_SNAPSHOT.model;

/** One answerable element of the model, read structurally rather than for display. */
export interface ModelQuestion {
	readonly page: string;
	readonly name: string;
	readonly type: string;
	readonly isRequired: boolean;
	/** Their branching expression, verbatim, or null when the question is always asked. */
	readonly visibleIf: string | null;
	/** Choice values only. The text beside them is display, and display is ours now. */
	readonly choiceValues: readonly string[];
	/** `multipletext` item names, which are the keys inside its answer object. */
	readonly itemNames: readonly string[];
	readonly hasNone: boolean;
	readonly hasOther: boolean;
	/** Their validator expressions, which the shadow runs and the drift check compares. */
	readonly validatorExpressions: readonly string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function text(value: unknown): string | null {
	return typeof value === 'string' && value.length > 0 ? value : null;
}

/**
 * A choice is either an object with a `value`, or a bare string that is its own value. The
 * live model uses both, sometimes inside one question: `allergy` lists `Semaglutide` as an
 * object and `Tirzepatid` as a string.
 */
function choiceValue(choice: unknown): string | null {
	if (typeof choice === 'string') return choice;
	if (isRecord(choice) && typeof choice.value === 'string') return choice.value;

	return null;
}

/**
 * An `expression` element displays a note and takes no answer, so it is not a question and
 * must not be counted as one: three of them sit in this model and none may ever appear in a
 * submission.
 */
const DISPLAY_ONLY = new Set(['expression', 'html', 'image']);

function collect(elements: unknown, page: string, into: ModelQuestion[]): void {
	if (!Array.isArray(elements)) return;

	for (const element of elements) {
		if (!isRecord(element)) continue;

		const name = text(element.name);
		const type = text(element.type);

		if (name && type && !DISPLAY_ONLY.has(type)) {
			into.push({
				page,
				name,
				type,
				isRequired: element.isRequired === true,
				visibleIf: text(element.visibleIf),
				choiceValues: Array.isArray(element.choices)
					? element.choices.map(choiceValue).filter((value): value is string => value !== null)
					: [],
				itemNames: Array.isArray(element.items)
					? element.items
							.map((item) => (isRecord(item) ? text(item.name) : null))
							.filter((item): item is string => item !== null)
					: [],
				hasNone: element.showNoneItem === true,
				hasOther: element.showOtherItem === true,
				validatorExpressions: Array.isArray(element.validators)
					? element.validators
							.map((validator) => (isRecord(validator) ? text(validator.expression) : null))
							.filter((expression): expression is string => expression !== null)
					: []
			});
		}

		// Panels nest their own elements, so the walk cannot assume one level.
		collect(element.elements, page, into);
	}
}

/** Every question of theirs that takes an answer, in the order the document lists them. */
export function modelInventory(model: SurveyModelJson = SNAPSHOT_MODEL): readonly ModelQuestion[] {
	const questions: ModelQuestion[] = [];

	for (const [index, page] of model.pages.entries()) {
		if (!isRecord(page)) continue;

		collect(page.elements, text(page.name) ?? `page ${index + 1}`, questions);
	}

	return questions;
}

export function modelQuestion(name: string): ModelQuestion | null {
	return modelInventory().find((question) => question.name === name) ?? null;
}
