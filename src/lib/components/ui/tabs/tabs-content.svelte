<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";
	import { getTabsIdContext, tabsIds } from "./context.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: TabsPrimitive.ContentProps = $props();

	const uid = getTabsIdContext();
	const ids = $derived(tabsIds(uid, restProps.value));
</script>

<!-- bits-ui makes this tabindex=0 (a panel with no focusable child is still a real
     keyboard stop), so it needs its own visible focus ring rather than the vendor's
     bare outline-none. -->
<TabsPrimitive.Content
	bind:ref
	data-slot="tabs-content"
	id={ids?.panel}
	aria-labelledby={ids?.trigger}
	class={cn(
		"flex-1 rounded-md text-sm outline-none",
		"focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
		className
	)}
	{...restProps}
/>
