<script lang="ts">
	import { Command as CommandPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: CommandPrimitive.ItemProps = $props();
</script>

<!-- The Select item's own geometry and states, so one list does not read as two designs. -->
<CommandPrimitive.Item
	bind:ref
	data-slot="command-item"
	class={cn(
		"relative flex w-full cursor-default items-center gap-2 rounded-sm px-3 py-2.5 text-base outline-hidden select-none data-selected:bg-accent data-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
		className
	)}
	{...restProps}
/>
