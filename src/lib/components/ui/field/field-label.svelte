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
	Two roles share this element. A bare label ("FIRST NAME") takes the field-label
	micro-type: 12px semibold, uppercase, tracking 1px, `--muted-foreground`.
	`design-system.md` section 2 measured 14px off the artboards, which is also what
	the export draws; 12px is the size chosen at review, so the label sits below the
	16px option text rather than beside it. Update that section when it is next
	touched.
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
		// A refused card carries the same red border a refused input does. Read off the control
		// inside rather than passed in, so every card that already sets `aria-invalid` on its
		// radio or checkbox gets it without plumbing. Listed after the checked pair, which it
		// ties with on specificity: an answer can be both chosen and refused, and "none of these
		// plus a diagnosis" is exactly that case.
		"has-[>[data-slot=field]]:has-[[aria-invalid=true]]:border-destructive",
		"flex w-fit",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</Label>
