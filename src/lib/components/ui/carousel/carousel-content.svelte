<script lang="ts">
	import emblaCarouselSvelte from "embla-carousel-svelte";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import { getEmblaContext } from "./context.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();

	const emblaCtx = getEmblaContext("<Carousel.Content/>");
</script>

<div
	data-slot="carousel-content"
	class="overflow-hidden"
	use:emblaCarouselSvelte={{
		options: {
			container: "[data-embla-container]",
			slides: "[data-embla-slide]",
			...emblaCtx.options,
			axis: emblaCtx.orientation === "horizontal" ? "x" : "y",
		},
		plugins: emblaCtx.plugins,
	}}
	onemblaInit={emblaCtx.onInit}
>
	<!--
		`will-change-transform` is this project's addition to the registry component, and it is
		the difference between a carousel that drags and one that stutters on a phone. Embla
		rewrites this element's `translate3d` on every pointer move; without the hint Chrome
		re-rasterises the slides each time instead of moving one composited layer. Measured at
		390x844 and dpr 3 over one drag: the testimonials carousel fell from 872 raster tasks
		and 1256ms to 7 and 8ms, the clinical team from 912 and 443ms to 6 and 4ms, the bento
		from 294 and 216ms to 11 and 2ms. The layer it keeps promoted costs nothing on the way
		down the page: full-page scroll rasterises the same 97 tasks either way.
	-->
	<div
		bind:this={ref}
		class={cn(
			"flex will-change-transform",
			emblaCtx.orientation === "horizontal" ? "-ms-4" : "-mt-4 flex-col",
			className
		)}
		data-embla-container=""
		{...restProps}
	>
		{@render children?.()}
	</div>
</div>
