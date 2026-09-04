import { localizeHref } from '$lib/paraglide/runtime';

/**
 * The questionnaire's own destinations, so no component builds a step URL by hand.
 *
 * **Functions, not constants, and every one of them localised.** The locale lives in the
 * path: German is the base and has no prefix, English is under `/en`. A bare
 * `/questionnaire/your-details` therefore does not mean "this questionnaire in whatever
 * language the reader chose", it means the German one, and navigating to it switches the
 * language mid-funnel. Constants could not fix this on their own either, because they are
 * evaluated once at import time, before the request whose locale they would have to carry.
 */

/** The end of the questionnaire: the plan choice and the order, on one screen. Not a screen of
 *  the definition, because it asks nothing; it is where the answers have already gone. */
export const COMPLETION_STEP_ID = 'complete';

/** Leaving the funnel: the marketing home page, in the reader's language. */
export function questionnaireHomeHref(): string {
	return localizeHref('/');
}

/** The entry that resolves which step the answers justify opening. */
export function questionnaireEntryHref(): string {
	return localizeHref('/questionnaire');
}

export function questionnaireStepHref(stepId: string): string {
	return localizeHref(`/questionnaire/${stepId}`);
}
