<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import { CONTAINER, SECTION_Y } from './container';
	import { SUB_HEADING } from './type';
	import {
		DEFAULT_HORIZON_MONTH,
		PROJECTION,
		PROJECTION_COMPARISON,
		PROJECTION_HORIZONS,
		PROJECTION_SERIES
	} from './content';
	import MedicalFraming from './MedicalFraming.svelte';
	import ProjectionChart from '$lib/components/brand/ProjectionChart.svelte';

	// The one piece of state in the section. Everything the chart draws is derived from it
	// through the geometry module, so there is no second copy to fall out of step.
	let horizon = $state(String(DEFAULT_HORIZON_MONTH));
</script>

<section class={[CONTAINER, SECTION_Y]} aria-label={PROJECTION.title}>
	<div class="grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-16">
		<div class="max-sm:order-2">
			<h2 class={SUB_HEADING}>
				{PROJECTION.title}
			</h2>
			<p class="mt-2 text-sm text-muted-foreground">{PROJECTION.lead}</p>

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

			<p class="mt-4 text-center text-xs text-text-tertiary">{PROJECTION.disclaimer}</p>
		</div>

		<div class="max-sm:order-1">
			<MedicalFraming />
		</div>
	</div>
</section>
