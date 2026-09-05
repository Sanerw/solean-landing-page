import type { Answers } from './answers/types';
import { SCREENS, visibleScreens } from './definition/screens';

/**
 * Reading the few answers something other than the questionnaire needs.
 *
 * Through feature 23 these read `survey.data`, an untyped bag keyed by RxScale's question
 * names. From 24d they read `Answers`, so the question name is a field and a rename is a
 * compile error rather than a value that silently reads as absent.
 */

/**
 * The weight in kilograms, or null when it has not been given or is not a number the
 * projection could draw. The input is text, so the stored value is a string: the range is
 * validation's business, not this function's.
 *
 * The comma handling matches `bmi()` in `conditions.ts` and the mapper, because a German
 * keyboard types one and all three have to agree about what a measurement is.
 */
export function readWeightKg(answers: Answers): number | null {
	const raw = answers.weightKg.replace(',', '.').trim();
	if (raw === '') return null;

	const kg = Number(raw);

	return Number.isFinite(kg) && kg > 0 ? kg : null;
}

/** The screen that asks for the weight, read from the definition rather than configured. */
export function weightScreenId(answers: Answers): string | null {
	const screen = visibleScreens(answers).find((candidate) =>
		candidate.questionIds.includes('weightKg')
	);

	return screen?.id ?? SCREENS[0]?.id ?? null;
}

/**
 * The buyer's e-mail, or null when it has not been typed. 24a made it required, but a caller
 * can still be asked before the visitor has reached that screen, so absence is a state rather
 * than an error.
 */
export function readEmail(answers: Answers): string | null {
	const trimmed = answers.email.trim();

	return trimmed ? trimmed : null;
}

/** Not answered yet, rather than answered with nothing. */
function answered(value: string): string | undefined {
	return value.trim() || undefined;
}

/**
 * Everything the reminder may carry about a person, or null when the address has not been
 * typed: Customer.io keys the profile by the address, so without one there is nobody to
 * remind and nothing to send.
 *
 * Assembled field by field rather than sliced off `Answers`, which is the whole medical
 * questionnaire. A spread would put a diagnosis on a marketing call the first time somebody
 * widened the shape.
 */
export interface ReminderContact {
	email: string;
	firstName?: string;
	lastName?: string;
	phone?: string;
}

export function readReminderContact(answers: Answers): ReminderContact | null {
	const email = readEmail(answers);
	if (!email) return null;

	return {
		email,
		firstName: answered(answers.firstName),
		lastName: answered(answers.lastName),
		phone: answered(answers.phone)
	};
}
