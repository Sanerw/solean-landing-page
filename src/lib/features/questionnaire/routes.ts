/** The questionnaire's own destinations, so no component builds a step URL by hand. */
export const QUESTIONNAIRE_HOME_HREF = '/';
export const QUESTIONNAIRE_ENTRY_HREF = '/questionnaire';

export function questionnaireStepHref(stepId: string): string {
	return `${QUESTIONNAIRE_ENTRY_HREF}/${stepId}`;
}
