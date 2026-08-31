import type { Model } from 'survey-core';

/**
 * The order the user walks: the model's visible survey pages with Solean's own screens
 * interleaved. This is the single source of truth for position; the survey engine's own
 * page pointer is set from it, never the other way round.
 */
export type QuestionnaireStep =
	| { kind: 'survey'; id: string; pageName: string; questionNumber: number }
	| { kind: 'interlude'; id: string; variant: InterludeVariant };

export type InterludeVariant = 'motivation' | 'projection';

/** Placement is by the page an interlude follows, so positions are stated in one place. */
export interface InterludePlacement {
	afterPageName: string;
	variant: InterludeVariant;
}

/** What the progress indicator shows. Produced from the plan, never counted twice. */
export interface QuestionnaireProgress {
	current: number;
	total: number;
	/**
	 * How full the bar is. Not `current / total`: the plan choice comes after the last
	 * question, so a full bar on the last question would promise an end that is one screen
	 * early. The count stays a count of questions, because that is what it is called.
	 */
	percent: number;
}

/**
 * Where Solean's own screens sit between the model's questions. Stated once, by the page
 * each one follows, so no component decides its own position.
 *
 * A placement whose page the model no longer contains simply does not appear. That is
 * reported in development rather than passing silently, because the questionnaire is
 * versioned and a renamed page would quietly drop the screen.
 */
export const INTERLUDES: readonly InterludePlacement[] = [
	// The projection can only be true once the weight is in, and `page2` is where the model
	// asks for it.
	{ afterPageName: 'page2', variant: 'projection' },
	// Roughly the middle of the walk, matching where the artboard's progress bar puts it, on
	// an unconditional page so the screen cannot vanish for a branch.
	{ afterPageName: 'page16', variant: 'motivation' }
];

export interface StepPlan {
	steps: QuestionnaireStep[];
	/** Survey steps only. Interludes never inflate the question count. */
	questionTotal: number;
	/** Placements whose page the current model does not show, so the screen never appears. */
	unplaced: InterludePlacement[];
}

/**
 * The end of the questionnaire. Not a model page: the model ends after its last question,
 * and feature 12 replaces this screen with the submission and the recommendation.
 */
export const COMPLETION_STEP_ID = 'complete';

/** The model's page name, which is unique and stable, rather than a slug we invented. */
export function stepIdForPage(pageName: string): string {
	return pageName.toLowerCase();
}

/**
 * Visible pages, not all pages: `visibleIf` decides what the user actually walks, so the
 * plan changes as answers change. Pass the same survey instance the screens use.
 */
export function buildStepPlan(
	survey: Model,
	interludes: readonly InterludePlacement[] = INTERLUDES
): StepPlan {
	const steps: QuestionnaireStep[] = [];
	let questionNumber = 0;

	for (const page of survey.visiblePages) {
		questionNumber += 1;
		steps.push({
			kind: 'survey',
			id: stepIdForPage(page.name),
			pageName: page.name,
			questionNumber
		});

		for (const placement of interludes) {
			if (placement.afterPageName === page.name) {
				steps.push({ kind: 'interlude', id: placement.variant, variant: placement.variant });
			}
		}
	}

	const placed = new Set(
		steps.filter((step) => step.kind === 'interlude').map((step) => step.variant)
	);

	return {
		steps,
		questionTotal: questionNumber,
		unplaced: interludes.filter((placement) => !placed.has(placement.variant))
	};
}

/**
 * How far the answers reach: the index of the last step they justify opening.
 *
 * A survey step is behind the user once its page validates, which is survey-core's own
 * answer with the error display suppressed. `validate(false, false)` attaches nothing, so
 * scanning the plan cannot light up errors on a screen nobody has submitted.
 *
 * When every survey step passes, the limit is the completion step at the end.
 */
export function reachableLimit(plan: StepPlan, survey: Model): number {
	for (const [index, step] of plan.steps.entries()) {
		if (step.kind !== 'survey') continue;

		const page = survey.pages.find((candidate) => candidate.name === step.pageName);
		if (page && !page.validate(false, false)) return index;
	}

	return plan.steps.length;
}

export type StepEntry = { show: true } | { show: false; redirectTo: string };

/**
 * What the route should do with the step it was asked for. A step beyond the answers, or one
 * the answers have hidden entirely, sends the visitor to the step they have actually reached
 * rather than to a question that cannot be answered in order.
 *
 * Emptying an earlier answer moves the limit back and takes the visitor with it. That is the
 * rule working: the submission is validated against the whole model, so a gap left behind
 * would come back as a 400.
 */
export function resolveStepEntry(
	plan: StepPlan,
	survey: Model,
	stepId: string,
	/** True once the anamnesis exists at RxScale. */
	submitted: boolean,
	/**
	 * True once the visitor has moved off a step themselves. False on every fresh load, since
	 * the session lives in memory and nothing is stored.
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

	// Nothing to walk and nothing to submit: the only screen left is the end of it.
	if (plan.steps.length === 0) return { show: true };

	// A fresh load starts the walk at its first step, whatever the address asked for. The
	// reachable limit alone would step past an optional first question, because an unanswered
	// optional page validates, and arriving on the second question reads as the questionnaire
	// having skipped one.
	//
	// Keyed on having started rather than on the answers being empty: skipping that optional
	// question is a thing a visitor may do, and reading empty answers as "not started" would
	// bounce them back to it the moment they pressed Continue.
	if (!started) {
		const first = plan.steps[0];

		return stepId === first.id ? { show: true } : { show: false, redirectTo: first.id };
	}

	const limit = reachableLimit(plan, survey);
	// Past the last step means every answer is in, and the last step is where sending happens,
	// so that is where an unsubmitted session belongs. Falling through to the completion step
	// here would send it to a screen that immediately sends it back.
	const furthest = plan.steps[limit] ?? plan.steps.at(-1);
	const redirectTo = furthest ? furthest.id : COMPLETION_STEP_ID;

	// Reaching the end is not the same as having sent it, and only sending it earns this
	// screen. Without that, a refresh or a deep link would congratulate someone whose
	// answers no doctor has.
	if (stepId === COMPLETION_STEP_ID) {
		return { show: false, redirectTo };
	}

	const index = plan.steps.findIndex((step) => step.id === stepId);

	return index >= 0 && index <= limit ? { show: true } : { show: false, redirectTo };
}

/**
 * The one progress rule. A survey step reads its own number, an interlude holds the number of
 * the step before it so the bar never moves on a screen that asks nothing, and the completion
 * screen reads the total.
 *
 * The denominator is the plan as it stands, so a branch the visitor opens raises it. That is
 * the truth: those questions are now theirs to answer, and pretending otherwise would mean
 * showing a total nobody is walking towards.
 */
/**
 * Screens the visitor still walks after the last question: choosing the plan. The order
 * screen is not one of them, because the choice is the last thing the bar can promise.
 */
const SCREENS_AFTER_THE_QUESTIONS = 1;

export function progressFor(plan: StepPlan, stepId: string): QuestionnaireProgress | null {
	if (plan.questionTotal === 0) return null;

	const barTotal = plan.questionTotal + SCREENS_AFTER_THE_QUESTIONS;

	if (stepId === COMPLETION_STEP_ID) {
		return { current: plan.questionTotal, total: plan.questionTotal, percent: 100 };
	}

	const index = plan.steps.findIndex((step) => step.id === stepId);
	if (index < 0) return null;

	for (let cursor = index; cursor >= 0; cursor -= 1) {
		const step = plan.steps[cursor];
		if (step.kind === 'survey') {
			return {
				current: step.questionNumber,
				total: plan.questionTotal,
				percent: (step.questionNumber / barTotal) * 100
			};
		}
	}

	return null;
}
