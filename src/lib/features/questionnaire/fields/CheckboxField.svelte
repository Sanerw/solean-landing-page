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

<div class="grid gap-3 sm:grid-cols-2">
	<!-- Positional ids: the model's choice values are sentences, which are not valid ids. -->
	{#each choices as choice, index (choice.value)}
		{@const choiceValue = String(choice.value)}
		{@const id = `${controlId}-${index}`}
		<div class={choiceValue === otherValue ? 'sm:col-span-2' : undefined}>
			<FieldLabel for={id}>
				<Field orientation="horizontal">
					<Checkbox
						{id}
						checked={selected.includes(choiceValue)}
						aria-invalid={invalid ? 'true' : undefined}
						aria-describedby={describedBy}
						onCheckedChange={(checked) => toggle(choiceValue, checked === true)}
					/>
					<FieldContent>
						<FieldTitle class="font-display text-base font-semibold">{choice.text}</FieldTitle>
					</FieldContent>
				</Field>
			</FieldLabel>

			{#if otherValue !== null && choiceValue === otherValue && selected.includes(otherValue)}
				<OtherChoiceInput {question} {controlId} {comment} {oncomment} />
			{/if}
		</div>
	{/each}
</div>
