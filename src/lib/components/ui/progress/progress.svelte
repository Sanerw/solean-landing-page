<script lang="ts">
	import { Progress as ProgressPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		max = 100,
		value,
		...restProps
	}: WithoutChildrenOrChild<ProgressPrimitive.RootProps> = $props();
</script>

<!--
	surface-warm is the reference's own gutter tint (its other documented role is chart
	gridlines, the same "thin inert track" job). The indicator position is a calculated
	percentage, not a hardcoded pixel: the visual-value restriction exempts data-driven
	geometry like this.
-->
<ProgressPrimitive.Root
	bind:ref
	data-slot="progress"
	class={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-surface-warm", className)}
	{value}
	{max}
	{...restProps}
>
	<div
		data-slot="progress-indicator"
		class="h-full flex-1 rounded-full bg-primary transition-all"
		style="transform: translateX(-{100 - (100 * (value ?? 0)) / (max ?? 1)}%)"
	></div>
</ProgressPrimitive.Root>
