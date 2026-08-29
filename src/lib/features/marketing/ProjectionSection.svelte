<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import { CONTAINER } from './container';
	import {
		DEFAULT_HORIZON_MONTH,
		PROJECTION,
		PROJECTION_COMPARISON,
		PROJECTION_HORIZONS,
		PROJECTION_SERIES
	} from './content';
	import MedicalFraming from './MedicalFraming.svelte';
	import ProjectionChart from './ProjectionChart.svelte';

	// The one piece of state in the section. Everything the chart draws is derived from it
	// through the geometry module, so there is no second copy to fall out of step.
	let horizon = $state(String(DEFAULT_HORIZON_MONTH));
</script>

<section class={CONTAINER} aria-label={PROJECTION.title}>
	<div class="grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-16">
		<div>
			<h2 class="font-display text-2xl font-medium text-foreground md:text-3xl">
				{PROJECTION.title}
			</h2>
			<p class="mt-2 text-sm text-muted-foreground">{PROJECTION.lead}</p>

			<!--
				One Tabs.Content per horizon rather than one shared chart outside the primitive:
				that is what gives each tab a real panel to control, and it makes the chart and
				the selected tab impossible to get out of step, since only the matching panel
				is ever mounted.
			-->
			<Tabs.Root bind:value={horizon} class="mt-8">
				{#each PROJECTION_HORIZONS as option (option.month)}
					<Tabs.Content value={String(option.month)} id="projection-panel-{option.month}">
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

				<Tabs.List aria-label={PROJECTION.tabsLabel} class="mt-8 flex w-full bg-surface-warm">
					<!-- bits-ui emits no aria-controls on the tab and no aria-labelledby on the panel,
					     so the pairing is wired explicitly here through the primitive's public props
					     rather than by editing the primitive. Recorded as F-07. -->
					{#each PROJECTION_HORIZONS as option (option.month)}
						<Tabs.Trigger value={String(option.month)} aria-controls="projection-panel-{option.month}">
							{option.label}
						</Tabs.Trigger>
					{/each}
				</Tabs.List>
			</Tabs.Root>

			<p class="mt-4 text-center text-xs text-text-tertiary">{PROJECTION.disclaimer}</p>
		</div>

		<MedicalFraming />
	</div>
</section>
