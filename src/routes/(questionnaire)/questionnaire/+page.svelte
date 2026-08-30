<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import QuestionnaireShell from '$lib/features/questionnaire/QuestionnaireShell.svelte';
	import { questionnaireSession } from '$lib/features/questionnaire/survey-state.svelte';
	import { COMPLETION_STEP_ID, buildStepPlan } from '$lib/features/questionnaire/steps';
	import {
		QUESTIONNAIRE_HOME_HREF,
		questionnaireStepHref
	} from '$lib/features/questionnaire/routes';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// The first step comes from the model, which only the browser has resolved into a plan,
	// so the server renders an honest waiting state and the browser does the handoff. It
	// replaces history: leaving this entry behind would make Back loop through it.
	onMount(() => {
		if (!data.questionnaire.ok) return;

		const plan = buildStepPlan(questionnaireSession.surveyFor(data.questionnaire.document));
		const first = plan.steps.at(0);

		// A session that already submitted has no questions left to answer.
		const target =
			questionnaireSession.anamnesisUid !== null
				? COMPLETION_STEP_ID
				: (first?.id ?? COMPLETION_STEP_ID);

		goto(questionnaireStepHref(target), { replaceState: true });
	});
</script>

<svelte:head>
	<title>Questionnaire | Solean</title>
	<meta name="description" content="Start the Solean medical questionnaire." />
</svelte:head>

<QuestionnaireShell backHref={QUESTIONNAIRE_HOME_HREF} showPrototypeNotice={false}>
	<h1 class="font-display text-4xl font-medium sm:text-5xl">Opening your questionnaire</h1>
	<p role="status" class="mt-3 text-base text-muted-foreground md:text-lg">
		Taking you to the first question.
	</p>
</QuestionnaireShell>
