<script lang="ts">
	import { BENTO_GROUNDS, type BentoCard } from './content';

	interface Props {
		card: BentoCard;
		/** The tall left card shows a larger image area; the four in the block are compact. */
		size?: 'tall' | 'compact';
	}

	let { card, size = 'compact' }: Props = $props();
</script>

<!--
	The ground comes from the card's category, never from a caller-supplied class, so a card
	cannot be given a surface that is not recorded in design-system.md section 1b. Only
	--muted-foreground and --foreground are used for text here: --highlight-foreground, the
	eyebrow colour used elsewhere on the page, fails 4.5:1 on the two new grounds.
-->
<article
	class={[
		'flex h-full flex-col overflow-hidden rounded-xl p-6',
		BENTO_GROUNDS[card.category]
	]}
>
	<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
		{card.eyebrow}
	</p>
	<h3 class="mt-3 font-display text-2xl font-medium text-foreground md:text-3xl">
		{card.title}
	</h3>
	<p class="mt-2 text-sm text-text-tertiary">{card.body}</p>

	{#if card.image}
		<!-- Decorative: the heading above already carries the card's meaning. -->
		<img
			src={card.image}
			alt=""
			aria-hidden="true"
			class={[
				'mt-4 w-full rounded-lg object-cover',
				// The compact cards define the grid's row heights via a fixed ratio; the tall card
				// then grows into whatever those two rows add up to, so the column bottoms align.
				size === 'tall' ? 'min-h-64 flex-1' : 'aspect-2/1'
			]}
		/>
	{/if}
</article>
