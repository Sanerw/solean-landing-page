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

	const gridSizes = $derived(
		size === 'tall'
			? '(min-width: 1024px) 40vw, 100vw'
			: '(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw'
	);
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
			<!-- The generated picture element needs its own flexing wrapper: flex-grow on the
			     nested img alone cannot consume the tall card's remaining height. -->
			<div
				class={[
					'overflow-hidden rounded-lg [&_img]:h-full [&_picture]:block [&_picture]:h-full',
					// Both sizes flex to the card's foot. The row's height comes from the tall card
					// beside them, not from their own copy, so an image at a fixed aspect ratio
					// leaves a block of bare card ground below it whenever that card's body wraps.
					size === 'tall' ? 'mt-3 min-h-64 flex-1' : 'mt-2 min-h-32 flex-1'
				]}
			>
				<!-- Decorative: the heading above already carries the card's meaning. -->
				<enhanced:img
					src={card.image}
					alt=""
					aria-hidden="true"
					loading="lazy"
					decoding="async"
					sizes={gridSizes}
					class="h-full w-full object-cover"
				/>
			</div>
		{/if}
	</article>
{:else if variant === 'feature'}
	<article class={['overflow-hidden rounded-xl bg-card', className]}>
		{#if card.image}
			<enhanced:img
				src={card.image}
				alt=""
				aria-hidden="true"
				loading="lazy"
				decoding="async"
				sizes="100vw"
				class="aspect-video w-full object-cover"
			/>
		{/if}
		<div class="p-5">
			{@render copy()}
		</div>
	</article>
{:else}
	<article class={['flex h-42 overflow-hidden rounded-xl bg-card', className]}>
		{#if card.image}
			<!-- Keep the generated picture element inside a fixed media pane. Without this
			     wrapper the picture itself remains a shrinkable flex item and collapses narrower
			     than the 132px image used by the reference carousel. -->
			<div class="h-full w-33 shrink-0 overflow-hidden [&_img]:h-full [&_picture]:h-full">
				<enhanced:img
					src={card.image}
					alt=""
					aria-hidden="true"
					loading="lazy"
					decoding="async"
					sizes="132px"
					class="h-full w-full object-cover"
				/>
			</div>
		{/if}
		<div class="flex min-w-0 flex-col justify-center p-4">
			{@render copy()}
		</div>
	</article>
{/if}
