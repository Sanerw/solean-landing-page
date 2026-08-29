<script lang="ts">
	import * as Carousel from '$lib/components/ui/carousel';
	import ShowcaseSection from './ShowcaseSection.svelte';

	// Neutral placeholders only. Testimonial and clinician cards are feature 5's
	// product components; this proves the primitive, not that content.
	const CARDS = Array.from({ length: 6 }, (_, i) => i + 1);
</script>

<ShowcaseSection
	id="carousel"
	title="Carousel"
	description="One card visible on narrow screens, three at desktop width. Previous and next are real Buttons with sr-only labels and disabled boundaries at each end; no custom carousel state duplicates Embla's own."
>
	<Carousel.Root class="mx-12" opts={{ align: 'start' }}>
		<Carousel.Content>
			{#each CARDS as card (card)}
				<Carousel.Item class="basis-full sm:basis-1/2 lg:basis-1/3">
					<div class="flex h-40 items-center justify-center rounded-lg border border-border bg-card">
						<span class="font-display text-2xl font-semibold text-muted-foreground">
							Card {card}
						</span>
					</div>
				</Carousel.Item>
			{/each}
		</Carousel.Content>
		<Carousel.Previous aria-label="Previous card" />
		<Carousel.Next aria-label="Next card" />
	</Carousel.Root>

	<p class="mt-8 max-w-3xl text-sm text-muted-foreground">
		Tab to a control and press Enter or Space, or use the Left and Right Arrow keys once a control
		is focused. No autoplay runs, so there is no decorative motion for
		<code class="font-sans">prefers-reduced-motion</code> to guard against; only user-initiated
		scrolling.
	</p>
</ShowcaseSection>
