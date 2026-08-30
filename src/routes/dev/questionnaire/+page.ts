import { questionnaireUid } from '$lib/config/rxscale';
import { fetchQuestionnaire } from '$lib/features/questionnaire/anamnesis-client';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => ({
	uid: questionnaireUid(),
	questionnaire: await fetchQuestionnaire(fetch, questionnaireUid())
});
