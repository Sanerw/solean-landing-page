<script lang="ts">
	import { onMount } from 'svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { COMPLETION_INTERSTITIAL as COPY } from './interstitial-content';
	import { questionnaireService } from './questionnaire-service';

	// Browser state, so it resolves after mount like every other questionnaire screen.
	let questionCount = $state<number | null>(null);

	onMount(() => {
		questionCount = questionnaireService.getQuestionCount();
	});
</script>

<!--
	Decorative, and static. The reference draws a confetti burst; a scripted animation here
	would have to be suppressed under reduced motion, and the mark carries no information
	the headline below does not.
-->
<p aria-hidden="true" class="flex justify-center">
	<span class="flex size-24 items-center justify-center rounded-full bg-highlight">
		<span class="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
			<CheckIcon class="size-8" />
		</span>
	</span>
</p>

<p class="mt-6 text-center font-sans text-xs font-semibold uppercase tracking-widest text-highlight-foreground">
	{#if questionCount !== null}
		All {questionCount} steps complete
	{/if}
</p>

<h1 class="mt-3 text-center font-display text-4xl font-medium sm:text-5xl">{COPY.headline}</h1>

<div class="mx-auto mt-4 max-w-xl text-center text-base text-muted-foreground md:text-lg">
	{#each COPY.body as line (line)}
		<p>{line}</p>
	{/each}
</div>

<ul class="mt-6 flex flex-wrap justify-center gap-3">
	{#each COPY.pills as pill (pill)}
		<li>
			<Badge variant="secondary" class="gap-1.5">
				<CheckIcon aria-hidden="true" class="size-3.5" />
				{pill}
			</Badge>
		</li>
	{/each}
</ul>

<!--
	Disabled rather than pointed at a route that does not exist. Feature 9 builds checkout
	and turns this on, the same way feature 7 turned on the marketing eligibility CTAs.
-->
<Button type="button" size="lg" disabled aria-describedby="checkout-pending" class="mt-10 w-full">
	{COPY.pendingAction}
</Button>
<p id="checkout-pending" class="mt-3 text-center text-sm text-muted-foreground">
	{COPY.pendingNote}
</p>

<p class="mt-6 text-center text-xs text-text-tertiary">{COPY.footnote}</p>
