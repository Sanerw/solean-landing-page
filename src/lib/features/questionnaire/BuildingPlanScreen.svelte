<script lang="ts">
	import { Spinner } from '$lib/components/ui/spinner';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import { RECOMMENDATION as COPY } from './recommendation-content';

	const { steps, headline } = COPY.building;
</script>

<!--
	What the visitor sees while the recommendation is read. The first item is already true on
	arrival: the anamnesis was submitted on the previous screen, and only the match is still
	running. Nothing here is on a timer, so the list never claims progress that has not
	happened.
-->
<div role="status" class="py-10 sm:py-16">
	<h1 class="font-display text-3xl font-medium sm:text-4xl">{headline}</h1>

	<ul class="mt-10 space-y-5">
		{#each steps as step (step.label)}
			<li class="flex items-center gap-4">
				{#if step.done}
					<CircleCheckIcon aria-hidden="true" class="size-7 shrink-0 text-primary" />
				{:else}
					<!-- The reference draws an empty circle here. A spinner is the same shape and
					     says the thing the circle cannot: that this one is running. -->
					<Spinner aria-hidden="true" class="size-7 shrink-0 text-text-tertiary" />
				{/if}
				<span class={['text-lg', step.done ? 'text-foreground' : 'text-muted-foreground']}>
					{step.label}
				</span>
				<span class="sr-only">{step.done ? 'Done.' : 'In progress.'}</span>
			</li>
		{/each}
	</ul>
</div>
