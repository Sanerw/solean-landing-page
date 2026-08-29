<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import QuestionnaireShell from '$lib/features/questionnaire/QuestionnaireShell.svelte';
	import {
		QUESTIONNAIRE_ENTRY_HREF,
		QUESTIONNAIRE_HOME_HREF
	} from '$lib/features/questionnaire/routes';
</script>

<svelte:head>
	<title>Question not found | Solean questionnaire</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<QuestionnaireShell backHref={QUESTIONNAIRE_HOME_HREF} showPrototypeNotice={false}>
	<p class="font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground">
		Error {page.status}
	</p>
	<h1 class="mt-3 font-display text-4xl font-medium sm:text-5xl">We could not find that question.</h1>
	<p class="mt-3 text-base text-muted-foreground md:text-lg">
		The address may be incorrect, or that part of the questionnaire may not exist yet. Your saved
		answers are untouched.
	</p>
	<div class="mt-8 flex flex-wrap gap-3">
		<Button href={QUESTIONNAIRE_ENTRY_HREF}>Back to the questionnaire</Button>
		<Button href={QUESTIONNAIRE_HOME_HREF} variant="outline">Return home</Button>
	</div>
</QuestionnaireShell>
