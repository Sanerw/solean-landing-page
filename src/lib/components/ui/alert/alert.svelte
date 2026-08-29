<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	// Three concrete reference surfaces: the delivery banner (accent green), the
	// projection callout (highlight gold), and contraindication warnings
	// (the provisional destructive family, used here on a light wash rather than
	// the saturated fill, since this is a surface, not a button).
	export const alertVariants = tv({
		base: "group/alert relative grid w-full gap-0.5 rounded-lg border px-4 py-3 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
		variants: {
			variant: {
				default: "border-transparent bg-accent text-accent-foreground",
				highlighted: "border-transparent bg-highlight text-foreground",
				destructive: "border-destructive/30 bg-destructive/10 text-destructive-text",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type AlertVariant = VariantProps<typeof alertVariants>["variant"];
</script>

<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		variant = "default",
		role,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		variant?: AlertVariant;
		/**
		 * Unset by default: static information (delivery estimate, projection
		 * callout) is not a live-region event. Pass "status" for non-urgent runtime
		 * feedback or "alert" for urgent feedback that must interrupt.
		 */
		role?: "status" | "alert";
	} = $props();
</script>

<div bind:this={ref} data-slot="alert" {role} class={cn(alertVariants({ variant }), className)} {...restProps}>
	{@render children?.()}
</div>
