import { GALLSTONES, MEDICATIONS_WITH_DOSE, type Answers } from '../answers/types';

/**
 * Which questions and screens the answers so far call for.
 *
 * RxScale expresses the same rules as SurveyJS expression strings, because their model is
 * data crossing a wire. Ours is code, so a rule is a typed function the compiler checks and a
 * test calls directly, instead of a string parsed at runtime.
 *
 * Every rule here has a counterpart in their model, and 24b's contract test is what keeps the
 * two from drifting apart. Anything that only shapes our own walk, rather than mirroring one
 * of theirs, says so at the rule.
 */

/** A measurement the visitor typed, or null when it is blank or not a usable number. */
function measurement(raw: string): number | null {
	const value = Number(raw.replace(',', '.').trim());

	return raw.trim() !== '' && Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * Body mass index, or null when either measurement is missing or unusable.
 *
 * Null rather than a number is what keeps a blank height out of a division by zero, and what
 * makes an unanswered screen 1 hide screen 2 instead of showing it on a nonsense value.
 */
export function bmi(answers: Answers): number | null {
	const heightCm = measurement(answers.heightCm);
	const weightKg = measurement(answers.weightKg);
	if (heightCm === null || weightKg === null) return null;

	const heightM = heightCm / 100;

	return weightKg / (heightM * heightM);
}

/**
 * RxScale asks about weight-related conditions only between a BMI of 27 and 30, because that
 * is the band where one of them is what makes the treatment prescribable at all. Below 27
 * they refuse outright, above 30 they do not need the answer.
 *
 * Both bounds are inclusive, matching their `>= 27 and <= 30`. This expression exists in two
 * places knowingly: theirs decides whether the question is required, ours decides whether the
 * screen is part of the walk, and they have to agree.
 */
export function asksWeightRelatedConditions(answers: Answers): boolean {
	const value = bmi(answers);

	return value !== null && value >= 27 && value <= 30;
}

/** Their pregnancy questions are gated on the answer to the sex question, and so are ours. */
export function asksPregnancy(answers: Answers): boolean {
	return answers.gender === 'female';
}

/**
 * The follow-up questions about a current GLP-1: dose, how long, last dose, side effects.
 * `never`, `other` and the medications RxScale tracks no dose for all fall outside it.
 */
export function takesTrackedMedication(answers: Answers): boolean {
	return (
		answers.pastMedication !== null && MEDICATIONS_WITH_DOSE.includes(answers.pastMedication)
	);
}

export function reportsSideEffects(answers: Answers): boolean {
	return takesTrackedMedication(answers) && answers.hasSideEffects === 'Yes';
}

export function hadGallstones(answers: Answers): boolean {
	return answers.diseases.includes(GALLSTONES);
}

export function takesOtherMedication(answers: Answers): boolean {
	return answers.otherMedication === 'yes';
}
