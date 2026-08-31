<script lang="ts">
	import {
		Field,
		FieldContent,
		FieldLabel,
		FieldTitle
	} from '$lib/components/ui/field';
	import * as RadioGroup from '$lib/components/ui/radio-group';
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

	const selected = $derived(typeof value === 'string' ? value : '');
	// survey-core resolves the choice list, including any none or other item the model enables.
	const choices = $derived(question.visibleChoices ?? []);
	const otherValue = $derived('otherItem' in question ? String(question.otherItem?.value) : null);
</script>

<RadioGroup.Root
	bind:value={() => selected, (next) => onchange(next)}
	aria-invalid={invalid ? 'true' : undefined}
	aria-describedby={describedBy}
	class="grid gap-2 sm:grid-cols-2"
>
	<!--
		Control ids are positional, not built from the choice value: the model's values are
		human sentences with spaces and brackets, and an id containing those is invalid, which
		breaks both the label association and the primitive's own wiring.
	-->
	{#each choices as choice, index (choice.value)}
		{@const choiceValue = String(choice.value)}
		{@const choiceId = `${controlId}-${index}`}
		{@const isOther = choiceValue === otherValue}
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
						value={choiceValue}
						aria-label={choice.text}
						aria-invalid={invalid ? 'true' : undefined}
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

			{#if otherValue !== null && isOther && selected === otherValue}
				<OtherChoiceInput {question} {controlId} {comment} {oncomment} />
			{/if}
		</div>
	{/each}
</RadioGroup.Root>
