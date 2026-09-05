<script lang="ts">
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { HTMLTextareaAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		"data-slot": dataSlot = "textarea",
		...restProps
	}: WithoutChildren<WithElementRef<HTMLTextareaAttributes>> = $props();
</script>

<textarea
	bind:this={ref}
	data-slot={dataSlot}
	class={cn(
		"min-h-32 w-full resize-y rounded-md border border-input bg-card px-4 py-3 text-base text-foreground outline-none transition-[color,box-shadow,border-color] placeholder:text-text-faint focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/20 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 sm:text-sm",
		className
	)}
	bind:value
	{...restProps}></textarea>
