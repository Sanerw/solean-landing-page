import type { Model } from 'survey-core';
import { WEIGHT_QUESTION } from '$lib/config/answers';
import { stepIdForPage } from './steps';

/** `survey.data`: question name to answer, the shape the submission sends. */
export type AnswerData = Record<string, unknown>;

/**
 * The weight in kilograms, or null when it has not been given or is not a number we can
 * project from. Pure and separate from the engine so the reading rule can be checked against
 * a plain object.
 *
 * The inputs are text, so the stored value is a string: the model validates the range, not
 * the type.
 */
export function readWeightKg(data: AnswerData): number | null {
	const answer = data[WEIGHT_QUESTION.name];
	if (typeof answer !== 'object' || answer === null) return null;

	const raw = (answer as Record<string, unknown>)[WEIGHT_QUESTION.weightItem];
	if (typeof raw !== 'string' && typeof raw !== 'number') return null;

	const kg = Number(raw);

	return Number.isFinite(kg) && kg > 0 ? kg : null;
}

/** The step that asks for the weight, read from the model rather than configured twice. */
export function weightStepId(survey: Model): string | null {
	const page = survey.getQuestionByName(WEIGHT_QUESTION.name)?.page;

	return page ? stepIdForPage(page.name) : null;
}
