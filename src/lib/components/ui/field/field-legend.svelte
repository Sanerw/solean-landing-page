<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		variant = "legend",
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLLegendElement>> & {
		variant?: "legend" | "label";
	} = $props();
</script>

<legend
	bind:this={ref}
	data-slot="field-legend"
	data-variant={variant}
	class={cn(
		"mb-3 text-foreground data-[variant=label]:text-sm data-[variant=label]:font-medium",
		"data-[variant=legend]:font-display data-[variant=legend]:text-xl data-[variant=legend]:font-semibold",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</legend>
