<script lang="ts">
	import { Label } from "$lib/components/ui/label/index.js";
	import { cn } from "$lib/utils.js";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ComponentProps<typeof Label> = $props();
</script>

<!--
	Two roles share this element. A bare label ("FIRST NAME") takes compact eyebrow
	typography scaled down from the larger reference artboards.
	An option-card label (radio or checkbox choice) wraps a nested Field instead,
	and every artboard draws those choices in sentence case, so the eyebrow classes
	are scoped with not-has-*: text-transform and letter-spacing inherit, and left
	unscoped they reached the nested title and description.
-->
<Label
	bind:ref
	data-slot="field-label"
	class={cn(
		"gap-2 leading-snug group-data-[disabled=true]/field:opacity-50",
		"not-has-[>[data-slot=field]]:text-xs not-has-[>[data-slot=field]]:font-semibold",
		"not-has-[>[data-slot=field]]:tracking-widest not-has-[>[data-slot=field]]:uppercase",
		"not-has-[>[data-slot=field]]:text-muted-foreground",
		"has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col",
		"has-[>[data-slot=field]]:cursor-pointer has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border",
		"has-[>[data-slot=field]]:border-border has-[>[data-slot=field]]:bg-card *:data-[slot=field]:p-4",
		"has-[>[data-slot=field]]:has-data-checked:border-primary has-[>[data-slot=field]]:has-data-checked:bg-surface-subtle",
		"flex w-fit",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</Label>
