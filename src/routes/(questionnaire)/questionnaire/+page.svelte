<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Spinner } from '$lib/components/ui/spinner';
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
	<title>{m.title_questionnaire()} | Solean</title>
	<meta name="description" content={m.meta_questionnaire()} />
</svelte:head>

<QuestionnaireShell backHref={QUESTIONNAIRE_HOME_HREF}>
	<!--
		A handoff, not a destination: the plan is resolved above and the browser leaves at once,
		so this shows work in progress rather than a headline nobody has time to read. The live
		region carries the sentence, because the spinner is hidden from the accessibility tree
		and its own "Loading" would not say what is being loaded.
	-->
	<div role="status" class="flex justify-center py-16">
		<Spinner aria-hidden="true" class="size-8 text-primary" />
		<span class="sr-only">{m.q_opening_first()}</span>
	</div>
</QuestionnaireShell>
