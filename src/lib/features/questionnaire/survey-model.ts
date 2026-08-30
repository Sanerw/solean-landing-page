import { ElementFactory, Model, Question, Serializer } from 'survey-core';
import type { SurveyModelJson } from './anamnesis-client';

/**
 * RxScale's questionnaires use their own `os-date-picker` widget, which stock survey-core
 * does not know. An unregistered type is not merely unrendered: the engine drops the
 * element while parsing, and when it is the only live element on its page the page leaves
 * the flow silently. In the live model that page is the date of birth.
 *
 * Registered exactly as RxScale's own storefront snippet does, as a plain question with no
 * extra properties, so the engine keeps the element and its `isRequired` rule. What draws
 * it is our own renderer.
 */
const OS_DATE_PICKER = 'os-date-picker';

class OsDatePickerQuestion extends Question {
	getType(): string {
		return OS_DATE_PICKER;
	}
}

if (!Serializer.findClass(OS_DATE_PICKER)) {
	ElementFactory.Instance.registerElement(OS_DATE_PICKER, (name) => new OsDatePickerQuestion(name));
	Serializer.addClass(OS_DATE_PICKER, [], () => new OsDatePickerQuestion('OS Date Picker'), 'question');
}

export interface ModelQuestion {
	pageName: string;
	name: string;
	/** The model's own type string. Mapping it onto a component is the registry's job. */
	type: string;
	title: string;
	isRequired: boolean;
	hasVisibleIf: boolean;
	/**
	 * False when survey-core does not know the type and dropped the element while parsing.
	 * The live model contains `os-date-picker`, an RxScale widget the engine discards, so a
	 * question can exist in the model, be required by the server-side validator, and be
	 * absent from `getAllQuestions()`. Counting from the raw JSON is what makes that visible.
	 */
	recognised: boolean;
}

export interface ModelInventory {
	pageNames: string[];
	questions: ModelQuestion[];
	unrecognised: ModelQuestion[];
}

/** The engine is state only: branching, validation and the `data` shape. The UI is ours. */
export function createSurvey(model: SurveyModelJson): Model {
	const survey = new Model(model);
	survey.showNavigationButtons = false;

	return survey;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

/** A localized title is an object keyed by locale; the model also uses plain strings. */
function toTitle(value: unknown): string {
	if (typeof value === 'string') return value;
	if (isRecord(value)) {
		const localized = value.default ?? Object.values(value)[0];
		if (typeof localized === 'string') return localized;
	}

	return '';
}

/** Panels nest their own elements, so the walk cannot assume one level. */
function walkElements(elements: unknown, onElement: (element: Record<string, unknown>) => void) {
	if (!Array.isArray(elements)) return;

	for (const element of elements) {
		if (!isRecord(element)) continue;
		onElement(element);
		walkElements(element.elements, onElement);
	}
}

/**
 * Read from the raw document rather than from the engine, so an element the engine could
 * not parse is still reported instead of vanishing from the count.
 */
export function inventory(survey: Model, model: SurveyModelJson): ModelInventory {
	const questions: ModelQuestion[] = [];
	const pageNames: string[] = [];

	for (const [index, page] of model.pages.entries()) {
		if (!isRecord(page)) continue;

		const pageName = typeof page.name === 'string' ? page.name : `page ${index + 1}`;
		pageNames.push(pageName);

		walkElements(page.elements, (element) => {
			const name = typeof element.name === 'string' ? element.name : '';
			const parsed = name ? survey.getQuestionByName(name) : null;

			questions.push({
				pageName,
				name,
				type: typeof element.type === 'string' ? element.type : '',
				title: parsed?.title ?? toTitle(element.title),
				isRequired: element.isRequired === true,
				hasVisibleIf: typeof element.visibleIf === 'string' && element.visibleIf.length > 0,
				recognised: parsed !== null
			});
		});
	}

	return {
		pageNames,
		questions,
		unrecognised: questions.filter((question) => !question.recognised)
	};
}
