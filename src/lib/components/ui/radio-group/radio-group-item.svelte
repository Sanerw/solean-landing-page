<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<RadioGroupPrimitive.ItemProps> = $props();
</script>

<RadioGroupPrimitive.Item
	bind:ref
	data-slot="radio-group-item"
	class={cn(
		"peer relative flex size-5 shrink-0 items-center justify-center rounded-full border border-input bg-card text-primary-foreground outline-none transition-[color,box-shadow,border-color,background-color] after:absolute after:-inset-2 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive data-checked:border-primary data-checked:bg-primary aria-invalid:data-checked:border-destructive disabled:cursor-not-allowed disabled:opacity-50 group-aria-invalid/radio-group:border-destructive group-aria-invalid/radio-group:focus-visible:ring-destructive",
		className
	)}
	{...restProps}
>
	{#snippet children({ checked })}
		<div data-slot="radio-group-indicator" class="flex items-center justify-center">
			{#if checked}
				<span class="size-2 rounded-full bg-primary-foreground"></span>
			{/if}
		</div>
	{/snippet}
</RadioGroupPrimitive.Item>
