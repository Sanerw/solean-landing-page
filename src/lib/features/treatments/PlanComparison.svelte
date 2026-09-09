<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import { CONTAINER } from '$lib/features/marketing/container';
	import { ROUTES } from '$lib/features/marketing/content';
	import { SECTION_HEADING, SECTION_LEAD, SECTION_Y } from './type';
	import { comparisonDurations, comparisonRows, formatPrice } from './content';
	import type { SanityTreatmentPage } from './from-sanity';
	import type { Plan } from './types';
	import type { Money } from '$lib/domain';

	/**
	 * Every treatment, not just this one: the table compares them, and taking them as a prop
	 * rather than reading a module keeps the rows and the dose selector above on one response.
	 */
	const { slug, treatments }: { slug: string; treatments: readonly SanityTreatmentPage[] } =
		$props();

	// Read during render so the names and labels follow the active locale.
	const rows = $derived(comparisonRows(slug, treatments));
	const durations = $derived(comparisonDurations(rows));

	/** The artboard marks one column as the best value; the data decides which. */
	const recommended = $derived(
		rows[0]?.plans.find((plan) => plan.recommended)?.durationMonths ?? null
	);

	/**
	 * Where to float the best-value chip. The artboard sets it straddling the table's top edge,
	 * centred over its column, which nothing in the markup can express: the chip has to sit
	 * outside the element whose overflow is hidden to keep the rounded corners.
	 *
	 * So it is positioned as a percentage of the table's width, derived from the column layout
	 * rather than measured, which keeps it correct if a duration is ever added or removed.
	 */
	const NAME_COLUMN_PERCENT = 100 / 3;
	const recommendedIndex = $derived(
		recommended === null ? -1 : durations.indexOf(recommended)
	);
	const chipLeftPercent = $derived(
		NAME_COLUMN_PERCENT +
			((100 - NAME_COLUMN_PERCENT) / Math.max(durations.length, 1)) * (recommendedIndex + 0.5)
	);

	/**
	 * Null rather than a blank when a treatment does not offer a duration. The content test
	 * asserts every row offers the same four, so this guards against the data changing under
	 * the table rather than a case the current content reaches.
	 */
	function priceFor(plans: readonly Plan[], months: number): Money | null {
		return plans.find((plan) => plan.durationMonths === months)?.monthlyPrice ?? null;
	}
</script>

<section class={[CONTAINER, SECTION_Y]} aria-labelledby="treatment-compare-heading">
	<h2 id="treatment-compare-heading" class={SECTION_HEADING}>
		{m.treatment_compare_heading()}
	</h2>
	<p class={SECTION_LEAD}>{m.treatment_compare_lead()}</p>

	<!--
		A real table, because prices across treatments and durations are tabular data: without
		the header association a screen reader reaching 119 has no way to learn it belongs to
		Wegovy Pill at six months.

		`lg`, not `md`. Five columns each holding a price needs about 1024px; at 768px the four
		price columns land near 150px and the figures collide, which is presumably why the narrow
		artboard abandons the table entirely. Below `lg` the stacked cards take over.

		The best-value chip straddles the table's top edge, as the artboard draws it. It sits in
		its own layer above the table rather than inside the header cell, because the cell's
		container hides its overflow to keep the rounded corners. It is `aria-hidden`, and the
		column header carries the same words for a screen reader: a chip floating outside the
		table would otherwise be read detached from the column it describes.
	-->
	<div class="relative mt-6 hidden pt-3 lg:block">
		{#if recommendedIndex >= 0}
			<div
				class="absolute top-0 z-10 -translate-x-1/2"
				style="left: {chipLeftPercent}%"
				aria-hidden="true"
			>
				<span
					class="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wider text-foreground shadow-sm"
				>
					{m.treatment_compare_best_value()}
				</span>
			</div>
		{/if}

		<div class="overflow-hidden rounded-lg border border-border">
		<table class="w-full border-collapse text-left">
			<thead>
				<!-- The warm sand the artboard uses for this row, not the cooler `secondary`. -->
				<tr class="bg-muted">
					<th
						scope="col"
						class="w-1/3 px-4 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground"
					>
						{m.treatment_compare_col_treatment()}
					</th>
					{#each durations as months (months)}
						{@const isBest = months === recommended}
						<th
							scope="col"
							class={[
								'border-l border-border px-3 py-4 text-center text-xs font-bold uppercase tracking-wider',
								isBest ? 'bg-foreground text-background' : 'text-foreground'
							]}
						>
							{m.treatment_compare_months({ months })}
							{#if isBest}
								<!-- The chip above the table is decorative, so the mark a screen reader
								     reaches lives here, in the header of the column it describes. A column
								     marked by colour alone is not marked at all for most people reading it. -->
								<span class="sr-only">{m.treatment_compare_best_value()}</span>
							{/if}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each rows as row, index (row.slug)}
					<tr class={['border-t border-border', index % 2 === 1 ? 'bg-surface-subtle' : 'bg-card']}>
						<th scope="row" class="px-4 py-3 font-normal">
							<!-- The artboard's own arrangement: thumbnail, then the name and its format,
							     then the chip beside them rather than stacked under them. -->
							<div class="flex items-center gap-3">
								{#if row.photo}
									<img
										src={row.photo.picture.src}
										srcset={row.photo.picture.srcset}
										alt=""
										aria-hidden="true"
										sizes="56px"
										class="size-14 shrink-0 rounded-md object-cover"
									/>
								{:else}
									<!-- The treatments without art keep the slot, so the names stay on one
									     vertical line down the column instead of stepping in and out. -->
									<span class="size-14 shrink-0 rounded-md bg-secondary" aria-hidden="true"></span>
								{/if}

								<div class="min-w-0 flex-1">
									<span
										class="block truncate font-display text-base font-bold text-foreground xl:text-lg"
									>
										{row.name}
									</span>
									<span class="mt-0.5 block text-xs text-muted-foreground">{row.formLabel}</span>
								</div>

								{#if row.isCurrent}
									<!-- The page you are on. A link here is a dead end, so it is a label
									     instead, and it is text rather than a highlight so it survives being
									     read aloud. -->
									<span
										class="shrink-0 text-xs font-semibold text-highlight-foreground"
									>
										{m.treatment_compare_current()}
									</span>
								{:else}
									<a
										href={localizeHref(ROUTES.treatment(row.slug))}
										class="inline-flex shrink-0 items-center gap-1 rounded-sm bg-accent px-2 py-1 text-xs font-bold text-foreground outline-none hover:bg-highlight focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
										aria-label={m.treatment_compare_learn_more_about({ name: row.name })}
									>
										{m.treatment_compare_learn_more()}
										<ArrowRightIcon aria-hidden="true" class="size-3" />
									</a>
								{/if}
							</div>
						</th>

						{#each durations as months (months)}
							{@const price = priceFor(row.plans, months)}
							<td
								class={[
									'border-l border-border px-3 py-3 text-center',
									months === recommended ? 'bg-accent' : ''
								]}
							>
								{#if price}
									<span class="block font-display text-lg font-bold text-foreground xl:text-2xl">
										{formatPrice(price)}
									</span>
									<span class="mt-0.5 block text-xs text-muted-foreground">
										{m.treatment_per_month_suffix()}
									</span>
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
		</div>
	</div>

	<!--
		The same data below `lg`, as the narrow artboard draws it: one card per treatment, its
		four durations in a two-by-two grid.

		Deliberately not a table. Without the width to keep the columns apart, the header
		association a table provides is worth less than the confusion of a table that wraps, so
		each card names its own treatment in a heading and each cell names its own duration.
	-->
	<div class="mt-6 grid gap-3 lg:hidden">
		{#each rows as row (row.slug)}
			<div class="rounded-lg border border-border bg-card p-4">
				<!--
					No link and no current-page label here, which is what the narrow artboard draws.
					Each card is a price at a glance, and a chip beside a wrapping product name cost
					more room than it earned. The dropdown is how a phone moves between treatments.
				-->
				<div class="flex items-center gap-3">
					{#if row.photo}
						<img
							src={row.photo.picture.src}
							srcset={row.photo.picture.srcset}
							alt=""
							aria-hidden="true"
							sizes="48px"
							class="size-12 shrink-0 rounded-md object-cover"
						/>
					{:else}
						<span class="size-12 shrink-0 rounded-md bg-secondary" aria-hidden="true"></span>
					{/if}

					<div class="min-w-0 flex-1">
						<h3 class="font-display text-base font-semibold text-foreground">{row.name}</h3>
						<p class="mt-0.5 text-xs text-muted-foreground">{row.formLabel}</p>
					</div>
				</div>

				<dl class="mt-3 grid grid-cols-2 gap-2">
					{#each durations as months (months)}
						{@const price = priceFor(row.plans, months)}
						{#if price}
							<div
								class={['rounded-md p-2.5', months === recommended ? 'bg-accent' : 'bg-secondary']}
							>
								<dt class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
									{m.treatment_compare_months({ months })}
								</dt>
								<dd class="mt-0.5 font-display text-base font-bold text-foreground">
									{m.treatment_compare_per_month({ price: formatPrice(price) })}
								</dd>
							</div>
						{/if}
					{/each}
				</dl>
			</div>
		{/each}
	</div>
</section>
