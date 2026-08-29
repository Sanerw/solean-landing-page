<script lang="ts" module>
	import { tv, type VariantProps } from "tailwind-variants";

	// Only inline-start and inline-end are adapted: nothing in this project stacks
	// an addon above or below the control, so block-start/block-end stay out until
	// a feature genuinely needs them.
	export const inputGroupAddonVariants = tv({
		base: "h-full gap-2 text-sm font-medium text-muted-foreground group-data-[disabled=true]/input-group:opacity-50 [&>svg:not([class*='size-'])]:size-4 flex cursor-text items-center justify-center select-none",
		variants: {
			align: {
				"inline-start": "pl-4 order-first",
				"inline-end": "pr-4 order-last",
			},
		},
		defaultVariants: {
			align: "inline-start",
		},
	});

	export type InputGroupAddonAlign = VariantProps<typeof inputGroupAddonVariants>["align"];
</script>

<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		align = "inline-start",
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		align?: InputGroupAddonAlign;
	} = $props();
</script>

<div
	bind:this={ref}
	role="group"
	data-slot="input-group-addon"
	data-align={align}
	class={cn(inputGroupAddonVariants({ align }), className)}
	onclick={(e) => {
		if ((e.target as HTMLElement).closest("button")) {
			return;
		}
		e.currentTarget.parentElement?.querySelector("input")?.focus();
	}}
	{...restProps}
>
	{@render children?.()}
</div>
