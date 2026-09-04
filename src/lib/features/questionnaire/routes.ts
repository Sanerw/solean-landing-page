/** The questionnaire's own destinations, so no component builds a step URL by hand. */
export const QUESTIONNAIRE_HOME_HREF = '/';
export const QUESTIONNAIRE_ENTRY_HREF = '/questionnaire';

/**
 * The end of the questionnaire: the plan choice and the order, on one screen. Not a screen of
 * the definition, because it asks nothing; it is where the answers have already gone.
 */
export const COMPLETION_STEP_ID = 'complete';

export function questionnaireStepHref(stepId: string): string {
	return `${QUESTIONNAIRE_ENTRY_HREF}/${stepId}`;
}
