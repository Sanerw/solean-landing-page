<script lang="ts">
	import { m } from '$lib/paraglide/messages';

	interface Props {
		id: string;
		heading: string;
		/** Names the table for assistive technology; the visible heading is above it. */
		caption: string;
		columns: readonly string[];
		rows: readonly { label: string; cells: readonly string[] }[];
	}

	let { id, heading, caption, columns, rows }: Props = $props();
</script>

<section {id} class="scroll-mt-8" aria-labelledby="{id}-title">
	<h2
		id="{id}-title"
		class="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
	>
		{heading}
	</h2>

	<!-- The frame clips the corners off the dark header, so the radius belongs to the wrapper
	     and the scroll does too: a three-column comparison does not fit 390px. -->
	<div class="mt-6 overflow-x-auto rounded-md border border-border">
		<table class="w-full min-w-lg border-collapse text-left text-sm">
			<caption class="sr-only">{caption}</caption>
			<thead class="bg-foreground text-background">
				<tr>
					<!-- Blank by design, as drawn: the row headers below name each attribute, so a
					     column head here would label the labels. The caption carries the table's
					     name for assistive tech. -->
					<th scope="col" class="border-r border-background/15 px-6 py-4 font-semibold">
						<span class="sr-only">{m.learn_table_attribute()}</span>
					</th>
					{#each columns as column, index (index)}
						<th
							scope="col"
							class={[
								'px-6 py-4 font-semibold',
								index < columns.length - 1 && 'border-r border-background/15'
							]}
						>
							{column}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each rows as row (row.label)}
					<tr class="border-t border-border first:border-t-0 odd:bg-secondary">
						<th
							scope="row"
							class="border-r border-border px-6 py-4 font-semibold text-muted-foreground"
						>
							{row.label}
						</th>
						{#each row.cells as cell, index (index)}
							<td
								class={[
									'px-6 py-4 text-muted-foreground',
									index < row.cells.length - 1 && 'border-r border-border'
								]}
							>
								{cell}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
