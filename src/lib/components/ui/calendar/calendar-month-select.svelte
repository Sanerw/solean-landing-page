<script lang="ts">
	import { Calendar as CalendarPrimitive } from "bits-ui";
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		value,
		onchange,
		...restProps
	}: WithoutChildrenOrChild<CalendarPrimitive.MonthSelectProps> = $props();
</script>

<span
	class={cn(
		"relative flex rounded-sm border border-border bg-secondary transition-colors hover:bg-accent has-focus:ring-[3px] has-focus:ring-ring/40",
		className
	)}
>
	<CalendarPrimitive.MonthSelect
		bind:ref
		class="absolute inset-0 cursor-pointer opacity-0"
		{...restProps}
	>
		{#snippet child({ props, monthItems, selectedMonthItem })}
			<select {...props} {value} {onchange}>
				{#each monthItems as monthItem (monthItem.value)}
					<option
						value={monthItem.value}
						selected={value !== undefined
							? monthItem.value === value
							: monthItem.value === selectedMonthItem.value}
					>
						{monthItem.label}
					</option>
				{/each}
			</select>
			<span
				class="flex h-(--cell-size) min-w-14 items-center justify-between gap-1 rounded-sm px-2 text-xs font-semibold select-none [&>svg]:size-3.5 [&>svg]:text-muted-foreground"
				aria-hidden="true"
			>
				{monthItems.find((item) => item.value === value)?.label || selectedMonthItem.label}
				<ChevronDownIcon />
			</span>
		{/snippet}
	</CalendarPrimitive.MonthSelect>
</span>
