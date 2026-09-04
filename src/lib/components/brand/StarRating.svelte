<script lang="ts">
	interface Props {
		/** Filled marks are Math.round(rating), clamped to max. */
		rating: number;
		max?: number;
		size?: 'sm' | 'default';
		/**
		 * `badge` is the platform-style green square from the hero trust badge.
		 * `inline` is the bare star used in testimonial cards.
		 * `outline` is the hollow star the results band sets beside its score numeral.
		 */
		treatment?: 'badge' | 'inline' | 'outline';
		/**
		 * Only meaningful for `inline`. Stars are the sole carrier of the score there, so
		 * they are a meaningful graphic needing 3:1: gold reads 1.82 on a light card and
		 * 6.78 on a dark one, so neither tone can serve both grounds.
		 */
		surface?: 'default' | 'dark';
		class?: string;
	}

	let {
		rating,
		max = 5,
		size = 'default',
		treatment = 'badge',
		surface = 'default',
		class: className
	}: Props = $props();

	const filled = $derived(Math.min(Math.max(Math.round(rating), 0), max));
	const boxSize = $derived(size === 'sm' ? 'size-5' : 'size-7');
	const starSize = $derived(size === 'sm' ? 'size-3' : 'size-4');
	// One decimal reads naturally for 4.7 and collapses to "5" for a whole number.
	const label = $derived(`${Number(rating.toFixed(1))} out of ${max} stars`);

	const inlineFill = $derived(
		surface === 'dark' ? 'fill-primary' : 'fill-highlight-foreground'
	);
	// The empty mark has to recede on its own ground, and --border is a near-white hairline:
	// over a photograph it reads brighter than the gold it is meant to sit behind.
	const inlineEmptyFill = $derived(surface === 'dark' ? 'fill-background/25' : 'fill-border');

	const STAR =
		'M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.55l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96L12 2.5z';
</script>

<span class={['inline-flex items-center gap-1', className]} role="img" aria-label={label}>
	{#each Array.from({ length: max }) as _, i (i)}
		{#if treatment === 'badge'}
			<!-- The reference's trust badge draws each star as a filled square holding a white
			     star, not a bare glyph. --rating is used here and nowhere else. -->
			<span
				aria-hidden="true"
				class={[
					boxSize,
					'inline-flex items-center justify-center rounded-xs',
					i < filled ? 'bg-rating' : 'bg-muted'
				]}
			>
				<svg viewBox="0 0 24 24" class={[starSize, 'fill-white']} aria-hidden="true">
					<path d={STAR} />
				</svg>
			</span>
		{:else if treatment === 'outline'}
			<!-- The reference sets these beside the score numeral, which is what carries the
			     rating, so every mark is drawn hollow rather than filled to the score. -->
			<svg
				viewBox="0 0 24 24"
				class={[starSize, 'fill-none stroke-current']}
				stroke-width="1.75"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d={STAR} />
			</svg>
		{:else}
			<svg
				viewBox="0 0 24 24"
				class={[starSize, i < filled ? inlineFill : inlineEmptyFill]}
				aria-hidden="true"
			>
				<path d={STAR} />
			</svg>
		{/if}
	{/each}
</span>
