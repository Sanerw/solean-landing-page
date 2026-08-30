<script lang="ts">
	import { goto } from '$app/navigation';
	import type { StepAnswers } from '$lib/features/questionnaire/types';
	import QuestionnaireShell from '$lib/features/questionnaire/QuestionnaireShell.svelte';
	import CompletionInterstitial from '$lib/features/questionnaire/CompletionInterstitial.svelte';
	import MotivationInterstitial from '$lib/features/questionnaire/MotivationInterstitial.svelte';
	import ProjectionInterstitial from '$lib/features/questionnaire/ProjectionInterstitial.svelte';
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

	/** An interstitial produces no answer, so it only moves. */
	function advance(): void {
		const next = questionnaireService.getNextStep(step.id);
		if (next) goto(questionnaireStepHref(next.id));
	}

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
		{:else if step.variant === 'projection'}
			<ProjectionInterstitial oncontinue={advance} />
		{:else if step.variant === 'completion'}
			<CompletionInterstitial />
		{:else}
			<MotivationInterstitial oncontinue={advance} />
		{/if}
	{/key}

	<p role="status" aria-live="polite" class="mt-6 text-sm text-muted-foreground">
		{savedMessage}
	</p>
</QuestionnaireShell>
