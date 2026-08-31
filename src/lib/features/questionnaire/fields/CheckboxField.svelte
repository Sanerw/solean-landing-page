<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Field, FieldContent, FieldLabel, FieldTitle } from '$lib/components/ui/field';
	import type { QuestionFieldProps } from '../question-registry';
	import OtherChoiceInput from './OtherChoiceInput.svelte';

	let {
		question,
		controlId,
		invalid,
		describedBy,
		value,
		onchange,
		comment,
		oncomment
	}: QuestionFieldProps = $props();

	const selected = $derived(Array.isArray(value) ? value.map(String) : []);
	// Already carries the model's own "none" and "other" items where it enables them.
	const choices = $derived(question.visibleChoices ?? []);
	const otherValue = $derived('otherItem' in question ? String(question.otherItem?.value) : null);

	/**
	 * The naive next list is enough: the engine owns what an exclusive option means, so
	 * adding "none of the above" clears the rest and picking a real option clears it again.
	 * Reimplementing that here would be a second opinion the submission validator does not
	 * share.
	 */
	function toggle(choiceValue: string, checked: boolean): void {
		onchange(
			checked ? [...selected, choiceValue] : selected.filter((entry) => entry !== choiceValue)
		);
	}
</script>

<div class="grid gap-2 sm:grid-cols-2">
	<!-- Positional ids: the model's choice values are sentences, which are not valid ids. -->
	{#each choices as choice, index (choice.value)}
		{@const choiceValue = String(choice.value)}
		{@const id = `${controlId}-${index}`}
		{@const isOther = choiceValue === otherValue}
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
						for it. Without this a screen reader announces an unnamed checkbox, which
						axe reports as a critical `button-name` violation.
					-->
					<Checkbox
						{id}
						checked={selected.includes(choiceValue)}
						aria-label={choice.text}
						aria-invalid={invalid ? 'true' : undefined}
						aria-describedby={describedBy}
						onCheckedChange={(checked) => toggle(choiceValue, checked === true)}
					/>
					<FieldContent class="min-w-0">
						<!--
							`block`, because the title is a flex container by default and the choice text
							is then an anonymous flex item whose `min-width: auto` is the width of its
							longest word. `break-words` does not shrink that, so a compound like
							"Gewichtsverlustoperation/Gewichtsreduktionschirurgie" pushed the line out of
							the card instead of wrapping inside it. The model's choices are sentences of
							any length, so this cannot be handled by shortening the copy.
						-->
						<FieldTitle class="block w-full min-w-0 break-words font-display text-sm font-semibold">
							{choice.text}
						</FieldTitle>
					</FieldContent>
				</Field>
			</FieldLabel>

			{#if otherValue !== null && isOther && selected.includes(otherValue)}
				<OtherChoiceInput {question} {controlId} {comment} {oncomment} />
			{/if}
		</div>
	{/each}
</div>
