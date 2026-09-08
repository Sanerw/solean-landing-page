<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive } from 'bits-ui';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { m } from '$lib/paraglide/messages';
	import { formatPrice } from './content';
	import type { Dose } from './types';

	interface Props {
		doses: readonly Dose[];
		/** The chosen dose's label. Owned by the page, because the offer card prices it too. */
		value: string;
		labelledBy: string;
	}

	let { doses, value = $bindable(), labelledBy }: Props = $props();
</script>

<!--
	The artboard draws this as a segmented control: four joined cells, the chosen one filled.
	It is a choice of product option, so it is a radio group, not tabs. Tabs would promise
	panels that do not exist, which is the defect F-07 recorded against that primitive.

	`gap-0` is not redundant. The adapted Root's own base class carries `gap-3`, and nothing in
	a class that never mentions a gap displaces it, so the segments were drawn 12px apart with
	the container's ground showing between them and each divider floating clear of its
	neighbour. Naming the gap is what lets `tailwind-merge` replace it.

	`RadioGroup.Item` is reached from `bits-ui` rather than from the adapted primitive: the
	adapted one is a fixed 20px circle with a dot and takes no children, which is the right
	shape for a questionnaire option card and the wrong one for a segment that has to *be* the
	control. The Root is still the adapted one, so the group's own wiring is unchanged.
-->
<RadioGroup.Root
	bind:value
	aria-labelledby={labelledBy}
	class="grid auto-cols-fr grid-flow-col gap-0 overflow-hidden rounded-lg border border-border bg-muted"
>
	{#each doses as dose (dose.label)}
		<RadioGroupPrimitive.Item
			value={dose.label}
			class="group flex flex-col items-center justify-center gap-0.5 border-l border-border px-2 py-2.5 text-center outline-none transition-colors first:border-l-0 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-checked:bg-foreground data-checked:hover:bg-foreground md:py-3"
		>
			<span
				class="text-sm font-bold text-foreground group-data-checked:text-background md:text-base"
			>
				{dose.label}
			</span>
			<!--
				Part of the option's own accessible name, not decoration: the price is half of what
				the person is choosing between, so a screen reader has to reach it too.
			-->
			<span
				class="text-xs font-medium text-muted-foreground group-data-checked:text-background/80"
			>
				{m.treatment_price_per_month({ price: formatPrice(dose.monthlyPrice) })}
			</span>
		</RadioGroupPrimitive.Item>
	{/each}
</RadioGroup.Root>
