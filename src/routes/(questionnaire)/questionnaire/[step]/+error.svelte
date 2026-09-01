<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import QuestionnaireShell from '$lib/features/questionnaire/QuestionnaireShell.svelte';
	import {
		QUESTIONNAIRE_ENTRY_HREF,
		QUESTIONNAIRE_HOME_HREF
	} from '$lib/features/questionnaire/routes';
</script>

<svelte:head>
	<title>{m.title_question_not_found()} | Solean</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<QuestionnaireShell backHref={QUESTIONNAIRE_HOME_HREF}>
	<p class="font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground">
		Error {page.status}
	</p>
	<h1 class="mt-3 font-display text-4xl font-medium sm:text-5xl">{m.q_not_found_title()}</h1>
	<p class="mt-3 text-base text-muted-foreground md:text-lg">
		The address may be incorrect, or that part of the questionnaire may not exist yet. Your saved
		answers are untouched.
	</p>
	<div class="mt-8 flex flex-wrap gap-3">
		<Button href={QUESTIONNAIRE_ENTRY_HREF}>{m.q_back_to_questionnaire()}</Button>
		<Button href={QUESTIONNAIRE_HOME_HREF} variant="outline">{m.q_return_home()}</Button>
	</div>
</QuestionnaireShell>
