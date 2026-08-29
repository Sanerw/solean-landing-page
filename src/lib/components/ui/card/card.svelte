<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		size = "default",
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & { size?: "default" | "sm" } = $props();
</script>

<div
	bind:this={ref}
	data-slot="card"
	data-size={size}
	class={cn(
		"group/card flex flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground",
		// The reference builds cards on a hairline border, not a drop shadow.
		// Static cards get no hover treatment; interactive call sites add their own.
		"gap-(--card-spacing) py-(--card-spacing) text-sm [--card-spacing:--spacing(6)] data-[size=sm]:[--card-spacing:--spacing(4)]",
		"has-[>img:first-child]:pt-0 *:[img:first-child]:rounded-t-lg *:[img:last-child]:rounded-b-lg",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
