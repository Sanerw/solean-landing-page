<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { getEmblaContext } from "./context.js";

	let {
		class: className,
		label = "Choose a slide",
	}: { class?: string; label?: string } = $props();

	const emblaCtx = getEmblaContext("<Carousel.Dots/>");
</script>

<!--
	One dot per slide, all the same size. The reference stretches its active dot into a pill;
	that is rejected here because size then carries the selected state and colour alone has
	to be enough for anyone who cannot compare widths at 6px.
	The dot itself stays at the reference's 6px while `before` expands the pressable area to
	the 24px minimum without changing the row's geometry.
-->
<div class={cn("flex items-center justify-center gap-2", className)} role="tablist" aria-label={label}>
	{#each emblaCtx.scrollSnaps as _, index (index)}
		<button
			type="button"
			role="tab"
			aria-label="Slide {index + 1}"
			aria-selected={index === emblaCtx.selectedIndex}
			onclick={() => emblaCtx.scrollTo(index)}
			class={cn(
				"relative size-1.5 rounded-full outline-none transition-colors",
				"before:absolute before:-inset-2 before:content-['']",
				"focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
				index === emblaCtx.selectedIndex ? "bg-foreground" : "bg-surface-tint"
			)}
		></button>
	{/each}
</div>
