/**
 * Every answer the questionnaire collects, as one typed object.
 *
 * This is the shape feature 24 turns the questionnaire into. Through feature 23 the answers
 * lived in `survey.data`, an untyped `Record<string, unknown>` keyed by RxScale's question
 * names, because the questions were theirs. The questions are ours now, so the answers get a
 * type: a field per question, named for the question, and 24b's mapper is the one place that
 * knows what RxScale calls any of it.
 *
 * Nothing here is persisted. See `store.svelte.ts` for where an instance lives.
 */

/** RxScale's `Gender` values, kept verbatim so 24b's mapper is an identity here. */
export type Gender = 'female' | 'male';

/** RxScale spells yes and no differently per question, so each field carries its own pair. */
export type YesNoCapitalised = 'Yes' | 'No';
export type YesNoLowercase = 'yes' | 'no';

/**
 * One choice covers both of RxScale's medication questions: `never` answers
 * `TakingWeightlossMedication` with no, and every other value answers it with yes and names
 * the medication in `WeightlossMedication`. Modelling it as two questions would let a visitor
 * say both that they have never taken anything and which thing they took.
 */
export type PastMedication =
	| 'never'
	| 'wegovy'
	| 'mounjaro'
	| 'saxenda'
	| 'nevolat (liraglutid)'
	| 'ozempic'
	| 'Orlistat'
	| 'rybelsus'
	| 'victoza'
	| 'xenical'
	| 'byetta'
	| 'bydureon'
	| 'trulicity'
	| 'tanzeum'
	| 'other';

export interface Answers {
	// about-you
	gender: Gender | null;
	/** `YYYY-MM-DD`, the format RxScale's `os-date-picker` was confirmed to store. */
	dateOfBirth: string | null;
	/** Text, not a number: the input is text and the range is validation's job. */
	heightCm: string;
	weightKg: string;

	// weight-related-conditions
	weightRelatedConditions: string[];
	weightRelatedConditionsOther: string;

	// your-details
	firstName: string;
	lastName: string;
	email: string;
	/** Collected because the export asks for it. Nothing sends it anywhere. */
	phone: string;

	// medication-history
	pastMedication: PastMedication | null;
	pastMedicationOther: string;
	pastMedicationDose: string | null;
	pastMedicationDuration: string;
	pastMedicationLastDose: string;

	// side-effects
	hasSideEffects: YesNoCapitalised | null;
	sideEffectsDescription: string;

	// pregnancy
	pregnancyStatus: string[];

	// medical-conditions
	diseases: string[];
	diseasesOther: string;

	// gallbladder
	gallbladderRemoved: YesNoCapitalised | null;

	// health-history
	familyDiseases: string[];
	mentalHealth: YesNoCapitalised | null;

	// eating-disorders
	eatingDisorder: YesNoCapitalised | null;
	eatingDisorderStatements: string[];

	// allergies
	allergies: string[];
	allergiesOther: string;
	otherMedication: YesNoLowercase | null;
	otherMedicationDescription: string;

	// disclaimers
	disclaimer: boolean;
	contraceptionDisclaimer: boolean;
}

/**
 * Every field, including the `*Other` free-text siblings, which are fields rather than
 * questions: RxScale keeps an "other" comment apart from the answer it belongs to, so the
 * definition does too. A question's id is always one of these, which is what makes
 * `QuestionDef` able to tie a question's kind to the type of the answer it writes.
 */
export type QuestionId = keyof Answers;

/**
 * A fresh, empty set of answers.
 *
 * Written as one literal so the return type is the guarantee that no field is forgotten: a
 * missing key fails `pnpm check` rather than showing up as an undefined answer. The arrays
 * are constructed here on every call, and that is load-bearing rather than incidental. A
 * shared `[]` between calls would let one visitor's selections appear in the next session
 * that reset the store.
 */
export function emptyAnswers(): Answers {
	return {
		gender: null,
		dateOfBirth: null,
		heightCm: '',
		weightKg: '',
		weightRelatedConditions: [],
		weightRelatedConditionsOther: '',
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		pastMedication: null,
		pastMedicationOther: '',
		pastMedicationDose: null,
		pastMedicationDuration: '',
		pastMedicationLastDose: '',
		hasSideEffects: null,
		sideEffectsDescription: '',
		pregnancyStatus: [],
		diseases: [],
		diseasesOther: '',
		gallbladderRemoved: null,
		familyDiseases: [],
		mentalHealth: null,
		eatingDisorder: null,
		eatingDisorderStatements: [],
		allergies: [],
		allergiesOther: '',
		otherMedication: null,
		otherMedicationDescription: '',
		disclaimer: false,
		contraceptionDisclaimer: false
	};
}

/**
 * The five medications RxScale follows up on. Their dose, duration, last-dose and
 * side-effect questions all carry this exact list in their `visibleIf`, so it is stated once
 * and read by both the dose catalogue and the branching.
 */
export const MEDICATIONS_WITH_DOSE: readonly PastMedication[] = [
	'wegovy',
	'ozempic',
	'saxenda',
	'nevolat (liraglutid)',
	'mounjaro'
];

/**
 * The one disease answer that opens a follow-up question. RxScale's own rule reads
 * `{Diseases} allof ['Gallstones, gallbladder disease']`, comparing the string literally, so
 * it lives here as a constant rather than being retyped where it is needed.
 */
export const GALLSTONES = 'Gallstones, gallbladder disease';
