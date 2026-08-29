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
	Two roles share this element. A bare label ("FIRST NAME") takes the eyebrow
	typography directly, matching the reference's uppercase field labels. An
	option-card label (radio or checkbox choice) wraps a nested Field instead of
	text, so the eyebrow classes have nothing to apply to and the has-[>[data-slot=field]]
	branch below takes over, matching the option-card treatment already established
	in ChoiceControlsSection.
-->
<Label
	bind:ref
	data-slot="field-label"
	class={cn(
		"gap-2 text-xs font-semibold tracking-widest text-foreground uppercase",
		"leading-snug group-data-[disabled=true]/field:opacity-50",
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
