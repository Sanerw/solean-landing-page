<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Field, FieldContent, FieldLabel, FieldTitle } from '$lib/components/ui/field';
	import { Separator } from '$lib/components/ui/separator';
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
	/** Sentences read in one column, short terms in two. The artboards decide per question. */
	const twoUp = $derived(question.columns !== 1);
</script>

<div class={twoUp ? 'grid gap-2.5 sm:grid-cols-2' : 'grid gap-2.5'}>
	<!-- Positional ids: our choice values are RxScale's, which are sentences, not valid ids. -->
	{#each items as item, index (item.value)}
		{@const id = `${controlId}-${index}`}
		{@const isOther = item.kind === 'other'}
		{@const isPinned = item.kind === 'pinned'}
		{@const isChecked = selected.includes(item.value)}
		{@const otherOpen = isOther && isChecked}
		{@const full = isPinned || !twoUp}

		{#if item.kind === 'none'}
			<!--
				The artboards' OR rule, separating the things being listed from the answer that
				declines them all. Decorative: `aria-hidden` and no tab stop, so it is neither an
				option nor a stop on the way to one.
			-->
			<div class="flex min-w-0 items-center gap-3 py-1 sm:col-span-2" aria-hidden="true">
				<Separator class="flex-1" />
				<span class="font-sans text-xs font-semibold tracking-widest text-text-faint">
					{m.qs_or()}
				</span>
				<Separator class="flex-1" />
			</div>
		{/if}
		<!--
			`min-w-0`, because a grid item is `min-width: auto` by default, which is the width of
			the longest word inside it. `break-words` does not lower that, so one long compound
			widened the whole grid past the viewport instead of wrapping in its own card.
		-->
		<div class={full ? 'min-w-0 sm:col-span-2' : 'h-full min-w-0'}>
			<FieldLabel
				for={id}
				class={[
					full ? '' : 'h-full',
					// 48px and `px-4`, which is `Input`'s own box: a choice card and a text field are
					// the same control to the person answering, so they are the same size here.
					'*:data-[slot=field]:min-h-12 *:data-[slot=field]:px-4 *:data-[slot=field]:py-3',
					// The pinned row is the list's closing statement, not one of its items, and it
					// keeps that ground whether or not it is the answer: only the border changes.
					//
					// On the label, where the primitive puts `bg-card`, never on the inner field,
					// which has neither the rounded corners nor the border and so pushed square
					// grey corners outside the card's own. The checked variant is restated because
					// the primitive tints a chosen card `bg-surface-subtle` through a selector one
					// `:has()` more specific than this one; naming the same variant is what lets
					// `tailwind-merge` replace it rather than let it win on specificity.
					isPinned
						? 'has-[>[data-slot=field]]:bg-muted has-[>[data-slot=field]]:has-data-checked:bg-muted'
						: ''
				]
					.filter(Boolean)
					.join(' ')}
			>
				<Field
					orientation="horizontal"
					class={full
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
						checked={isChecked}
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
						<FieldTitle class="block w-full min-w-0 break-words font-display text-base font-semibold sm:text-sm">
							{item.label()}
						</FieldTitle>
					</FieldContent>
				</Field>
			</FieldLabel>
		</div>

		<!--
			The revealed free text is a grid cell of its own, spanning the row, not a child of the
			chosen card. Inside the card it forced that card to full width, which moved the option
			out of its column and down a row the moment somebody chose it.
		-->
		{#if otherOpen}
			<div class="min-w-0 sm:col-span-2">
				<OtherTextInput {question} {controlId} {invalid} value={other} onchange={onother} />
			</div>
		{/if}
	{/each}
</div>
