<script lang="ts">
	import { NavigationMenu as NavigationMenuPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: NavigationMenuPrimitive.LinkProps = $props();
</script>

<!-- Same base and dark-surface treatment as Trigger, so a plain nav link (Home, About
     Us) and a dropdown trigger (Treatments) read as one visual family. -->
<NavigationMenuPrimitive.Link
	bind:ref
	data-slot="navigation-menu-link"
	class={cn(
		"flex items-center gap-1.5 rounded-full p-3 text-sm font-medium text-foreground outline-none transition-colors",
		"hover:bg-accent focus:bg-accent data-active:bg-accent data-active:text-accent-foreground",
		"focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
		"in-data-[slot=navigation-menu-content]:rounded-2xl in-data-[slot=navigation-menu-content]:p-3",
		"[&_svg:not([class*='size-'])]:size-4",
		"group-data-[surface=dark]/navigation-menu:text-background",
		"group-data-[surface=dark]/navigation-menu:hover:bg-background group-data-[surface=dark]/navigation-menu:hover:text-foreground",
		"group-data-[surface=dark]/navigation-menu:focus:bg-background group-data-[surface=dark]/navigation-menu:focus:text-foreground",
		"group-data-[surface=dark]/navigation-menu:focus-visible:ring-primary group-data-[surface=dark]/navigation-menu:focus-visible:ring-offset-foreground",
		className
	)}
	{...restProps}
/>
