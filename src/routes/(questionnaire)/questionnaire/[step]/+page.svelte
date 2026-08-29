<script lang="ts">
	import { goto } from '$app/navigation';
	import type { StepAnswers } from '$lib/features/questionnaire/types';
	import QuestionnaireShell from '$lib/features/questionnaire/QuestionnaireShell.svelte';
	import QuestionScreen from '$lib/features/questionnaire/QuestionScreen.svelte';
	import { questionnaireService } from '$lib/features/questionnaire/questionnaire-service';
	import {
		QUESTIONNAIRE_HOME_HREF,
		questionnaireStepHref
	} from '$lib/features/questionnaire/routes';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const step = $derived(data.step);
	const backHref = $derived(
		data.previousStep ? questionnaireStepHref(data.previousStep.id) : QUESTIONNAIRE_HOME_HREF
	);

	let savedMessage = $state('');

	// Reachability is a browser fact, so the guard cannot live in the load. Feature 8 inherits
	// it unchanged once later steps make a direct deep link skippable.
	$effect(() => {
		const access = questionnaireService.getStepAccess(step.id);
		if (!access.allowed && access.redirectStepId !== null) {
			goto(questionnaireStepHref(access.redirectStepId), { replaceState: true });
		}
	});

	function handleValid(answers: StepAnswers): void {
		questionnaireService.saveAnswer(step.id, answers);

		const next = questionnaireService.getNextStep(step.id);
		if (next) {
			savedMessage = '';
			goto(questionnaireStepHref(next.id));
			return;
		}

		// No next step exists yet, which is a gap in the prototype, not a finished questionnaire.
		// Nothing here sets the completed flag or unlocks checkout.
		savedMessage = 'Answer saved. The remaining questions arrive in a later prototype feature.';
	}
</script>

<svelte:head>
	<title>{step.title} | Solean questionnaire</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<QuestionnaireShell progress={data.progress} {backHref}>
	{#key step.id}
		{#if step.kind === 'question'}
			<QuestionScreen {step} progress={data.progress} onvalid={handleValid} />
		{:else}
			<h1 class="font-display text-4xl font-medium sm:text-5xl">{step.title}</h1>
			<p class="mt-3 text-base text-muted-foreground md:text-lg">
				Interstitial screens arrive in a later prototype feature.
			</p>
		{/if}
	{/key}

	<p role="status" aria-live="polite" class="mt-6 text-sm text-muted-foreground">
		{savedMessage}
	</p>
</QuestionnaireShell>
