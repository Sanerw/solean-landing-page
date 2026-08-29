<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...props
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<!--
	The vendor default is a translucent 36px pill, a different control language than
	Input. This inherits Input's own box instead: h-14, rounded-md, border-input,
	bg-card. Focus and invalid state key off the nested control via data-slot and
	aria-invalid, so the ring wraps the whole group rather than competing with a
	child border.
-->
<div
	bind:this={ref}
	data-slot="input-group"
	role="group"
	class={cn(
		"group/input-group relative flex h-14 w-full min-w-0 items-center rounded-md border border-input bg-card outline-none transition-[color,box-shadow,border-color]",
		"has-[>textarea]:h-auto has-[>textarea]:items-start",
		"has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-ring has-[[data-slot=input-group-control]:focus-visible]:ring-offset-2 has-[[data-slot=input-group-control]:focus-visible]:ring-offset-background",
		"has-[[data-slot=input-group-control][aria-invalid=true]]:border-destructive has-[[data-slot=input-group-control][aria-invalid=true]:focus-visible]:ring-destructive",
		"has-[[data-slot=input-group-control]:disabled]:pointer-events-none has-[[data-slot=input-group-control]:disabled]:cursor-not-allowed has-[[data-slot=input-group-control]:disabled]:bg-muted has-[[data-slot=input-group-control]:disabled]:opacity-50",
		"has-[>[data-align=inline-start]]:[&>input]:pl-1.5 has-[>[data-align=inline-end]]:[&>input]:pr-1.5",
		className
	)}
	{...props}
>
	{@render children?.()}
</div>
