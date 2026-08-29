<script lang="ts" module>
	import { tv, type VariantProps } from "tailwind-variants";

	// "default" matches the projection reference: a pill-shaped muted track with a
	// solid white pill under the active tab. "line" is a real, separately useful
	// tabs style (an underlined list, no track) kept for a future feature that needs
	// it, adapted to the same tokens rather than left half-finished.
	export const tabsListVariants = tv({
		base: "group/tabs-list inline-flex w-fit items-center justify-center text-muted-foreground group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col",
		variants: {
			variant: {
				default: "h-9 rounded-full bg-muted p-1 group-data-[orientation=vertical]/tabs:rounded-2xl",
				line: "gap-1 border-b border-border bg-transparent",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type TabsListVariant = VariantProps<typeof tabsListVariants>["variant"];
</script>

<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		variant = "default",
		class: className,
		...restProps
	}: TabsPrimitive.ListProps & {
		variant?: TabsListVariant;
	} = $props();
</script>

<TabsPrimitive.List
	bind:ref
	data-slot="tabs-list"
	data-variant={variant}
	class={cn(tabsListVariants({ variant }), className)}
	{...restProps}
/>
