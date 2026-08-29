<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import QuestionnaireShell from '$lib/features/questionnaire/QuestionnaireShell.svelte';
	import { questionnaireService } from '$lib/features/questionnaire/questionnaire-service';
	import {
		QUESTIONNAIRE_HOME_HREF,
		questionnaireStepHref
	} from '$lib/features/questionnaire/routes';

	// The server cannot read sessionStorage, so it must not guess a destination. This entry
	// renders an honest resuming state and hands off once the browser knows where to go.
	// The handoff replaces history: leaving it behind would make Back loop through here.
	onMount(() => {
		const stepId = questionnaireService.getResumeStepId();
		goto(stepId ? questionnaireStepHref(stepId) : QUESTIONNAIRE_HOME_HREF, { replaceState: true });
	});
</script>

<svelte:head>
	<title>Questionnaire | Solean</title>
	<meta name="description" content="Start or resume the Solean eligibility questionnaire." />
</svelte:head>

<QuestionnaireShell backHref={QUESTIONNAIRE_HOME_HREF} showPrototypeNotice={false}>
	<h1 class="font-display text-4xl font-medium sm:text-5xl">Resuming your questionnaire</h1>
	<p role="status" class="mt-3 text-base text-muted-foreground md:text-lg">
		Taking you to your next question.
	</p>
	<p class="mt-6 text-sm text-text-faint">
		If nothing happens, <a
			href={questionnaireStepHref('about-you')}
			class="underline underline-offset-4 outline-none hover:text-highlight-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
			>open the first question</a
		>.
	</p>
</QuestionnaireShell>
