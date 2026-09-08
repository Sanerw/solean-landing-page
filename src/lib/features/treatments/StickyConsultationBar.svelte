<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { Button } from '$lib/components/ui/button';
	import { ROUTES } from '$lib/features/marketing/content';
	import { formatPrice } from './content';
	import type { TreatmentPage } from './types';

	const { page }: { page: TreatmentPage } = $props();
</script>

<!--
	The narrow artboard's foot bar, which stands in for the offer card the wide one draws: it
	quotes `page.firstMonth`, the same field the card quotes.

	`sticky`, not `fixed`, and the last child of the page's content. A fixed bar covers the
	bottom of the viewport forever, and the last thing on this site is the footer's legal row:
	Impressum and Datenschutz would sit permanently underneath it, which is not a cosmetic
	problem in this market. Sticky pins the bar for the whole of the page's own content and
	then lets it scroll away as the footer arrives, and it reserves its own height in flow so
	no spacer is needed.

	`z-40`, deliberately under the consent banner's `z-50`. The banner is a legal gate: it may
	cover this, never the other way round. The browser suite runs with consent already
	declined, so it never renders the banner and cannot prove that ordering; reading the two
	z-indexes is what proves it.
-->
<div
	class="sticky bottom-0 z-40 border-t border-border bg-card/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg backdrop-blur-sm md:hidden"
>
	<Button href={localizeHref(ROUTES.questionnaire)} variant="inverse" class="w-full">
		{m.treatment_offer_first_month({ price: formatPrice(page.firstMonth) })}
	</Button>
</div>
