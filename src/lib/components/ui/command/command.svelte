<script lang="ts">
	import { Command as CommandPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		value = $bindable(""),
		class: className,
		...restProps
	}: CommandPrimitive.RootProps = $props();
</script>

<!--
	The vendor default is a command palette on its own surface. This one always sits inside a
	Popover that already draws the surface, so the root contributes layout only and leaves the
	ground, the radius and the shadow to its host.
-->
<CommandPrimitive.Root
	bind:ref
	bind:value
	data-slot="command"
	class={cn("flex w-full flex-col overflow-hidden", className)}
	{...restProps}
/>
