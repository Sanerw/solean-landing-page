<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from "bits-ui";
	import CheckIcon from '@lucide/svelte/icons/check';
	import MinusIcon from '@lucide/svelte/icons/minus';
	import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		checked = $bindable(false),
		indeterminate = $bindable(false),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<CheckboxPrimitive.RootProps> = $props();
</script>

<CheckboxPrimitive.Root
	bind:ref
	data-slot="checkbox"
	class={cn(
		"peer relative flex size-5 shrink-0 items-center justify-center rounded-xs border border-input bg-card text-primary-foreground outline-none transition-[color,box-shadow,border-color,background-color] after:absolute after:-inset-2 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive data-checked:border-primary data-checked:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary aria-invalid:data-checked:border-destructive aria-invalid:data-[state=indeterminate]:border-destructive disabled:cursor-not-allowed disabled:opacity-50 group-has-disabled/field:opacity-50",
		className
	)}
	bind:checked
	bind:indeterminate
	{...restProps}
>
	{#snippet children({ checked, indeterminate })}
		<div
			data-slot="checkbox-indicator"
			class="grid place-content-center text-current transition-none [&>svg]:size-3.5"
		>
			{#if checked}
				<CheckIcon />
			{:else if indeterminate}
				<MinusIcon />
			{/if}
		</div>
	{/snippet}
</CheckboxPrimitive.Root>
