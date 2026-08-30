<script lang="ts" module>
	import { tv } from "tailwind-variants";

	// Compact navigation keeps the app's established 14 px rhythm. On photography,
	// the active treatment uses a translucent wash so it remains connected to the hero.
	export const navigationMenuTriggerStyle = tv({
		base: [
			"group/navigation-menu-trigger inline-flex h-9 w-max items-center justify-center",
			"rounded-full px-4.5 py-2.5 text-sm font-medium text-foreground outline-none transition-colors",
			"hover:bg-accent focus:bg-accent data-open:bg-accent data-open:text-accent-foreground",
			"focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
			"disabled:pointer-events-none disabled:opacity-50",
			"group-data-[surface=dark]/navigation-menu:text-background",
			"group-data-[surface=dark]/navigation-menu:hover:bg-background/10 group-data-[surface=dark]/navigation-menu:hover:text-background",
			"group-data-[surface=dark]/navigation-menu:focus:bg-background/10 group-data-[surface=dark]/navigation-menu:focus:text-background",
			"group-data-[surface=dark]/navigation-menu:data-open:bg-background/10 group-data-[surface=dark]/navigation-menu:data-open:text-background",
			"group-data-[surface=dark]/navigation-menu:focus-visible:ring-primary group-data-[surface=dark]/navigation-menu:focus-visible:ring-offset-foreground",
		],
	});
</script>

<script lang="ts">
	import { NavigationMenu as NavigationMenuPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: NavigationMenuPrimitive.TriggerProps = $props();
</script>

<NavigationMenuPrimitive.Trigger
	bind:ref
	data-slot="navigation-menu-trigger"
	class={cn(navigationMenuTriggerStyle(), "group", className)}
	{...restProps}
>
	{@render children?.()}
	<ChevronDownIcon
		class="relative top-px ml-1 size-3 transition duration-300 group-data-open/navigation-menu-trigger:rotate-180"
		aria-hidden="true"
	/>
</NavigationMenuPrimitive.Trigger>
