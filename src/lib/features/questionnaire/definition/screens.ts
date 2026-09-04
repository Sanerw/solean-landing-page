import type { Answers, QuestionId } from '../answers/types';
import { asksPregnancy, asksWeightRelatedConditions, hadGallstones, takesTrackedMedication } from './conditions';
import type { AnyQuestion } from './kinds';
import { questionById } from './questions';

/**
 * The twelve screens, in the order the visitor walks them, with Solean's own interludes
 * placed between them.
 *
 * A screen is one page of the questionnaire. Most carry one question; a few carry two or
 * three because the export draws them together, and one carries four.
 */

export type InterludeVariant = 'projection' | 'motivation';

/** The interlude ids, which are also URL segments, so the route can validate one. */
export const INTERLUDE_VARIANTS = ['projection', 'motivation'] as const;

export interface ScreenDef {
	/** The URL segment, kebab-case, and the id progress and routing count by. */
	readonly id: string;
	readonly questionIds: readonly QuestionId[];
	/** Answers this screen is shown for. Absent means always. */
	readonly visibleIf?: (answers: Answers) => boolean;
	/** A Solean screen shown after this one. */
	readonly followedBy?: InterludeVariant;
}

export const SCREENS: readonly ScreenDef[] = [
	{
		id: 'about-you',
		questionIds: ['gender', 'dateOfBirth', 'heightCm', 'weightKg'],
		// The projection can only be honest once the weight is in, and this is where it is
		// asked. The export paces it later, after its fourth question; moving it is one line
		// here, and 24d is where that call belongs.
		followedBy: 'projection'
	},
	{
		id: 'weight-related-conditions',
		questionIds: ['weightRelatedConditions'],
		visibleIf: asksWeightRelatedConditions
	},
	{
		id: 'your-details',
		questionIds: ['firstName', 'lastName', 'email', 'phone']
	},
	{
		id: 'medication-history',
		questionIds: [
			'pastMedication',
			'pastMedicationDose',
			'pastMedicationDuration',
			'pastMedicationLastDose'
		]
	},
	{
		id: 'side-effects',
		questionIds: ['hasSideEffects', 'sideEffectsDescription'],
		visibleIf: takesTrackedMedication
	},
	{
		id: 'pregnancy',
		questionIds: ['pregnancyStatus'],
		visibleIf: asksPregnancy
	},
	{
		id: 'medical-conditions',
		questionIds: ['diseases']
	},
	{
		id: 'gallbladder',
		questionIds: ['gallbladderRemoved'],
		visibleIf: hadGallstones
	},
	{
		id: 'health-history',
		questionIds: ['familyDiseases', 'mentalHealth']
	},
	{
		id: 'eating-disorders',
		questionIds: ['eatingDisorder', 'eatingDisorderStatements'],
		// Roughly the middle of the walk, on a screen no branch can hide, so the interlude
		// cannot vanish for one visitor and not another.
		followedBy: 'motivation'
	},
	{
		id: 'allergies',
		questionIds: ['allergies', 'otherMedication', 'otherMedicationDescription']
	},
	{
		id: 'disclaimers',
		questionIds: ['disclaimer', 'contraceptionDisclaimer']
	}
];

/** Read a screen by id, or throw: an id no screen claims is a programming error. */
export function screenById(id: string): ScreenDef {
	const screen = SCREENS.find((candidate) => candidate.id === id);
	if (!screen) throw new Error(`No screen defined for "${id}"`);

	return screen;
}

/** The screens these answers call for, in order. */
export function visibleScreens(answers: Answers): readonly ScreenDef[] {
	return SCREENS.filter((screen) => !screen.visibleIf || screen.visibleIf(answers));
}

/**
 * The questions this screen asks of this visitor. A screen can be shown while one of its
 * questions is not: `medication-history` always asks which medication, and asks the dose only
 * when RxScale has one to ask about.
 */
export function visibleQuestions(screen: ScreenDef, answers: Answers): readonly AnyQuestion[] {
	return screen.questionIds
		.map(questionById)
		.filter((question) => !question.visibleIf || question.visibleIf(answers));
}

export type WalkStep =
	| { kind: 'screen'; id: string; screen: ScreenDef; screenNumber: number }
	| { kind: 'interlude'; id: InterludeVariant; variant: InterludeVariant };

export interface Walk {
	readonly steps: readonly WalkStep[];
	/** Screens only. An interlude asks nothing, so it never raises the count. */
	readonly screenTotal: number;
}

/**
 * The whole walk for one set of answers: the screens they call for, with the interludes
 * between them.
 *
 * The count is of screens alone. That is the one progress rule, stated here rather than in a
 * component, so nothing can arrive at a different number by counting something else.
 */
export function buildWalk(answers: Answers): Walk {
	const steps: WalkStep[] = [];
	let screenNumber = 0;

	for (const screen of visibleScreens(answers)) {
		screenNumber += 1;
		steps.push({ kind: 'screen', id: screen.id, screen, screenNumber });

		if (screen.followedBy) {
			steps.push({ kind: 'interlude', id: screen.followedBy, variant: screen.followedBy });
		}
	}

	return { steps, screenTotal: screenNumber };
}
