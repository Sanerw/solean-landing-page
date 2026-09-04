<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Spinner } from '$lib/components/ui/spinner';
	import QuestionnaireShell from '$lib/features/questionnaire/QuestionnaireShell.svelte';
	import { answerStore } from '$lib/features/questionnaire/answers/store.svelte';
	import { buildWalk } from '$lib/features/questionnaire/definition/screens';
	import { entryStepId } from '$lib/features/questionnaire/definition/position';
	import {
		QUESTIONNAIRE_HOME_HREF,
		questionnaireStepHref
	} from '$lib/features/questionnaire/routes';

	// The first step depends on the answers, which only the browser has, so the server renders
	// an honest waiting state and the browser does the handoff. It replaces history: leaving
	// this entry behind would make Back loop through it.
	onMount(() => {
		const walk = buildWalk(answerStore.answers);
		const target = entryStepId(walk, answerStore.anamnesisUid !== null);

		void goto(questionnaireStepHref(target), { replaceState: true });
	});
</script>

<svelte:head>
	<title>{m.title_questionnaire()} | Solean</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta name="description" content={m.meta_questionnaire()} />
</svelte:head>

<QuestionnaireShell backHref={QUESTIONNAIRE_HOME_HREF}>
	<div role="status" class="flex justify-center py-16">
		<Spinner aria-hidden="true" class="size-8 text-primary" />
		<span class="sr-only">{m.q_opening_resume()}</span>
	</div>
</QuestionnaireShell>
