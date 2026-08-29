<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";

	export const buttonVariants = tv({
		base: [
			"group/button inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap",
			"border border-transparent font-sans font-semibold transition-colors outline-none select-none",
			// Deep green ring on a background-coloured offset. On a dark surface the ring
			// would measure 1.00:1, so those call sites pass the gold override documented
			// on the design-system showcase.
			"focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
			"active:translate-y-px motion-reduce:active:translate-y-0",
			"disabled:pointer-events-none disabled:opacity-50",
			"aria-invalid:border-destructive",
			"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		],
		variants: {
			variant: {
				// bg-primary/90 is deliberately not used: it lightens against whatever sits
				// behind it. --primary-hover is the reference's own darker gold.
				default: "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover",
				inverse: "bg-foreground text-background hover:bg-inverse-hover active:bg-inverse-active",
				secondary: "bg-secondary text-secondary-foreground hover:bg-accent active:bg-muted",
				outline: "border-border bg-transparent text-foreground hover:bg-accent active:bg-muted",
				ghost: "bg-transparent text-foreground hover:bg-accent active:bg-muted",
				link: "text-foreground underline-offset-4 hover:text-highlight-foreground hover:underline",
				destructive:
					"bg-destructive text-destructive-foreground hover:bg-destructive-hover active:bg-destructive-active",
			},
			size: {
				sm: "h-10 rounded-md px-4 text-sm",
				default: "h-12 rounded-md px-6 text-base",
				// h-17 compiles to 4.25rem = 68px, the reference's pill height.
				lg: "h-17 rounded-full px-8 text-lg",
				icon: "size-10 rounded-full",
			},
		},
		compoundVariants: [
			// A link is inline text, so it takes no button box from the size scale.
			{ variant: "link", class: "h-auto rounded-none px-0 active:translate-y-0" },
		],
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
	export type ButtonSize = VariantProps<typeof buttonVariants>["size"];

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
		};
</script>

<script lang="ts">
	let {
		class: className,
		variant = "default",
		size = "default",
		ref = $bindable(null),
		href = undefined,
		type = "button",
		disabled,
		children,
		...restProps
	}: ButtonProps = $props();
</script>

{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		href={disabled ? undefined : href}
		aria-disabled={disabled}
		role={disabled ? "link" : undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		{type}
		{disabled}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
