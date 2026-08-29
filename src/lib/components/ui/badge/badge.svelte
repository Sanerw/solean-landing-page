<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	export const badgeVariants = tv({
		base: [
			"group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap",
			"h-5 rounded-sm border border-transparent px-2 py-0.5",
			"font-sans text-xs font-medium transition-colors",
			"focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
			"[&>svg]:pointer-events-none [&>svg]:size-3!",
		],
		variants: {
			variant: {
				// INJECTION on green accent and TABLET on gold highlight sit side by side
				// in the treatment-preference reference; those two are the primary pairing.
				accent: "bg-accent text-accent-foreground",
				highlight: "bg-highlight text-highlight-foreground",
				secondary: "bg-secondary text-secondary-foreground",
				// Provisional, in line with the rest of the destructive family.
				destructive: "bg-destructive text-destructive-foreground",
			},
		},
		defaultVariants: {
			variant: "accent",
		},
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
</script>

<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAnchorAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = "accent",
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		variant?: BadgeVariant;
	} = $props();
</script>

<svelte:element
	this={href ? "a" : "span"}
	bind:this={ref}
	data-slot="badge"
	{href}
	class={cn(badgeVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
