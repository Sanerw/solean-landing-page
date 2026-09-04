<script lang="ts">
	import { Field, FieldContent, FieldLabel, FieldTitle } from '$lib/components/ui/field';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { m } from '$lib/paraglide/messages';
	import { choiceItems } from '../definition/kinds';
	import type { FieldProps } from '../definition/field-props';
	import OtherTextInput from './OtherTextInput.svelte';

	let {
		question,
		options,
		controlId,
		value,
		onchange,
		other,
		onother,
		invalid,
		describedBy
	}: FieldProps = $props();

	const selected = $derived(typeof value === 'string' ? value : '');
	const items = $derived(choiceItems(question, options, { none: m.qn_opt_none, other: m.qn_opt_other }));
</script>

<RadioGroup.Root
	bind:value={() => selected, (next) => onchange(next)}
	aria-invalid={invalid ? 'true' : undefined}
	aria-describedby={describedBy}
	class="grid gap-2 sm:grid-cols-2"
>
	<!--
		Control ids are positional, not built from the choice value: our values are RxScale's,
		which are human sentences with spaces and brackets, and an id containing those is
		invalid, which breaks both the label association and the primitive's own wiring.
	-->
	{#each items as item, index (item.value)}
		{@const choiceId = `${controlId}-${index}`}
		{@const isOther = item.kind === 'other'}
		<!--
			`min-w-0`, because a grid item is `min-width: auto` by default, which is the width of
			the longest word inside it. `break-words` does not lower that, so one long compound
			widened the whole grid past the viewport instead of wrapping in its own card.
		-->
		<div class={isOther ? 'min-w-0 sm:col-span-2' : 'h-full min-w-0'}>
			<FieldLabel
				for={choiceId}
				class={isOther
					? '*:data-[slot=field]:min-h-12 *:data-[slot=field]:p-3'
					: 'h-full *:data-[slot=field]:min-h-12 *:data-[slot=field]:p-3'}
			>
				<Field
					orientation="horizontal"
					class={isOther
						? 'has-[>[data-slot=field-content]]:items-center'
						: 'h-full has-[>[data-slot=field-content]]:items-center'}
				>
					<!--
						`aria-label`, because the wrapping `<label for>` does not name this control.
						bits-ui renders the item as a `<button role="radio">`, and a button takes its
						name from its own content or from aria-*; HTML-AAM does not consult a `<label>`
						for it. Without this a screen reader announces an unnamed radio button, which
						axe reports as a critical `button-name` violation.
					-->
					<RadioGroup.Item
						id={choiceId}
						value={item.value}
						aria-label={item.label()}
						aria-invalid={invalid ? 'true' : undefined}
					/>
					<FieldContent class="min-w-0">
						<!--
							`block`, because the title is a flex container by default and the choice text
							is then an anonymous flex item whose `min-width: auto` is the width of its
							longest word, which pushes a long compound out of the card instead of
							wrapping it.
						-->
						<FieldTitle class="block w-full min-w-0 break-words font-display text-sm font-semibold">
							{item.label()}
						</FieldTitle>
					</FieldContent>
				</Field>
			</FieldLabel>

			{#if isOther && selected === item.value}
				<OtherTextInput {controlId} value={other} onchange={onother} />
			{/if}
		</div>
	{/each}
</RadioGroup.Root>
