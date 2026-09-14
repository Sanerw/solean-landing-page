<script lang="ts">
	import { Command as CommandPrimitive } from "bits-ui";
	import SearchIcon from '@lucide/svelte/icons/search';
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		value = $bindable(""),
		class: className,
		...restProps
	}: CommandPrimitive.InputProps = $props();
</script>

<div class="mb-1.5 flex h-10 items-center gap-2 border-b border-border px-2 pb-2" data-slot="command-input-wrapper">
	<SearchIcon class="size-4 shrink-0 text-text-faint" aria-hidden="true" />
	<CommandPrimitive.Input
		bind:ref
		bind:value
		data-slot="command-input"
		class={cn(
			"flex h-9 w-full bg-transparent text-base outline-hidden placeholder:text-text-faint disabled:cursor-not-allowed disabled:opacity-50",
			className
		)}
		{...restProps}
	/>
</div>
