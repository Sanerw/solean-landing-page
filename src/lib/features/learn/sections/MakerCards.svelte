<script lang="ts">
	import Building2Icon from '@lucide/svelte/icons/building-2';

	interface Props {
		id: string;
		heading: string;
		cards: readonly { name: string; eyebrow: string; body: string }[];
	}

	let { id, heading, cards }: Props = $props();
</script>

<section {id} class="scroll-mt-8" aria-labelledby="{id}-title">
	<h2
		id="{id}-title"
		class="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
	>
		{heading}
	</h2>

	<div class="mt-6 grid gap-4 sm:grid-cols-2">
		{#each cards as card (card.name)}
			<div class="flex flex-col gap-2.5 rounded-md bg-secondary p-5">
				<span
					aria-hidden="true"
					class="flex size-11 items-center justify-center rounded-sm bg-highlight text-highlight-foreground"
				>
					<Building2Icon class="size-5" />
				</span>
				<h3 class="font-display text-xl font-semibold text-foreground">{card.name}</h3>
				<p class="text-xs font-bold uppercase tracking-wider text-highlight-foreground">
					{card.eyebrow}
				</p>
				<p class="text-sm leading-relaxed text-muted-foreground">{card.body}</p>
			</div>
		{/each}
	</div>
</section>
