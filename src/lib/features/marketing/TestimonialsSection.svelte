<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import * as Carousel from '$lib/components/ui/carousel';
	import { BLEED, CONTAINER, PANEL_GAP_Y, PANEL_ROUND, PANEL_Y } from './container';
	import { SECTION_HEADING, SECTION_LEAD } from './type';
	import type { Testimonial } from './content';
	import type { HomePage } from '$lib/sanity/queries';
	import TestimonialCard from './TestimonialCard.svelte';

	// Read during render so the copy follows the active locale.
	const { section, stories }: { section: NonNullable<HomePage['testimonialsSection']>; stories: readonly Testimonial[] } =
		$props();

	const TESTIMONIALS = $derived(stories);

	// Read during render so the copy follows the active locale.
	const TESTIMONIALS_SECTION = $derived(section);
</script>

<section class={[BLEED, PANEL_GAP_Y]} aria-label={TESTIMONIALS_SECTION.title}>
	<div class={['bg-accent', PANEL_ROUND, PANEL_Y]}>
		<div class={CONTAINER}>
			<Carousel.Root opts={{ align: 'start' }} class="flex w-full flex-col">
				<div class="flex flex-wrap items-end justify-between gap-6 max-sm:contents">
					<div>
						<h2 class={SECTION_HEADING}>
							{TESTIMONIALS_SECTION.title}
						</h2>
						<p class={SECTION_LEAD}>{TESTIMONIALS_SECTION.lead}</p>
					</div>
					<!-- Controls sit inline with the heading, as drawn, rather than floating over the
					     cards, so they never cover a story on a narrow screen. -->
				<!-- Below sm the controls move under the card and centre, as drawn. `contents`
			     dissolves this row into the carousel's own column there, so one set of
			     controls is reordered rather than a second set rendered and hidden. -->
				<div
						class="relative flex shrink-0 gap-2 max-sm:order-3 max-sm:mt-8 max-sm:justify-center"
					>
						<Carousel.Previous
							class="static translate-y-0"
							aria-label={m.a11y_prev_story()}
							variant="ghost"
						/>
						<Carousel.Next class="static translate-y-0" aria-label={m.a11y_next_story()} variant="inverse" />
					</div>
				</div>

				<Carousel.Content class="mt-10 max-sm:order-2">
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
