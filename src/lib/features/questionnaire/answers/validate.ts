import { NONE_VALUE, OTHER_VALUE, type AnyQuestion } from '../definition/kinds';
import { screenById, visibleQuestions } from '../definition/screens';
import type { Answers, QuestionId } from './types';

/**
 * Our half of the validation.
 *
 * Three layers check a questionnaire from feature 24 onward, and this is only the first:
 * ours, on the screen the visitor is standing on. RxScale's own `visibleIf` and `validators`
 * run from the committed snapshot in 24b, and their server validates the submission itself.
 * Nothing medical is decided here. What is decided here is whether an answer is present,
 * well formed, and plausible.
 */

/**
 * What is wrong, not how to say it.
 *
 * A validator that returned a sentence would have to know the visitor's language, and its
 * tests would then assert wording rather than behaviour, breaking on a copy edit. Turning a
 * code into German or English is the screen's job, in 24c.
 */
export type ValidationCode =
	| 'required'
	| 'out-of-range'
	| 'invalid-email'
	| 'invalid-date'
	| 'none-with-others'
	| 'other-text-missing';

export type ScreenErrors = Partial<Record<QuestionId, ValidationCode>>;

/** Permissive on purpose: the address is proved by a mail arriving, not by a pattern. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isBlank(value: unknown): boolean {
	if (typeof value === 'string') return value.trim() === '';
	if (Array.isArray(value)) return value.length === 0;

	return value === null || value === undefined || value === false;
}

/**
 * A date that exists in the calendar. `new Date('2026-02-31')` is not an error in JavaScript,
 * it silently becomes the 3rd of March, so the round trip back to a string is what catches it.
 */
function isRealDate(value: string): boolean {
	if (!ISO_DATE.test(value)) return false;

	const parsed = new Date(`${value}T00:00:00Z`);

	return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/**
 * One question against one set of answers, or null when nothing is wrong.
 *
 * Whether the question is asked at all is the caller's business: a question hidden by
 * branching is never validated, because an answer nobody was asked for cannot be missing.
 */
export function validateQuestion(
	question: AnyQuestion,
	answers: Answers,
	today: Date = new Date()
): ValidationCode | null {
	const value = answers[question.id];

	if (isBlank(value)) return question.optional ? null : 'required';

	if (question.hasNone && Array.isArray(value) && value.includes(NONE_VALUE) && value.length > 1) {
		return 'none-with-others';
	}

	if (question.hasOther && question.otherField) {
		const chose = Array.isArray(value) ? value.includes(OTHER_VALUE) : value === OTHER_VALUE;

		if (chose && isBlank(answers[question.otherField])) return 'other-text-missing';
	}

	if (question.kind === 'number' && typeof value === 'string') {
		const parsed = Number(value.replace(',', '.').trim());
		if (!Number.isFinite(parsed) || parsed <= 0) return 'out-of-range';

		const { range } = question;
		if (range && (parsed < range.min || parsed > range.max)) return 'out-of-range';
	}

	if (question.id === 'email' && typeof value === 'string' && !EMAIL.test(value.trim())) {
		return 'invalid-email';
	}

	if (question.kind === 'date' && typeof value === 'string') {
		if (!isRealDate(value)) return 'invalid-date';
		// Not the age window: 18 to 80 is RxScale's rule, with RxScale's refusal, and it
		// arrives from the snapshot in 24b. A birthday that has not happened yet is simply
		// not a birthday.
		if (new Date(`${value}T00:00:00Z`).getTime() > today.getTime()) return 'invalid-date';
	}

	return null;
}

/**
 * Everything wrong on one screen, keyed by question. An empty object means the visitor may
 * continue, as far as this layer is concerned.
 */
export function validateScreen(
	screenId: string,
	answers: Answers,
	today: Date = new Date()
): ScreenErrors {
	const errors: ScreenErrors = {};

	for (const question of visibleQuestions(screenById(screenId), answers)) {
		const code = validateQuestion(question, answers, today);
		if (code) errors[question.id] = code;
	}

	return errors;
}
