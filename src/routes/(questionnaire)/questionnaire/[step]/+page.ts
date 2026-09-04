import { error } from '@sveltejs/kit';
import { COMPLETION_STEP_ID } from '$lib/features/questionnaire/routes';
import { SCREENS, INTERLUDE_VARIANTS } from '$lib/features/questionnaire/definition/screens';
import type { PageLoad } from './$types';

/**
 * Whether this address names a step of the questionnaire at all.
 *
 * That is all the server can decide. Which steps a visitor may currently open depends on
 * their answers, and the answers live only in the browser, so position is the component's.
 */
export const load: PageLoad = async ({ params }) => {
	const known =
		SCREENS.some((screen) => screen.id === params.step) ||
		INTERLUDE_VARIANTS.includes(params.step as (typeof INTERLUDE_VARIANTS)[number]) ||
		params.step === COMPLETION_STEP_ID;

	if (!known) error(404, 'That questionnaire step does not exist.');

	return { stepId: params.step };
};
