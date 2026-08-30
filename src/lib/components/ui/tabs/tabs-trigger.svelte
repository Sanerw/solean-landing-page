<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";
	import { getTabsIdContext, tabsIds } from "./context.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: TabsPrimitive.TriggerProps = $props();

	const uid = getTabsIdContext();
	const ids = $derived(tabsIds(uid, restProps.value));
</script>

<!-- id and aria-controls come first so a call site can still override them. -->
<TabsPrimitive.Trigger
	bind:ref
	data-slot="tabs-trigger"
	id={ids?.trigger}
	aria-controls={ids?.panel}
	class={cn(
		"relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-2 rounded-full",
		"border border-transparent! px-4 py-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors",
		"group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start group-data-[orientation=vertical]/tabs:rounded-2xl group-data-[orientation=vertical]/tabs:px-3 group-data-[orientation=vertical]/tabs:py-1.5",
		"[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
		"hover:text-foreground",
		"focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
		"disabled:pointer-events-none disabled:opacity-50",
		// "default" list: the active trigger becomes a solid card pill, matching the projection
		// reference's white segment on the muted track.
		"group-data-[variant=default]/tabs-list:data-active:bg-card group-data-[variant=default]/tabs-list:data-active:text-foreground group-data-[variant=default]/tabs-list:data-active:font-semibold group-data-[variant=default]/tabs-list:data-active:shadow-sm",
		// "line" list: no fill, an underline bar instead.
		"group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:border-transparent group-data-[variant=line]/tabs-list:px-1 group-data-[variant=line]/tabs-list:pb-3",
		"group-data-[variant=line]/tabs-list:data-active:text-foreground group-data-[variant=line]/tabs-list:data-active:font-semibold",
		"after:absolute after:bg-primary after:opacity-0 after:transition-opacity",
		"group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-[-1px] group-data-[orientation=horizontal]/tabs:after:h-0.5",
		"group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5",
		"group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
		className
	)}
	{...restProps}
/>
