import { error } from '@sveltejs/kit';
import {
	QUESTIONNAIRE_SCHEMA,
	getQuestionnaireProgress,
	getQuestionnaireStep,
	getPreviousQuestionnaireStep
} from '$lib/features/questionnaire/schema';
import type { PageLoad } from './$types';

// Schema lookup only. Answer state is browser-owned, so nothing here reads the journey and
// the route stays server-renderable, which is what lets an unknown id be a real HTTP 404.
export const load: PageLoad = ({ params }) => {
	const step = getQuestionnaireStep(QUESTIONNAIRE_SCHEMA, params.step);

	if (step === null) {
		error(404, 'That questionnaire step does not exist.');
	}

	return {
		step,
		progress: getQuestionnaireProgress(QUESTIONNAIRE_SCHEMA, step.id),
		previousStep: getPreviousQuestionnaireStep(QUESTIONNAIRE_SCHEMA, step.id)
	};
};
