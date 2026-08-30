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
	{ afterPageName: 'page2', variant: 'motivation' }
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
