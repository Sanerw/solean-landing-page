<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import * as Carousel from '$lib/components/ui/carousel';
	import BentoCard from './BentoCard.svelte';
	import { bentoCards, bentoSection } from './content';
	import { BLEED, CONTAINER } from './container';
	import { SUB_HEADING } from './type';

	// Read during render so the copy follows the active locale.
	const BENTO_SECTION = $derived(bentoSection());
	const cards = $derived(bentoCards());
	const tall = $derived(cards[0]);
	const rest = $derived(cards.slice(1));
</script>

<!-- Bottom only: the trust row above already ends with its own padding. -->
<section class={[BLEED, 'max-sm:bg-muted max-sm:py-11 sm:pb-8']} aria-label={m.a11y_bento_section()}>
	<div class={CONTAINER}>
		<!--
			Two arrangements of the same five cards, not one that bends: the wide artboard is a
			bento of unequal tiles, the narrow one is a carousel of equal ones, and no set of
			responsive classes turns the first into the second. The images are the same five
			sources either way, so the hidden branch costs markup, not a download.
		-->
		<div data-testid="bento-carousel" class="sm:hidden">
			<div class="px-2">
				<p class="text-[10px] font-bold uppercase tracking-[0.12em] text-highlight-foreground">
					{BENTO_SECTION.eyebrow}
				</p>
				<h2 class={[SUB_HEADING, 'mt-2.5']}>{BENTO_SECTION.title}</h2>
			</div>

			<!-- The artboard leads with one card and carousels the rest, which is why its
			     pagination shows four dots for five cards rather than losing one. -->
			<BentoCard card={tall} variant="feature" class="mt-4" />

			<Carousel.Root opts={{ align: 'start' }} class="mt-3 w-full">
				<!-- The artboard's own 12px track gap, in place of the primitive's 16px. -->
				<Carousel.Content class="-ms-3">
					{#each rest as card (card.category)}
						<!-- Just short of full width, so the next card shows and the row reads as
						     swipeable without a control. -->
						<Carousel.Item class="basis-11/12 ps-3">
							<BentoCard {card} variant="row" />
						</Carousel.Item>
					{/each}
				</Carousel.Content>
				<Carousel.Dots class="mt-5" label="Choose a card" />
			</Carousel.Root>
		</div>

		<div data-testid="bento-grid" class="hidden grid-cols-1 gap-5 sm:grid lg:grid-cols-5">
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
