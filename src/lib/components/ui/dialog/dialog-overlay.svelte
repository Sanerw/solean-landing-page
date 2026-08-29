<script lang="ts">
	import { Dialog as DialogPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: DialogPrimitive.OverlayProps = $props();
</script>

<DialogPrimitive.Overlay
	bind:ref
	data-slot="dialog-overlay"
	class={cn(// A neutral black scrim reads cold over the warm sand ground, so the veil is
	// the deep green foreground at low alpha.
	"fixed inset-0 isolate z-50 bg-foreground/30 duration-100 supports-backdrop-filter:backdrop-blur-sm",
	"data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
	"motion-reduce:animate-none motion-reduce:duration-0", className)}
	{...restProps}
/>
