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

	The photograph fills it and everything else lies over it. The artboard insets the asset on
	its own ground, but on review that ground read as a grey frame around the picture, so the
	panel is now the picture and the white ring is the only edge left.

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
	class="relative aspect-square w-full overflow-hidden rounded-xl bg-surface-delivery sm:rounded-2xl sm:inset-ring-4 sm:inset-ring-card lg:aspect-auto lg:h-full"
>
	{#if page.photo}
		<img
			src={page.photo.picture.src}
			srcset={page.photo.picture.srcset}
			width={page.photo.picture.width}
			height={page.photo.picture.height}
			alt={page.photo.alt}
			sizes="(min-width: 1024px) 46vw, 100vw"
			class="absolute inset-0 size-full object-cover"
		/>
	{/if}

	<p
		class="absolute inset-x-0 bottom-0 px-6 pb-3 text-center text-xs font-semibold text-muted-foreground md:pb-4"
	>
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
