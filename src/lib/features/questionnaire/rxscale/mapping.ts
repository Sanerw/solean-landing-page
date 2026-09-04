import type { Answers, QuestionId } from '../answers/types';
import { OTHER_VALUE } from '../definition/kinds';
import { questionById } from '../definition/questions';
import { visibleQuestions, visibleScreens } from '../definition/screens';

/**
 * How our answers become RxScale's.
 *
 * One rule per fact, declaring the questions of ours it reads and the questions of theirs it
 * writes. Declaring both beside the function is what lets the coverage guards and the reverse
 * index be derived rather than hand-maintained: a rule added without a matching guard entry
 * is the failure this shape makes impossible.
 */

/** The submission body: `survey.data` in RxScale's own shape, which is what they validate. */
export type AnamnesisData = Record<string, unknown>;

export interface MappingRule {
	/** Our questions. The rule runs only when the branching says all of them are asked. */
	readonly reads: readonly QuestionId[];
	/** Their question names, including any `-Comment` sibling this rule may write. */
	readonly writes: readonly string[];
	/** Where a refusal about any of `writes` belongs on screen. */
	readonly owner: QuestionId;
	readonly apply: (answers: Answers, out: AnamnesisData) => void;
}

/** Our questions that reach RxScale nowhere, each with the reason it does not. */
export const DROPPED: Partial<Record<QuestionId, string>> = {
	phone: 'RxScale has no phone question, and the Shopify cart does not carry one either.'
};

function isEmpty(value: unknown): boolean {
	if (typeof value === 'string') return value.trim() === '';
	if (Array.isArray(value)) return value.length === 0;

	return value === null || value === undefined || value === false;
}

/**
 * The questions the branching currently asks.
 *
 * Answers are not cleared when a branch closes, so a visitor who named Mounjaro, entered a
 * dose and then switched to "never" still has that dose in the store. RxScale's `question4`
 * is hidden for that answer, and a value sent for a question their model hides is exactly the
 * divergence their validator exists to catch.
 */
function askedNow(answers: Answers): ReadonlySet<QuestionId> {
	const asked = new Set<QuestionId>();

	for (const screen of visibleScreens(answers)) {
		for (const question of visibleQuestions(screen, answers)) asked.add(question.id);
	}

	return asked;
}

/**
 * survey-core keeps an "other" free text apart from the answer and serialises it under this
 * suffix. It is the library's convention rather than anything the model states, so
 * `mapping.test.ts` proves it against a real survey instance instead of trusting it.
 */
export function commentKey(modelName: string): string {
	return `${modelName}-Comment`;
}

/**
 * A measurement as RxScale stores it: a number, because their item validators compare
 * numerically (`{WeightSize.size} > 120`).
 *
 * The comma handling mirrors `bmi()` in `conditions.ts`, deliberately rather than by import:
 * that module is 24a's and this one may not amend it. `mapping.test.ts` asserts the two agree
 * on what counts as a number, so a divergence fails rather than making the payload disagree
 * with the BMI the visitor was shown.
 */
function toNumber(raw: string): number | null {
	const value = Number(raw.replace(',', '.').trim());

	return raw.trim() !== '' && Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * Two of our questions can write into one answer of theirs: height and weight both land in
 * `WeightSize`, first and last name both in `Name`. Each rule contributes its own key, so the
 * second must not replace what the first wrote.
 */
function mergeInto(out: AnamnesisData, modelName: string, part: Record<string, unknown>): void {
	const existing = out[modelName];
	const base = typeof existing === 'object' && existing !== null ? existing : {};

	out[modelName] = { ...base, ...part };
}

/**
 * The common case: our answer travels unchanged under their name, with the "other" free text
 * following it when the question has one and the visitor chose it.
 */
function rename(id: QuestionId, modelName: string): MappingRule {
	const question = questionById(id);
	const carriesComment = question.hasOther === true && question.otherField !== undefined;

	return {
		reads: [id],
		writes: carriesComment ? [modelName, commentKey(modelName)] : [modelName],
		owner: id,
		apply(answers, out) {
			const value = answers[id];
			if (isEmpty(value)) return;

			out[modelName] = value;

			if (!carriesComment || !question.otherField) return;

			const chose = Array.isArray(value) ? value.includes(OTHER_VALUE) : value === OTHER_VALUE;
			const comment = answers[question.otherField];

			// Free text left behind by an "other" that is no longer chosen must not travel: it is
			// an answer to a question nobody is being asked.
			if (chose && !isEmpty(comment)) out[commentKey(modelName)] = comment;
		}
	};
}

/**
 * The rules that change shape rather than only name. Each one is a place RxScale's model and
 * ours disagree about how a fact is stored, and each is a place a wrong literal fails
 * silently, because their validators compare strings exactly and raise nothing on a mismatch.
 */

/** The same date twice, in two shapes, both of which their model requires. */
const dateOfBirthRule: MappingRule = {
	reads: ['dateOfBirth'],
	writes: ['dob', 'dob2'],
	owner: 'dateOfBirth',
	apply(answers, out) {
		const value = answers.dateOfBirth;
		if (isEmpty(value) || value === null) return;

		const [year, month, day] = value.split('-').map(Number);
		if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return;

		// `dob` is the string feature 10 confirmed their date widget stores. `dob2` is the same
		// date as numbers, because its item validators use `minValueExpression` and compare
		// numerically; its Year range of 1935 to 2007 is how their model spells the age gate.
		out.dob = value;
		out.dob2 = { Day: day, Month: month, Year: year };
	}
};

/**
 * Their model asks the name three times: once as a two-item object and once as each half on
 * its own, all three required. Redundant, and not optional.
 */
const firstNameRule: MappingRule = {
	reads: ['firstName'],
	writes: ['FirstName', 'Name'],
	owner: 'firstName',
	apply(answers, out) {
		if (isEmpty(answers.firstName)) return;

		out.FirstName = answers.firstName;
		mergeInto(out, 'Name', { Name: answers.firstName });
	}
};

const lastNameRule: MappingRule = {
	reads: ['lastName'],
	writes: ['Surname'],
	owner: 'lastName',
	apply(answers, out) {
		if (isEmpty(answers.lastName)) return;

		out.Surname = answers.lastName;
		mergeInto(out, 'Name', { Surname: answers.lastName });
	}
};

/**
 * Both of these write `WeightSize`, and both say so: `writes` is what the coverage guards and
 * the reverse index are derived from, so a rule that under-declares would quietly excuse
 * itself from the guard that exists to catch it.
 *
 * The weight rule is listed first on purpose. Their BMI validator lives on `WeightSize`, and
 * `ourQuestionFor` takes the first rule that writes a name, so a refusal about the BMI lands
 * on the weight, which is the answer a person would change.
 */
const weightRule: MappingRule = {
	reads: ['weightKg'],
	writes: ['WeightSize'],
	owner: 'weightKg',
	apply(answers, out) {
		const weight = toNumber(answers.weightKg);
		if (weight === null) return;

		mergeInto(out, 'WeightSize', { weight });
	}
};

const heightRule: MappingRule = {
	reads: ['heightCm'],
	writes: ['WeightSize'],
	owner: 'heightCm',
	apply(answers, out) {
		const size = toNumber(answers.heightCm);
		if (size === null) return;

		mergeInto(out, 'WeightSize', { size });
	}
};

/**
 * One multi-select of ours becomes two yes/no questions of theirs, and they do not agree on
 * casing: `isPregnantorBreastfeeding` answers lowercase, `PlanningPregnancy` capitalised.
 * They sit on adjacent pages of the same model.
 */
const pregnancyRule: MappingRule = {
	reads: ['pregnancyStatus'],
	writes: ['isPregnantorBreastfeeding', 'PlanningPregnancy'],
	owner: 'pregnancyStatus',
	apply(answers, out) {
		const status = answers.pregnancyStatus;
		if (status.length === 0) return;

		const expecting = status.includes('pregnant') || status.includes('breastfeeding');

		out.isPregnantorBreastfeeding = expecting ? 'yes' : 'no';
		out.PlanningPregnancy = status.includes('planning') ? 'Yes' : 'No';
	}
};

/**
 * One question of ours answers two of theirs: whether they are in treatment at all, and with
 * what. `never` is the answer that makes the second question unaskable, which is why it is an
 * option here rather than a separate question.
 */
const pastMedicationRule: MappingRule = {
	reads: ['pastMedication'],
	writes: ['TakingWeightlossMedication', 'WeightlossMedication', commentKey('WeightlossMedication')],
	owner: 'pastMedication',
	apply(answers, out) {
		const medication = answers.pastMedication;
		if (medication === null) return;

		if (medication === 'never') {
			out.TakingWeightlossMedication = 'no';

			return;
		}

		out.TakingWeightlossMedication = 'yes';
		out.WeightlossMedication = medication;

		if (medication === OTHER_VALUE && !isEmpty(answers.pastMedicationOther)) {
			out[commentKey('WeightlossMedication')] = answers.pastMedicationOther;
		}
	}
};

/**
 * Their model asks the dose four times, once per medication family, and each question stores
 * its values differently: a comma for semaglutide, a period for tirzepatide, no unit at all
 * for liraglutide. 24a's option catalogue already produces the right string; this only has to
 * put it under the right name, and under exactly one.
 */
const DOSE_QUESTION: Partial<Record<NonNullable<Answers['pastMedication']>, string>> = {
	wegovy: 'CurrentDosingSemaglutide',
	ozempic: 'CurrentDosingSemaglutide2',
	saxenda: 'DosingSaxenda',
	'nevolat (liraglutid)': 'DosingSaxenda',
	mounjaro: 'question4'
};

const doseRule: MappingRule = {
	reads: ['pastMedication', 'pastMedicationDose'],
	writes: [
		'CurrentDosingSemaglutide',
		'CurrentDosingSemaglutide2',
		'DosingSaxenda',
		'question4'
	],
	owner: 'pastMedicationDose',
	apply(answers, out) {
		const medication = answers.pastMedication;
		const dose = answers.pastMedicationDose;
		if (medication === null || isEmpty(dose)) return;

		const modelName = DOSE_QUESTION[medication];
		if (modelName) out[modelName] = dose;
	}
};

/**
 * Their consents are a one-item choice list each, and the two are shaped differently:
 * `Disclaimer` is a checkbox and answers with an array of its internal item name, while
 * `ContraceptionDisclaimer` is a radio group and answers with a bare string. Ours are
 * booleans, so those literals live here and nowhere else.
 */
const disclaimerRule: MappingRule = {
	reads: ['disclaimer'],
	writes: ['Disclaimer'],
	owner: 'disclaimer',
	apply(answers, out) {
		if (answers.disclaimer) out.Disclaimer = ['Item 3'];
	}
};

const contraceptionRule: MappingRule = {
	reads: ['contraceptionDisclaimer'],
	writes: ['ContraceptionDisclaimer'],
	owner: 'contraceptionDisclaimer',
	apply(answers, out) {
		if (answers.contraceptionDisclaimer) out.ContraceptionDisclaimer = 'I understand';
	}
};

export const RULES: readonly MappingRule[] = [
	rename('gender', 'Gender'),
	dateOfBirthRule,
	weightRule,
	heightRule,
	firstNameRule,
	lastNameRule,
	rename('email', 'EMail'),
	pregnancyRule,
	pastMedicationRule,
	doseRule,
	disclaimerRule,
	contraceptionRule,
	rename('weightRelatedConditions', 'WeightRelatedConditions'),
	rename('diseases', 'Diseases'),
	rename('gallbladderRemoved', 'GallbladderRemoved'),
	rename('familyDiseases', 'FamilyDiseases'),
	rename('mentalHealth', 'PsychologicalConditions'),
	rename('eatingDisorder', 'EatingDisorder'),
	rename('eatingDisorderStatements', 'question1'),
	rename('allergies', 'allergy'),
	rename('otherMedication', 'OtherMedication'),
	rename('otherMedicationDescription', 'OtherMedicationsDescription'),
	rename('hasSideEffects', 'WegovySideEffects'),
	rename('sideEffectsDescription', 'SideEffectsDescription'),
	rename('pastMedicationDuration', 'DurationCurrentWeightLossDose'),
	rename('pastMedicationLastDose', 'LastIntakeWeightlossMedication')
];

/**
 * The payload for one set of answers.
 *
 * A question nobody answered contributes no key at all rather than a null: their validator
 * reads a present-but-empty answer as an answer, and `{Diseases} = ['none']` would not match
 * a `null` any more than it matches a real selection.
 */
export function toAnamnesisData(answers: Answers): AnamnesisData {
	const asked = askedNow(answers);
	const out: AnamnesisData = {};

	for (const rule of RULES) {
		if (!rule.reads.every((id) => asked.has(id))) continue;

		rule.apply(answers, out);
	}

	return out;
}

/**
 * Which question of ours a refusal about one of theirs belongs to.
 *
 * The first rule that writes the name wins, which matters where two of our questions feed one
 * of theirs: their BMI rule lives on `WeightSize`, and the weight is the answer a person would
 * change, so the rule that writes the weight is listed before the one that writes the height.
 */
export function ourQuestionFor(modelName: string): QuestionId | null {
	return RULES.find((rule) => rule.writes.includes(modelName))?.owner ?? null;
}
