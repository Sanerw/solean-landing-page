<script lang="ts" module>
	import { tv, type VariantProps } from "tailwind-variants";

	// Compact, so it takes the pill treatment already documented for small round
	// controls (design-system.md radii: rounded-full for pills) rather than the
	// vendor's undocumented rounded-4xl.
	const inputGroupButtonVariants = tv({
		base: "gap-2 rounded-full text-sm flex items-center shadow-none",
		variants: {
			size: {
				xs: "h-6 gap-1 px-2 [&>svg:not([class*='size-'])]:size-3.5",
				sm: "h-8 gap-1.5 px-3",
				"icon-xs": "size-6 p-0 has-[>svg]:p-0",
				"icon-sm": "size-8 p-0 has-[>svg]:p-0",
			},
		},
		defaultVariants: {
			size: "xs",
		},
	});

	export type InputGroupButtonSize = VariantProps<typeof inputGroupButtonVariants>["size"];
</script>

<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		children,
		type = "button",
		variant = "ghost",
		size = "xs",
		...restProps
	}: Omit<ComponentProps<typeof Button>, "href" | "size"> & {
		size?: InputGroupButtonSize;
	} = $props();
</script>

<Button
	bind:ref
	{type}
	data-size={size}
	{variant}
	class={cn(inputGroupButtonVariants({ size }), className)}
	{...restProps}
>
	{@render children?.()}
</Button>
