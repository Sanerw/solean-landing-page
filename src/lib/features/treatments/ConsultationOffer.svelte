<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { ROUTES } from '$lib/features/marketing/content';
	import { firstMonthSaving, formatPrice } from './content';
	import type { Dose, TreatmentPage } from './types';

	const { page, dose }: { page: TreatmentPage; dose: Dose } = $props();
</script>

<!--
	The narrow artboard has no card here: the sticky bar at the foot of the screen carries the
	same offer, so this one starts at `md`. Both read `page.firstMonth`, so the two can never
	quote different figures, which is exactly what the export does at 69 against 70.
-->
<div
	class="relative mt-6 hidden rounded-lg border border-border bg-card p-5 pt-7 text-center md:block"
>
	<!-- Derived, not stored: the standard month minus the first. -->
	<Badge
		variant="accent"
		class="absolute -top-3 left-1/2 h-6 -translate-x-1/2 rounded-sm px-3 normal-case"
	>
		{m.treatment_offer_saving({ amount: formatPrice(firstMonthSaving(page)) })}
	</Badge>

	<p class="font-display text-xl font-semibold text-foreground md:text-2xl">
		{m.treatment_offer_first_month({ price: formatPrice(page.firstMonth) })}
	</p>

	<!-- The selected dose, not a "from" figure. The selector above is a price lever, so the
	     line under it has to answer to whatever is chosen. -->
	<p class="mt-1.5 text-xs text-muted-foreground md:text-sm">
		{m.treatment_offer_thereafter({ price: formatPrice(dose.monthlyPrice) })}
	</p>

	<Button href={localizeHref(ROUTES.questionnaire)} variant="inverse" class="mt-5 w-full">
		{m.treatment_offer_cta()}
		<ArrowRightIcon aria-hidden="true" class="size-4" />
	</Button>
</div>
