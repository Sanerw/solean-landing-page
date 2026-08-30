import { error } from '@sveltejs/kit';
import { COMPLETION_STEP_ID, INTERLUDES, stepIdForPage } from '$lib/features/questionnaire/steps';
import type { PageLoad } from './$types';

/**
 * The server knows the model but not the answers, so all it can decide is whether the
 * document has a page with this id. Which steps are currently reachable depends on
 * `survey.data`, which exists only in the browser, so the component owns position.
 */
export const load: PageLoad = async ({ params, parent }) => {
	const { questionnaire } = await parent();

	// The layout renders the failure state instead of this page, so there is nothing to check.
	if (!questionnaire.ok) return { stepId: params.step };

	const isKnownPage = questionnaire.document.model.pages.some((page) => {
		if (typeof page !== 'object' || page === null) return false;
		const name = (page as { name?: unknown }).name;

		return typeof name === 'string' && stepIdForPage(name) === params.step;
	});

	const isInterlude = INTERLUDES.some((placement) => placement.variant === params.step);

	if (!isKnownPage && !isInterlude && params.step !== COMPLETION_STEP_ID) {
		error(404, 'That questionnaire step does not exist.');
	}

	return { stepId: params.step };
};
