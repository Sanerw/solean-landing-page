import { m } from '$lib/paraglide/messages';
import type { Answers, QuestionId } from '../answers/types';
import { asksPregnancy, asksWeightRelatedConditions, hadGallstones, takesTrackedMedication } from './conditions';
import { optionsFor, type AnyQuestion, type MessageFn } from './kinds';
import { questionById } from './questions';

/**
 * The twelve screens, in the order the visitor walks them, with Solean's own interludes
 * placed between them.
 *
 * The order is the export's for the eight screens it draws: About You, Your Details,
 * Medication History, Pregnancy, Medical Conditions, Health History, Eating Disorders,
 * Allergies. The four it never draws are placed beside the question they follow from:
 * side effects after the medication they are about, gallbladder and weight-related
 * conditions after the diagnoses that open them, disclaimers last.
 *
 * A screen is one page of the questionnaire. Most carry one question; a few carry two or
 * three because the export draws them together, and one carries four.
 */

export type InterludeVariant = 'projection' | 'motivation';

/** The interlude ids, which are also URL segments, so the route can validate one. */
export const INTERLUDE_VARIANTS = ['projection', 'motivation'] as const;

/**
 * Questions drawn as one labelled panel under the question they qualify, rather than as
 * three more questions on the screen.
 *
 * The medication details are the only instance: the artboards draw the dose, the duration
 * and the last dose as a group belonging to the medication just chosen, titled for it.
 */
export interface DetailGroup {
	/** Rendered directly below this question's control, never inside it. See the comment in
	 *  `medication-history` for why that distinction is load-bearing. */
	readonly anchor: QuestionId;
	readonly questionIds: readonly QuestionId[];
	/** Names the panel for the current answers: "MOUNJARO: DEINE ANGABEN". */
	readonly label: (answers: Answers) => string;
	readonly footnote?: MessageFn;
}

export interface ScreenDef {
	/** The URL segment, kebab-case, and the id progress and routing count by. */
	readonly id: string;
	readonly questionIds: readonly QuestionId[];
	/**
	 * The screen's own heading. Absent means the first visible question donates it, which is
	 * what the single-question artboards draw: Medical Conditions' `h1` is its question.
	 */
	readonly title?: MessageFn;
	readonly subtitle?: MessageFn;
	/** The bell card the artboards put under the fields, about the screen rather than a field. */
	readonly notice?: MessageFn;
	readonly detail?: DetailGroup;
	/** Answers this screen is shown for. Absent means always. */
	readonly visibleIf?: (answers: Answers) => boolean;
	/** A Solean screen shown after this one. */
	readonly followedBy?: InterludeVariant;
	/**
	 * A Solean screen shown before this one.
	 *
	 * The export puts the projection after its fourth question, Pregnancy, which a male
	 * visitor never sees. Anchoring it to the screen that follows instead of the one that
	 * precedes puts it in the export's place for every branch, rather than only for the
	 * visitors who happen to be asked about pregnancy.
	 */
	readonly precededBy?: InterludeVariant;
}

export const SCREENS: readonly ScreenDef[] = [
	{
		id: 'about-you',
		questionIds: ['gender', 'dateOfBirth', 'heightCm', 'weightKg'],
		title: m.qs_about_you_title,
		subtitle: m.qs_about_you_subtitle
	},
	{
		id: 'your-details',
		questionIds: ['firstName', 'lastName', 'email', 'phone'],
		title: m.qs_your_details_title,
		subtitle: m.qs_your_details_subtitle,
		notice: m.qs_your_details_notice
	},
	{
		id: 'medication-history',
		questionIds: [
			'pastMedication',
			'pastMedicationDose',
			'pastMedicationDuration',
			'pastMedicationLastDose'
		],
		detail: {
			anchor: 'pastMedication',
			questionIds: ['pastMedicationDose', 'pastMedicationDuration', 'pastMedicationLastDose'],
			label: (answers) => m.qs_medication_details({ medication: pastMedicationName(answers) }),
			footnote: m.qs_medication_details_footnote
		}
	},
	{
		id: 'side-effects',
		questionIds: ['hasSideEffects', 'sideEffectsDescription'],
		// No artboard draws this screen, so it borrows the one Health History does draw: a title
		// naming the subject, with the clinical questions below it as sub-questions. Left without
		// one, RxScale's own sentence became a three-line `h1` where every drawn screen has a
		// short human title.
		title: m.qs_side_effects_title,
		visibleIf: takesTrackedMedication
	},
	{
		id: 'pregnancy',
		questionIds: ['pregnancyStatus'],
		subtitle: m.qs_select_all,
		visibleIf: asksPregnancy
	},
	{
		id: 'medical-conditions',
		questionIds: ['diseases'],
		subtitle: m.qs_select_all,
		// The export's place for the projection: after its fourth question and before this one.
		// It draws the weight given on the first screen, so the wait is the export's pacing
		// rather than anything the chart needs.
		precededBy: 'projection'
	},
	{
		id: 'gallbladder',
		questionIds: ['gallbladderRemoved'],
		subtitle: m.qs_gallbladder_subtitle,
		visibleIf: hadGallstones
	},
	{
		id: 'weight-related-conditions',
		questionIds: ['weightRelatedConditions'],
		subtitle: m.qs_select_all,
		visibleIf: asksWeightRelatedConditions
	},
	{
		id: 'health-history',
		questionIds: ['familyDiseases', 'mentalHealth'],
		title: m.qs_health_history_title
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
		questionIds: ['allergies', 'otherMedication', 'otherMedicationDescription'],
		subtitle: m.qs_select_all
	},
	{
		id: 'disclaimers',
		questionIds: ['disclaimer', 'contraceptionDisclaimer'],
		title: m.qs_disclaimers_title,
		subtitle: m.qs_disclaimers_subtitle
	}
];

/** The chosen medication as it reads on screen, for the details panel's own label. */
function pastMedicationName(answers: Answers): string {
	const question = questionById('pastMedication');
	const chosen = optionsFor(question, answers).find(
		(option) => option.value === answers.pastMedication
	);

	return chosen ? chosen.label() : '';
}

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

export interface ScreenHeading {
	readonly title: string;
	readonly subtitle: string | null;
	/**
	 * The question whose own label became the heading, if any. `ScreenView` needs it to avoid
	 * printing the same sentence twice: once as the `h1` and again as the field's label.
	 */
	readonly donor: AnyQuestion | null;
}

/**
 * The screen's heading, and which question gave it up.
 *
 * A screen carrying several questions states its own title. A screen carrying one lets that
 * question be the heading, which is what the single-question artboards draw: Medical
 * Conditions' `h1` is its question.
 *
 * **The first *visible* question, not `questionIds[0]`.** On a screen whose first question a
 * branch can hide, taking index zero would promote a question that is not on the screen.
 */
export function screenHeading(screen: ScreenDef, answers: Answers): ScreenHeading | null {
	if (screen.title) {
		return { title: screen.title(), subtitle: screen.subtitle?.() ?? null, donor: null };
	}

	const [donor] = visibleQuestions(screen, answers);
	if (!donor) return null;

	// A promoted question's own description becomes the subtitle rather than repeating below
	// the heading, which is how the artboards set "Select all that apply".
	return {
		title: donor.label(),
		subtitle: screen.subtitle?.() ?? donor.description?.() ?? null,
		donor
	};
}

/**
 * What to print above a question's control: its short name where the artboards give one, its
 * full question otherwise, and nothing at all when it is already the screen's heading.
 *
 * The optional marker is appended here rather than written into the copy, which is what the
 * artboard's "PHONE NUMBER · OPTIONAL" used to be. One rule decides how optional is shown, and
 * the question keeps a name that can be spoken about: an error reading "Phone number ·
 * optional does not look right" was the alternative.
 */
export function fieldLabelFor(question: AnyQuestion, heading: ScreenHeading | null): string {
	if (heading && question === heading.donor) return '';

	const label = (question.shortLabel ?? question.label)();

	return question.optional ? `${label} · ${m.q_optional()}` : label;
}

/**
 * The field's name as a sentence can use it, or null when it has none.
 *
 * Only a short label qualifies. A question that carries its full wording is a sentence, not a
 * noun, so "Do you have any of the following conditions? is required" is what naming it would
 * produce; those questions get the message that names nothing instead. They are also the ones
 * that stand alone on their screen, where there is nothing to tell apart.
 */
export function fieldNameFor(question: AnyQuestion): string | null {
	return question.shortLabel?.() ?? null;
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
		if (screen.precededBy) {
			steps.push({ kind: 'interlude', id: screen.precededBy, variant: screen.precededBy });
		}

		screenNumber += 1;
		steps.push({ kind: 'screen', id: screen.id, screen, screenNumber });

		if (screen.followedBy) {
			steps.push({ kind: 'interlude', id: screen.followedBy, variant: screen.followedBy });
		}
	}

	return { steps, screenTotal: screenNumber };
}
