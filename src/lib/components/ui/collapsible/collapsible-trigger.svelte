<script lang="ts">
	import { Collapsible as CollapsiblePrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let { ref = $bindable(null), class: className, ...restProps }: CollapsiblePrimitive.TriggerProps = $props();
</script>

<!-- Behavior only: this project's product components (CheckoutStep and similar) supply their
     own heading, disclosure icon and section chrome. The one thing every trigger needs
     regardless of context is a visible focus ring, so that much is not left to the caller. -->
<CollapsiblePrimitive.Trigger
	bind:ref
	data-slot="collapsible-trigger"
	class={cn(
		"rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
		className
	)}
	{...restProps}
/>
