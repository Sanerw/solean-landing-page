<script lang="ts">
	interface Props {
		/** Filled marks are Math.round(rating), clamped to max. */
		rating: number;
		max?: number;
		size?: 'sm' | 'default';
		/**
		 * `badge` is the platform-style green square from the hero trust badge.
		 * `inline` is the bare star used in testimonial cards.
		 */
		treatment?: 'badge' | 'inline';
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
					<path
						d="M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.55l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96L12 2.5z"
					/>
				</svg>
			</span>
		{:else}
			<svg
				viewBox="0 0 24 24"
				class={[starSize, i < filled ? inlineFill : 'fill-border']}
				aria-hidden="true"
			>
				<path
					d="M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.55l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96L12 2.5z"
				/>
			</svg>
		{/if}
	{/each}
</span>
