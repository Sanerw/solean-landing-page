<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import { CONTAINER, SECTION_Y } from './container';
	import { SECTION_HEADING, SECTION_LEAD } from './type';
	import {
		DEFAULT_HORIZON_MONTH,
		PROJECTION_COMPARISON,
		PROJECTION_HORIZONS,
		PROJECTION_SERIES
	} from './content';
	import MedicalFraming from './MedicalFraming.svelte';
	import type { HomePage } from '$lib/sanity/queries';
	import type { medicalFramingFrom } from './from-sanity';
	import ProjectionChart from '$lib/components/brand/ProjectionChart.svelte';

	// The one piece of state in the section. Everything the chart draws is derived from it
	// through the geometry module, so there is no second copy to fall out of step.
	let horizon = $state(String(DEFAULT_HORIZON_MONTH));

	const {
		projection,
		framing
	}: { projection: NonNullable<HomePage['projection']>; framing: ReturnType<typeof medicalFramingFrom> } = $props();

	const PROJECTION = $derived(projection);
</script>

<section class={[CONTAINER, SECTION_Y]} aria-label={PROJECTION.title}>
	<div class="grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-16">
		<!--
			Centred from `2xl`, not from `lg`. The artboard centres this heading, its lead and the
			disclaimer over the chart, but it is drawn at the width the container finally reaches:
			`--container-site` is 96rem, which is the same 1536px `2xl` names. Between `lg` and
			there the column is narrower than the heading needs, so the centring only produced a
			short orphaned second line hanging under a full one. Below that the section reads as
			one left-aligned column like every other band.
		-->
		<div class="max-sm:order-2 2xl:text-center">
			<!--
				`SECTION_HEADING`, not the `SUB_HEADING` the artboard draws here at roughly 40px
				against its neighbour's 66px. Asked for on 2026-09-14: beside the medical framing
				heading in the same row, the quieter scale read as a caption rather than a section.
				A deliberate departure from the reference, so do not "restore" it.

				Set here rather than by widening `SUB_HEADING`, which `BentoGrid` also uses and
				which should keep the reference's quieter scale.
			-->
			<h2 class={SECTION_HEADING}>
				{PROJECTION.title}
			</h2>
			<p class={SECTION_LEAD}>{PROJECTION.lead}</p>

			<!--
				One Tabs.Content per horizon rather than one shared chart outside the primitive:
				that is what gives each tab a real panel to control, and it makes the chart and
				the selected tab impossible to get out of step, since only the matching panel
				is ever mounted.
			-->
			<Tabs.Root bind:value={horizon} class="mt-6">
				{#each PROJECTION_HORIZONS as option (option.month)}
					<Tabs.Content value={String(option.month)}>
						<ProjectionChart
							series={PROJECTION_SERIES}
							comparison={PROJECTION_COMPARISON}
							horizonMonth={option.month}
							seriesLabel={PROJECTION.seriesLabel}
							comparisonLabel={PROJECTION.comparisonLabel}
							caption={PROJECTION.tableCaption}
							title={PROJECTION.title}
						/>
					</Tabs.Content>
				{/each}

				<!-- The narrow artboard shows one chart and no horizon control. Hidden rather
				     than removed: the tab still owns the panel that is mounted, so hiding the
				     list leaves the default horizon showing rather than nothing. -->
				<Tabs.List
					aria-label={PROJECTION.tabsLabel}
					class="mt-8 flex w-full bg-surface-warm max-sm:hidden"
				>
					{#each PROJECTION_HORIZONS as option (option.month)}
						<Tabs.Trigger value={String(option.month)}>{option.label}</Tabs.Trigger>
					{/each}
				</Tabs.List>
			</Tabs.Root>

			<p class="mt-4 text-xs text-text-tertiary 2xl:text-center">{PROJECTION.disclaimer}</p>
		</div>

		<div class="max-sm:order-1">
			<MedicalFraming {framing} />
		</div>
	</div>
</section>
