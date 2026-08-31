<script lang="ts">
	import { buildProjection, type ProjectionPoint } from './projection';

	interface Props {
		series: readonly ProjectionPoint[];
		comparison: readonly ProjectionPoint[];
		horizonMonth: number;
		seriesLabel: string;
		comparisonLabel: string;
		caption: string;
		/** Names the chart region for assistive tech; the table below carries the data. */
		title: string;
		/** Uses the shorter questionnaire plot while the marketing section keeps its aspect. */
		compact?: boolean;
	}

	let {
		series,
		comparison,
		horizonMonth,
		seriesLabel,
		comparisonLabel,
		caption,
		title,
		compact = false
	}: Props = $props();

	const geo = $derived(buildProjection(series, comparison, horizonMonth));

	// Three evenly spaced rules, matching the reference's faint horizontal grid.
	const GRID = [25, 50, 75];
</script>

<figure class="m-0">
	<figcaption class="sr-only">{title}</figcaption>

	<div class={compact ? 'relative h-44 w-full sm:h-52' : 'relative aspect-video w-full'}>
		<!--
			Stretched to the container rather than letterboxed, so the HTML markers and pills
			below can be positioned by the same percentages the geometry emits and land exactly
			on the plotted points. vector-effect keeps strokes an even width under that stretch.
			Decorative: the table after this carries the same data for assistive tech.
		-->
		<svg
			viewBox="0 0 100 100"
			preserveAspectRatio="none"
			aria-hidden="true"
			class="absolute inset-0 size-full overflow-visible"
		>
			{#each GRID as y (y)}
				<line
					x1="0"
					x2="100"
					y1={y}
					y2={y}
					class="stroke-border"
					stroke-width="1"
					vector-effect="non-scaling-stroke"
				/>
			{/each}

			{#if geo.areaPath}
				<path d={geo.areaPath} class="fill-highlight/50" />
			{/if}

			<!-- The reference's own grey measures 2.40:1, under the 3:1 a meaningful graphic
			     needs. --text-faint is the corrected tone of that same colour, at 4.90:1. -->
			<path
				d={geo.comparisonPath}
				fill="none"
				class="stroke-text-faint"
				stroke-width="2"
				stroke-linecap="round"
				vector-effect="non-scaling-stroke"
			/>

			{#if geo.dottedPath}
				<path
					d={geo.dottedPath}
					fill="none"
					class="stroke-foreground"
					stroke-width="3"
					stroke-linecap="round"
					stroke-dasharray="0.1 5"
					vector-effect="non-scaling-stroke"
				/>
			{/if}

			<path
				d={geo.solidPath}
				fill="none"
				class="stroke-foreground"
				stroke-width="3"
				stroke-linecap="round"
				vector-effect="non-scaling-stroke"
			/>
		</svg>

		{#each geo.points as point, index (point.month)}
			{@const emphasised = index === geo.horizonIndex}
			<div
				aria-hidden="true"
				class="absolute -translate-x-1/2 -translate-y-1/2"
				style="left: {point.x}%; top: {point.y}%"
			>
				<!--
					Gold reads 1.82:1 against the page, under the 3:1 for a meaningful graphic, but
					the marker is not one: it sits on a 12.36:1 line, every point is labelled by its
					own value pill, and the full series is in the table below. It reinforces a value
					that is already stated twice, so it is decorative. Against the line it actually
					sits on, gold measures 6.78:1.
				-->
				<span class="block size-3 rounded-full border-2 border-primary bg-background"></span>
			</div>
			<div
				aria-hidden="true"
				class={[
					'absolute -translate-y-full',
					// Pinned inside the plot at the ends so a pill never hangs off the edge.
					index === 0 ? 'translate-x-0' : index === geo.points.length - 1 ? '-translate-x-full' : '-translate-x-1/2'
				]}
				style="left: {point.x}%; top: calc({point.y}% - 0.75rem)"
			>
				<span
					class={[
						'block rounded-sm px-2 py-1 text-sm font-medium whitespace-nowrap',
						emphasised ? 'bg-foreground text-background' : 'bg-surface-warm text-foreground'
					]}
				>
					{point.kg} kg
				</span>
			</div>
		{/each}
	</div>

	<ul class={compact ? 'mt-2 flex list-none gap-4 p-0' : 'mt-4 flex list-none gap-6 p-0'} aria-hidden="true">
		<li class="flex items-center gap-2 text-sm text-muted-foreground">
			<span class="block h-0.5 w-6 rounded-full bg-foreground"></span>
			{seriesLabel}
		</li>
		<li class="flex items-center gap-2 text-sm text-muted-foreground">
			<span class="block h-0.5 w-6 rounded-full bg-text-faint"></span>
			{comparisonLabel}
		</li>
	</ul>

	<!-- Positioned from the same percentages as the markers rather than spaced with
	     justify-between, which distributes label boxes evenly and leaves them off their points. -->
	<div class="relative mt-1 h-5 text-xs text-muted-foreground" aria-hidden="true">
		{#each geo.points as point, index (point.month)}
			<span
				class={[
					'absolute whitespace-nowrap',
					index === 0
						? 'translate-x-0'
						: index === geo.points.length - 1
							? '-translate-x-full'
							: '-translate-x-1/2'
				]}
				style="left: {point.x}%"
			>
				{point.label}
			</span>
		{/each}
	</div>

	<!-- The real alternative to the picture. Reflects the selected horizon so it can never
	     describe a chart the user is not looking at. -->
	<!-- Keep the table inside a clipped visually-hidden wrapper. Applying sr-only directly to
	     a table lets its intrinsic column width expand the document on narrow screens. -->
	<div class="sr-only">
		<table>
			<caption>{caption}</caption>
			<thead>
				<tr>
					<th scope="col">Milestone</th>
					<th scope="col">{seriesLabel}</th>
					<th scope="col">{comparisonLabel}</th>
					<th scope="col">Projection</th>
				</tr>
			</thead>
			<tbody>
				{#each geo.points as point, index (point.month)}
					<tr>
						<th scope="row">{point.label}</th>
						<td>{point.kg} kg</td>
						<td>{geo.comparison[index]?.kg} kg</td>
						<td>
							{index < geo.horizonIndex
								? 'Within the selected horizon'
								: index === geo.horizonIndex
									? 'Selected horizon'
									: 'Beyond the selected horizon'}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</figure>
