<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from "svelte/elements";

	type InputType = Exclude<HTMLInputTypeAttribute, "file">;

	type Props = WithElementRef<
		Omit<HTMLInputAttributes, "type"> &
			({ type: "file"; files?: FileList } | { type?: InputType; files?: undefined })
	>;

	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		files = $bindable(),
		class: className,
		"data-slot": dataSlot = "input",
		...restProps
	}: Props = $props();
</script>

{#if type === "file"}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(
			"h-12 w-full min-w-0 rounded-md border border-border bg-card px-4 py-3 text-base text-foreground outline-none transition-[color,box-shadow,border-color] file:mr-4 file:inline-flex file:h-10 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-text-faint focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50",
			className
		)}
		type="file"
		bind:files
		bind:value
		{...restProps}
	/>
{:else}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(
			"h-12 w-full min-w-0 rounded-md border border-border bg-card px-4 py-3 text-base text-foreground outline-none transition-[color,box-shadow,border-color] file:mr-4 file:inline-flex file:h-10 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-text-faint focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50",
			className
		)}
		{type}
		bind:value
		{...restProps}
	/>
{/if}
