import { questionnaireUid } from '$lib/config/rxscale';
import { fetchQuestionnaire } from '$lib/features/questionnaire/anamnesis-client';
import type { LayoutLoad } from './$types';

/**
 * One fetch per entry to the flow: a layout load is not re-run when only the step param
 * changes, so moving between questions reuses this document. `depends` gives the failure
 * screen a retry that re-runs just this load instead of reloading the page.
 *
 * The result is returned rather than thrown, because an error thrown by a layout load is
 * handled by the boundary above it, which would take the whole app's error page instead of
 * the questionnaire's own screen.
 */
export const load: LayoutLoad = async ({ fetch, depends }) => {
	depends('rxscale:questionnaire');

	return { questionnaire: await fetchQuestionnaire(fetch, questionnaireUid()) };
};
