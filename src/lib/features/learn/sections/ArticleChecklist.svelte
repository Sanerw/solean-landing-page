<script lang="ts">
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';

	interface Props {
		id: string;
		heading: string;
		intro?: string;
		items: readonly string[];
	}

	let { id, heading, intro, items }: Props = $props();
</script>

<section {id} class="scroll-mt-8" aria-labelledby="{id}-title">
	<h2
		id="{id}-title"
		class="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
	>
		{heading}
	</h2>

	{#if intro}
		<p class="mt-4 text-base leading-relaxed text-muted-foreground lg:text-lg">{intro}</p>
	{/if}

	<!-- Marks rather than discs, as the artboard draws them. The mark is decoration: it says
	     nothing a reader of the list does not already have from the list. -->
	<ul class="mt-5 flex flex-col gap-2">
		{#each items as item (item)}
			<li class="flex items-start gap-2.5 text-base text-muted-foreground">
				<CircleCheckIcon aria-hidden="true" class="mt-1 size-4 shrink-0 text-primary" />
				<span>{item}</span>
			</li>
		{/each}
	</ul>
</section>
