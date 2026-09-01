<script lang="ts">
	import { BENTO_GROUNDS, type BentoCard } from './content';

	interface Props {
		card: BentoCard;
		/** The tall left card shows a larger image area; the four in the block are compact. */
		size?: 'tall' | 'compact';
		/**
		 * `grid` is the wide bento tile on its category ground. The narrow artboard sets the
		 * same cards on white with the image bled to an edge instead: `feature` leads the
		 * section with the image on top, `row` carries the rest with it on the left.
		 */
		variant?: 'grid' | 'feature' | 'row';
		class?: string;
	}

	let { card, size = 'compact', variant = 'grid', class: className }: Props = $props();
</script>

<!--
	The ground comes from the card's category, never from a caller-supplied class, so a card
	cannot be given a surface that is not recorded in design-system.md section 1b. Only
	--muted-foreground and --foreground are used for text here: --highlight-foreground, the
	eyebrow colour used elsewhere on the page, fails 4.5:1 on the two new grounds.
-->
{#snippet copy()}
	<p
		class={[
			'font-semibold uppercase tracking-widest',
			variant === 'grid' ? 'text-xs text-muted-foreground' : 'text-[10px] text-highlight-foreground'
		]}
	>
		{card.eyebrow}
	</p>
	<h3
		class={[
			'font-display font-medium leading-tight tracking-tight text-foreground',
			variant === 'row' ? 'mt-1.5 text-lg' : 'mt-2',
			variant === 'feature' ? 'text-2xl' : '',
			variant === 'grid' ? (size === 'tall' ? 'text-2xl lg:text-3xl' : 'text-lg') : ''
		]}
	>
		{card.title}
	</h3>
	<p
		class={[
			'font-medium leading-relaxed text-text-tertiary',
			variant === 'row' ? 'mt-1.5 text-xs' : 'mt-2',
			variant === 'feature' ? 'text-sm' : '',
			variant === 'grid' ? (size === 'tall' ? 'text-sm' : 'text-xs') : ''
		]}
	>
		{card.body}
	</p>
{/snippet}

{#if variant === 'grid'}
	<article
		class={[
			'flex h-full flex-col overflow-hidden rounded-xl p-6',
			size === 'compact' ? 'lg:p-5' : '',
			BENTO_GROUNDS[card.category]
		]}
	>
		{@render copy()}

		{#if card.image}
			<!-- Decorative: the heading above already carries the card's meaning. -->
			<img
				src={card.image}
				alt=""
				aria-hidden="true"
				class={[
					'w-full rounded-lg object-cover',
					// The compact cards define the grid's row heights via a fixed ratio; the tall card
					// then grows into whatever those two rows add up to, so the column bottoms align.
					size === 'tall' ? 'mt-3 min-h-64 flex-1' : 'mt-2 aspect-2/1'
				]}
			/>
		{/if}
	</article>
{:else if variant === 'feature'}
	<article class={['overflow-hidden rounded-xl bg-card', className]}>
		{#if card.image}
			<img src={card.image} alt="" aria-hidden="true" class="aspect-video w-full object-cover" />
		{/if}
		<div class="p-5">
			{@render copy()}
		</div>
	</article>
{:else}
	<article class={['flex h-42 overflow-hidden rounded-xl bg-card', className]}>
		{#if card.image}
			<img src={card.image} alt="" aria-hidden="true" class="h-full w-33 shrink-0 object-cover" />
		{/if}
		<div class="flex min-w-0 flex-col justify-center p-4">
			{@render copy()}
		</div>
	</article>
{/if}
