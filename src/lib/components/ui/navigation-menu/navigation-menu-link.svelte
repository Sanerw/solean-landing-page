<script lang="ts">
	import { NavigationMenu as NavigationMenuPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: NavigationMenuPrimitive.LinkProps = $props();
</script>

<!-- Top-level links share Trigger's compact geometry. Dropdown links use natural
     content height so richer product rows stay readable without dominating the header. -->
<NavigationMenuPrimitive.Link
	bind:ref
	data-slot="navigation-menu-link"
	class={cn(
		"flex h-9 items-center gap-1.5 rounded-full px-4.5 py-2.5 text-sm font-medium text-foreground outline-none transition-colors",
		"hover:bg-accent focus:bg-accent data-active:bg-accent data-active:text-accent-foreground",
		"focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
		"in-data-[slot=navigation-menu-content]:h-auto in-data-[slot=navigation-menu-content]:rounded-2xl in-data-[slot=navigation-menu-content]:p-3 in-data-[slot=navigation-menu-content]:tracking-normal",
		"[&_svg:not([class*='size-'])]:size-4",
		"group-data-[surface=dark]/navigation-menu:text-background",
		"group-data-[surface=dark]/navigation-menu:hover:bg-background/10 group-data-[surface=dark]/navigation-menu:hover:text-background",
		"group-data-[surface=dark]/navigation-menu:focus:bg-background/10 group-data-[surface=dark]/navigation-menu:focus:text-background",
		"group-data-[surface=dark]/navigation-menu:focus-visible:ring-primary group-data-[surface=dark]/navigation-menu:focus-visible:ring-offset-foreground",
		className
	)}
	{...restProps}
/>
