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
		<div class={choiceValue === otherValue ? 'sm:col-span-2' : undefined}>
			<FieldLabel
				for={choiceId}
				class="*:data-[slot=field]:min-h-12 *:data-[slot=field]:p-3"
			>
				<Field orientation="horizontal">
					<RadioGroup.Item
						id={choiceId}
						value={choiceValue}
						aria-invalid={invalid ? 'true' : undefined}
					/>
					<FieldContent>
						<FieldTitle class="font-display text-sm font-semibold">{choice.text}</FieldTitle>
					</FieldContent>
				</Field>
			</FieldLabel>

			{#if otherValue !== null && choiceValue === otherValue && selected === otherValue}
				<OtherChoiceInput {question} {controlId} {comment} {oncomment} />
			{/if}
		</div>
	{/each}
</RadioGroup.Root>
