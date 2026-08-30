<script lang="ts">
	import BentoCard from './BentoCard.svelte';
	import { BENTO_CARDS } from './content';
	import { BLEED, CONTAINER } from './container';

	const [tall, ...rest] = BENTO_CARDS;
</script>

<!-- Bottom only: the trust row above already ends with its own padding. -->
<section class={[BLEED, 'pb-8']} aria-label="What Solean gives you">
	<div class={CONTAINER}>
		<div class="grid gap-5 lg:grid-cols-5">
			<div class="lg:col-span-2">
				<BentoCard card={tall} size="tall" />
			</div>
			<div class="grid gap-5 sm:grid-cols-2 lg:col-span-3 lg:grid-rows-2">
				{#each rest as card (card.category)}
					<BentoCard {card} />
				{/each}
			</div>
		</div>
	</div>
</section>
