<script lang="ts">
	import * as Carousel from '$lib/components/ui/carousel';
	import { BLEED, CONTAINER, PANEL_GAP_Y, PANEL_Y } from './container';
	import { SECTION_HEADING, SECTION_LEAD } from './type';
	import { TESTIMONIALS, TESTIMONIALS_SECTION } from './content';
	import TestimonialCard from './TestimonialCard.svelte';
</script>

<section class={[BLEED, PANEL_GAP_Y]} aria-label={TESTIMONIALS_SECTION.title}>
	<div class={['rounded-xl bg-accent', PANEL_Y]}>
		<div class={CONTAINER}>
			<Carousel.Root opts={{ align: 'start' }} class="w-full">
				<div class="flex flex-wrap items-end justify-between gap-6">
					<div>
						<h2 class={SECTION_HEADING}>
							{TESTIMONIALS_SECTION.title}
						</h2>
						<p class={SECTION_LEAD}>{TESTIMONIALS_SECTION.lead}</p>
					</div>
					<!-- Controls sit inline with the heading, as drawn, rather than floating over the
					     cards, so they never cover a story on a narrow screen. -->
					<div class="relative flex shrink-0 gap-2">
						<Carousel.Previous
							class="static translate-y-0"
							aria-label="Previous story"
							variant="ghost"
						/>
						<Carousel.Next class="static translate-y-0" aria-label="Next story" variant="inverse" />
					</div>
				</div>

				<Carousel.Content class="mt-10">
					{#each TESTIMONIALS as testimonial (testimonial.name)}
						<Carousel.Item class="basis-full md:basis-1/2 lg:basis-1/3">
							<TestimonialCard {testimonial} />
						</Carousel.Item>
					{/each}
				</Carousel.Content>
			</Carousel.Root>
		</div>
	</div>
</section>
