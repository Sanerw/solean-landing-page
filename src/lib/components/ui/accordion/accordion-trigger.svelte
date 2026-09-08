<script lang="ts">
	import { Accordion as AccordionPrimitive } from "bits-ui";
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import type { Snippet } from "svelte";
	import { cn, type WithoutChild } from "$lib/utils.js";

	// The indicator is a snippet with the chevron as its default, so a caller that wants the
	// artboard's plus does not have to give up the primitive's keyboard and ARIA behaviour to
	// get it. Give the icon `data-slot="accordion-trigger-icon"` and the trigger's own rules
	// place and size it.
	let {
		ref = $bindable(null),
		class: className,
		level = 3,
		children,
		icon,
		...restProps
	}: WithoutChild<AccordionPrimitive.TriggerProps> & {
		level?: AccordionPrimitive.HeaderProps["level"];
		icon?: Snippet;
	} = $props();
</script>

<AccordionPrimitive.Header {level} class="flex">
	<AccordionPrimitive.Trigger
		data-slot="accordion-trigger"
		bind:ref
		class={cn(
			"group/accordion-trigger relative flex flex-1 items-start justify-between gap-6 rounded-md border border-transparent p-4 text-left",
			"font-sans text-base font-medium transition-colors outline-none",
			// Hover reuses accent; the design system adds no accordion-specific hover token.
			"hover:bg-accent",
			"focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
			"disabled:pointer-events-none disabled:opacity-50",
			"**:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-5 **:data-[slot=accordion-trigger-icon]:text-muted-foreground",
			className
		)}
		{...restProps}
	>
		{@render children?.()}
		{#if icon}
			{@render icon()}
		{:else}
			<ChevronDownIcon
				data-slot="accordion-trigger-icon"
				class="pointer-events-none shrink-0 transition-transform duration-200 group-aria-expanded/accordion-trigger:rotate-180 motion-reduce:transition-none"
			/>
		{/if}
	</AccordionPrimitive.Trigger>
</AccordionPrimitive.Header>
