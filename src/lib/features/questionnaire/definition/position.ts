import type { Answers } from '../answers/types';
import { validateScreen } from '../answers/validate';
import { COMPLETION_STEP_ID } from '../routes';
import type { Walk, WalkStep } from './screens';

/**
 * Where in the walk a visitor may be, and what the progress bar says.
 *
 * This is the rule feature 11 wrote against the model's step plan, kept intact and repointed
 * at ours: position comes from the walk alone, and the walk comes from the answers, so an
 * address the answers do not justify sends the visitor to the one they have actually reached.
 */

export interface QuestionnaireProgress {
	current: number;
	total: number;
	/**
	 * How full the bar is. Not `current / total`: the plan choice comes after the last
	 * question, so a full bar on the last screen would promise an end that is one screen
	 * early. The count stays a count of screens, because that is what it is called.
	 */
	percent: number;
}

/** Screens the visitor still walks after the last question: choosing the plan. */
const SCREENS_AFTER_THE_QUESTIONS = 1;

export function progressFor(walk: Walk, stepId: string): QuestionnaireProgress | null {
	if (walk.screenTotal === 0) return null;

	if (stepId === COMPLETION_STEP_ID) {
		return { current: walk.screenTotal, total: walk.screenTotal, percent: 100 };
	}

	const index = walk.steps.findIndex((step) => step.id === stepId);
	if (index < 0) return null;

	// An interlude holds the number of the screen before it, so the bar never moves on a
	// screen that asks nothing.
	for (let cursor = index; cursor >= 0; cursor -= 1) {
		const step = walk.steps[cursor];
		if (step.kind === 'screen') {
			return {
				current: step.screenNumber,
				total: walk.screenTotal,
				percent: (step.screenNumber / (walk.screenTotal + SCREENS_AFTER_THE_QUESTIONS)) * 100
			};
		}
	}

	return null;
}

/**
 * How far the answers reach: the index of the last step they justify opening.
 *
 * A screen is behind the visitor once it validates. Emptying an earlier answer moves the
 * limit back and takes the visitor with it, which is the rule working: the submission is
 * checked against the whole definition, so a gap left behind would come back as a refusal.
 */
export function reachableLimit(walk: Walk, answers: Answers): number {
	for (const [index, step] of walk.steps.entries()) {
		if (step.kind !== 'screen') continue;

		if (Object.keys(validateScreen(step.screen.id, answers)).length > 0) return index;
	}

	return walk.steps.length;
}

export type StepEntry = { show: true } | { show: false; redirectTo: string };

/**
 * What the route should do with the step it was asked for.
 *
 * A step beyond the answers, or one the answers have hidden entirely, sends the visitor to
 * the step they have actually reached rather than to a question that cannot be answered in
 * order.
 */
export function resolveStepEntry(
	walk: Walk,
	answers: Answers,
	stepId: string,
	/** True once the anamnesis exists at RxScale. */
	submitted: boolean,
	/**
	 * True once the visitor has moved off a step themselves. False on every fresh load, since
	 * nothing is stored.
	 */
	started: boolean
): StepEntry {
	// The questionnaire is over: the record is with a doctor, and changing an answer here
	// would put a different questionnaire on screen than the one that was sent.
	if (submitted) {
		return stepId === COMPLETION_STEP_ID
			? { show: true }
			: { show: false, redirectTo: COMPLETION_STEP_ID };
	}

	if (walk.steps.length === 0) return { show: true };

	// A fresh load starts the walk at its first step, whatever the address asked for. Keyed on
	// having started rather than on the answers being empty, so a visitor who legitimately
	// skipped an optional question is not bounced back to it.
	if (!started) {
		const first = walk.steps[0];

		return stepId === first.id ? { show: true } : { show: false, redirectTo: first.id };
	}

	const limit = reachableLimit(walk, answers);
	// Past the last step means every answer is in, and the last step is where sending happens,
	// so that is where an unsubmitted session belongs.
	const furthest: WalkStep | undefined = walk.steps[limit] ?? walk.steps.at(-1);
	const redirectTo = furthest ? furthest.id : COMPLETION_STEP_ID;

	// Reaching the end is not the same as having sent it, and only sending it earns this
	// screen. Without that, a refresh or a deep link would congratulate someone whose answers
	// no doctor has.
	if (stepId === COMPLETION_STEP_ID) return { show: false, redirectTo };

	const index = walk.steps.findIndex((step) => step.id === stepId);

	return index >= 0 && index <= limit ? { show: true } : { show: false, redirectTo };
}

/** The step a visitor entering the flow should land on. */
export function entryStepId(walk: Walk, submitted: boolean): string {
	if (submitted) return COMPLETION_STEP_ID;

	return walk.steps[0]?.id ?? COMPLETION_STEP_ID;
}
