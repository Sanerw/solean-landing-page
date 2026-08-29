<script lang="ts">
	import BentoCard from './BentoCard.svelte';
	import { BENTO_CARDS } from './content';
	import { CONTAINER } from './container';

	const [tall, ...rest] = BENTO_CARDS;
</script>

<!--
	Reference layout: one tall card on the left, a two-by-two block on the right. Expressed as
	a two-column grid with the first card spanning both rows, so no card needs a fixed height
	and the whole thing collapses to a single column on its own.
-->
<section class={CONTAINER} aria-label="What Solean gives you">
	<div class="grid gap-4 lg:grid-cols-2 lg:grid-rows-2">
		<div class="lg:row-span-2">
			<BentoCard card={tall} size="tall" />
		</div>
		{#each rest as card (card.category)}
			<BentoCard {card} />
		{/each}
	</div>
</section>
