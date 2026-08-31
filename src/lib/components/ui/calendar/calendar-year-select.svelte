<script lang="ts">
	import { Calendar as CalendarPrimitive } from "bits-ui";
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		value,
		...restProps
	}: WithoutChildrenOrChild<CalendarPrimitive.YearSelectProps> = $props();
</script>

<span
	class={cn(
		"relative flex rounded-sm border border-border bg-secondary transition-colors hover:bg-accent has-focus:ring-[3px] has-focus:ring-ring/40",
		className
	)}
>
	<CalendarPrimitive.YearSelect
		bind:ref
		class="absolute inset-0 cursor-pointer opacity-0"
		{...restProps}
	>
		{#snippet child({ props, yearItems, selectedYearItem })}
			<select {...props} {value}>
				{#each yearItems as yearItem (yearItem.value)}
					<option
						value={yearItem.value}
						selected={value !== undefined
							? yearItem.value === value
							: yearItem.value === selectedYearItem.value}
					>
						{yearItem.label}
					</option>
				{/each}
			</select>
			<span
				class="flex h-(--cell-size) min-w-16 items-center justify-between gap-1 rounded-sm px-2 text-xs font-semibold tabular-nums select-none [&>svg]:size-3.5 [&>svg]:text-muted-foreground"
				aria-hidden="true"
			>
				{yearItems.find((item) => item.value === value)?.label || selectedYearItem.label}
				<ChevronDownIcon />
			</span>
		{/snippet}
	</CalendarPrimitive.YearSelect>
</span>
