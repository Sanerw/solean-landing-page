<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Field, FieldContent, FieldLabel, FieldTitle } from '$lib/components/ui/field';
	import { m } from '$lib/paraglide/messages';
	import { toggleMulti } from '../answers/choice-behaviour';
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

	const selected = $derived(Array.isArray(value) ? value.map(String) : []);
	const items = $derived(choiceItems(question, options, { none: m.qn_opt_none, other: m.qn_opt_other }));
</script>

<div class="grid gap-2 sm:grid-cols-2">
	<!-- Positional ids: our choice values are RxScale's, which are sentences, not valid ids. -->
	{#each items as item, index (item.value)}
		{@const id = `${controlId}-${index}`}
		{@const isOther = item.kind === 'other'}
		<!--
			`min-w-0`, because a grid item is `min-width: auto` by default, which is the width of
			the longest word inside it. `break-words` does not lower that, so one long compound
			widened the whole grid past the viewport instead of wrapping in its own card.
		-->
		<div class={isOther ? 'min-w-0 sm:col-span-2' : 'h-full min-w-0'}>
			<FieldLabel
				for={id}
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
						bits-ui renders the item as a `<button role="checkbox">`, and a button takes its
						name from its own content or from aria-*; HTML-AAM does not consult a `<label>`
						for it. Without this a screen reader announces an unnamed checkbox, which axe
						reports as a critical `button-name` violation.
					-->
					<Checkbox
						{id}
						checked={selected.includes(item.value)}
						aria-label={item.label()}
						aria-invalid={invalid ? 'true' : undefined}
						aria-describedby={describedBy}
						onCheckedChange={(checked) =>
							onchange(toggleMulti(selected, item.value, checked === true))}
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

			{#if isOther && selected.includes(item.value)}
				<OtherTextInput {controlId} value={other} onchange={onother} />
			{/if}
		</div>
	{/each}
</div>
