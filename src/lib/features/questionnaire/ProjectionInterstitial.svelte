<script lang="ts">
	import ProjectionChart from '$lib/components/brand/ProjectionChart.svelte';
	import {
		buildWeightProjection,
		PROJECTION_HORIZON_OPTIONS
	} from '$lib/components/brand/projection';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import * as Tabs from '$lib/components/ui/tabs';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import { PROJECTION_INTERSTITIAL as COPY } from './interstitial-content';

	interface Props {
		/** `undefined` while the browser has not resolved it; `null` when there is none. */
		weightKg: number | null | undefined;
		/** Where to send someone whose weight is missing, so this screen states no route. */
		weightStepHref: string;
		oncontinue: () => void;
	}

	let { weightKg, weightStepHref, oncontinue }: Props = $props();

	const DEFAULT_HORIZON = 6;

	let horizon = $state(String(DEFAULT_HORIZON));

	const projection = $derived(weightKg ? buildWeightProjection(weightKg) : null);
	const horizonMonth = $derived(Number(horizon));
	const horizonOption = $derived(
		PROJECTION_HORIZON_OPTIONS.find((option) => option.month === horizonMonth) ?? null
	);
	const projectedKg = $derived(
		projection?.series.find((point) => point.month === horizonMonth)?.kg ?? null
	);
	const callout = $derived(COPY.callouts[horizonMonth as 3 | 6 | 12] ?? COPY.callouts[6]);
</script>

<p class="text-center font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground">
	{COPY.eyebrow}
</p>

{#if weightKg === undefined}
	<!-- The server render and the moment before hydration. Reserves the headline rather than
	     flashing a fallback that is not yet known to be true. -->
	<h1 class="mt-2 text-center font-display text-3xl font-medium sm:text-4xl">{COPY.headline}</h1>
	<p class="mt-3 text-center text-sm text-text-faint">Loading your projection.</p>
{:else if projection === null || projectedKg === null}
	<h1 class="mt-2 text-center font-display text-3xl font-medium sm:text-4xl">
		{COPY.missingWeight.title}
	</h1>
	<p class="mx-auto mt-2 max-w-lg text-center text-sm text-muted-foreground sm:text-base">
		{COPY.missingWeight.body}
	</p>
	<div class="mt-4 flex justify-center">
		<Button href={weightStepHref} variant="outline">
			{COPY.missingWeight.action}
		</Button>
	</div>
{:else}
	<h1 class="mt-2 text-center font-display text-3xl font-medium sm:text-4xl">{COPY.headline}</h1>

	<p class="mt-3 text-center">
		<!--
			<output> is literally "the result of a calculation", which is what this is, and it
			carries an implicit status role and polite live region. That matters because the
			value sits outside the tab panel yet changes when the horizon does.
		-->
		<output
			aria-label="Projected weight"
			class="inline-block rounded-lg bg-highlight px-4 py-2 font-display text-3xl font-medium text-foreground"
		>
			{projectedKg} kg
		</output>
	</p>
	<p class="mt-2 text-center text-sm text-muted-foreground sm:text-base">
		in {horizonOption?.label ?? ''} with Solean
	</p>

	<!--
		One Tabs.Content per horizon, matching the landing page: each tab then controls a real
		panel, and the chart cannot fall out of step with the selected horizon.
	-->
	<Tabs.Root bind:value={horizon} class="mt-4">
		{#each PROJECTION_HORIZON_OPTIONS as option (option.month)}
			<Tabs.Content value={String(option.month)}>
				<ProjectionChart
					series={projection.series}
					comparison={projection.comparison}
					horizonMonth={option.month}
					seriesLabel={COPY.seriesLabel}
					comparisonLabel={COPY.comparisonLabel}
					caption={COPY.tableCaption}
					title={COPY.chartTitle}
					compact
				/>
			</Tabs.Content>
		{/each}

		<Tabs.List aria-label={COPY.tabsLabel} class="mt-3 flex w-full bg-surface-warm">
			{#each PROJECTION_HORIZON_OPTIONS as option (option.month)}
				<Tabs.Trigger value={String(option.month)}>{option.label}</Tabs.Trigger>
			{/each}
		</Tabs.List>
	</Tabs.Root>

	<!--
		The reference sets the callout below the tab strip, so it sits outside the panel the
		tabs control. Its heading restates the selected tab, and the projected weight above is
		an <output> that announces the change, so nothing here is only conveyed by this block.
	-->
	<Alert.Root variant="highlighted" class="mt-3 py-2">
		<SparklesIcon aria-hidden="true" />
		<Alert.Title>{callout.title}</Alert.Title>
		<Alert.Description>{callout.body}</Alert.Description>
	</Alert.Root>

	<p class="mt-3 text-center text-xs text-text-tertiary">{COPY.footnote}</p>
{/if}

<Button type="button" size="lg" class="relative mt-5 w-full" onclick={oncontinue}>
	Continue
	<ArrowRightIcon aria-hidden="true" class="absolute right-8" />
</Button>
