<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";
	import { setTabsIdContext } from "./context.js";

	let {
		ref = $bindable(null),
		value = $bindable(""),
		class: className,
		...restProps
	}: TabsPrimitive.RootProps = $props();

	// One id per root, so two tab sets on a page cannot collide. $props.id() has to be a
	// plain variable initializer, hence the two lines.
	const uid = $props.id();
	setTabsIdContext(uid);
</script>

<TabsPrimitive.Root
	bind:ref
	bind:value
	data-slot="tabs"
	class={cn("group/tabs flex gap-2 data-[orientation=horizontal]:flex-col", className)}
	{...restProps}
/>
