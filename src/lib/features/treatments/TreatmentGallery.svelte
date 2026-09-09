<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import PillIcon from '@lucide/svelte/icons/pill';
	import SyringeIcon from '@lucide/svelte/icons/syringe';
	import { Badge } from '$lib/components/ui/badge';
	import { findTreatment } from '$lib/domain';
	import type { TreatmentPage } from './types';

	const { page }: { page: TreatmentPage } = $props();

	// From the catalogue's own `form`, never by comparing the rendered label: that string is
	// translated, so the icon would follow the language rather than the product.
	const Icon = $derived(findTreatment(page.slug)?.form === 'tablet' ? PillIcon : SyringeIcon);
</script>

<!--
	The panel is the product's ground, its chips, its photograph and its caption.

	It is a column rather than a picture with things laid over it, because the artboard is one:
	the asset sits inset at 720 inside an 828 panel and the caption sits on the ground beneath
	it, not on the photograph. `object-contain` keeps that arrangement whatever shape the art is,
	and it is why the caption stays readable instead of landing on whatever the picture happens
	to be at that corner.

	The photograph is the one part that may be missing, and only the injections have one. The
	tablet page draws the ground, the chips and the caption without it, which is a complete
	panel rather than a broken image.

	`--surface-delivery` stands in for the export's own pale blue, which this palette has no
	token for. Reusing a sanctioned surface is the rule until a fidelity review says otherwise;
	see the Design reference table in the spec.

	It is a square only while it is stacked. From `lg` it takes half the row and its height from
	the details column beside it, which is what the wide artboard draws: 804 by 828 there is not
	a square either, it is the height of the column next to it. Sizing it that way is what lets
	the panel be half the page and still leave the consultation CTA above the fold on a 13 inch
	screen, where a true half-width square is 630px tall on its own.

	Stacked, it takes the whole column. It used to be capped so the square could not fill a
	tablet's screen before a word of copy was reached, which left the product's own panel
	narrower than everything under it on exactly the widths where it is the page's first
	impression.
-->
<div
	class="relative flex aspect-square w-full flex-col overflow-hidden rounded-xl bg-surface-delivery sm:rounded-2xl sm:inset-ring-4 sm:inset-ring-card lg:aspect-auto lg:h-full"
>
	<!--
		The insets are the artboard's own, as proportions rather than as its pixels: its asset is
		720 square inside an 804 by 828 panel, which is 5.2% in from each side, 6.5% down from the
		top, and 16px clear of the caption. The picture is most of the panel there, not a stamp in
		the middle of it.

		The chips overlap the top of it, deliberately: the badge runs to y=70 and the asset starts
		at y=54. An earlier pass pushed the picture down to clear them, which shrank it and is not
		what the artboard draws.
	-->
	<div class="flex min-h-0 flex-1 items-center justify-center px-5 pb-2 pt-6 md:px-8 md:pb-3 md:pt-10">
		{#if page.photo}
			<img
				src={page.photo.picture.src}
				srcset={page.photo.picture.srcset}
				width={page.photo.picture.width}
				height={page.photo.picture.height}
				alt={page.photo.alt}
				sizes="(min-width: 1024px) 46vw, 100vw"
				class="size-full rounded-xl object-cover"
			/>
		{/if}
	</div>

	<p class="px-6 pb-3 text-center text-xs font-semibold text-muted-foreground md:pb-4">
		{page.galleryCaption}
	</p>

	<!-- The chips are product information, not decoration: which form the treatment takes is
	     the first thing that separates the tablet from the two injections. -->
	<Badge
		variant="secondary"
		class="absolute left-4 top-4 h-7 gap-1.5 rounded-full px-3 uppercase md:left-6 md:top-6 md:h-8"
	>
		<Icon aria-hidden="true" />
		{page.formLabel}
	</Badge>

	{#if page.isNew}
		<!-- The saturated gold has no Badge variant of its own, so it is set here rather than by
		     editing the primitive. Both halves are semantic tokens. -->
		<Badge
			class="absolute right-4 top-4 h-7 rounded-full bg-primary px-3 uppercase text-primary-foreground md:right-6 md:top-6 md:h-8"
		>
			{m.treatment_badge_new()}
		</Badge>
	{/if}
</div>
