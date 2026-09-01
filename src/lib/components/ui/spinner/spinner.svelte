<script lang="ts">
	import Loader2Icon from "@lucide/svelte/icons/loader-2";
	import { cn } from "$lib/utils.js";
	import type { SVGAttributes } from "svelte/elements";

	let {
		class: className,
		role = "status",
		// we add name, color, and stroke for compatibility with different icon libraries props
		name,
		color,
		stroke,
		"aria-label": ariaLabel = "Loading",
		...restProps
	}: SVGAttributes<SVGSVGElement> = $props();
</script>

<!--
	`motion-reduce:animate-none` is this project's addition to the registry component. Every
	other animated primitive here carries the guard, and a spinner is the one that never stops
	on its own, so a caller must pair it with text rather than rely on the motion alone.
-->
<Loader2Icon
	{role}
	name={name === null ? undefined : name}
	color={color === null ? undefined : color}
	stroke={stroke === null ? undefined : stroke}
	aria-label={ariaLabel}
	class={cn("size-4 animate-spin motion-reduce:animate-none", className)}
	{...restProps}
/>
