<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { Button } from '$lib/components/ui/button';
	import { ROUTES } from '$lib/features/marketing/content';
	import { formatPrice } from './content';
	import type { TreatmentPage } from './types';

	const { page }: { page: TreatmentPage } = $props();

	/**
	 * The bar's own height, published the way the consent gate publishes its own, so the page
	 * can reserve the space it floats over. Without that reservation a fixed bar sits
	 * permanently on top of the last thing a visitor scrolls to, and on this site that is the
	 * footer's legal row: Impressum and Datenschutz, which is not a cosmetic problem in this
	 * market.
	 *
	 * Measured rather than guessed at, because the button's height follows the type scale and
	 * the safe-area inset differs per device.
	 */
	let barHeight = $state(0);
	$effect(() => {
		const root = document.documentElement;
		root.style.setProperty('--treatment-cta-height', `${barHeight}px`);

		return () => root.style.removeProperty('--treatment-cta-height');
	});
</script>

<!--
	The narrow artboard's foot bar, which stands in for the offer card the wide one draws: it
	quotes `page.firstMonth`, the same field the card quotes.

	`fixed`, so the offer stays in reach at any scroll position. An earlier pass made it
	`sticky` to keep it off the footer's legal row, but that solved the collision by taking the
	button away exactly when a visitor had finished reading and was most likely to act.
	Reserving the space in the layout solves it without that cost.

	`z-40`, deliberately under the consent gate's `z-50`, and lifted clear of it by
	`--consent-gate-height`, which the gate publishes while it is on screen. Stacking rather
	than overlapping is the point: at `z-40` alone this bar rendered behind the gate, which
	reads as a missing button rather than a covered one.

	Inline style because the offset is genuinely dynamic, which is the one case the coding
	standards allow one for.
-->
<div
	bind:clientHeight={barHeight}
	class="fixed inset-x-0 z-40 border-t border-border bg-card/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg backdrop-blur-sm md:hidden"
	style="bottom: var(--consent-gate-height, 0px)"
>
	<Button href={localizeHref(ROUTES.questionnaire)} variant="inverse" class="w-full">
		{m.treatment_offer_first_month({ price: formatPrice(page.firstMonth) })}
	</Button>
</div>
