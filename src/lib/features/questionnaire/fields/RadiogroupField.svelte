<script lang="ts">
	import {
		Field,
		FieldContent,
		FieldLabel,
		FieldTitle
	} from '$lib/components/ui/field';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import type { QuestionFieldProps } from '../question-registry';

	let { question, controlId, invalid, describedBy, value, onchange }: QuestionFieldProps = $props();

	const selected = $derived(typeof value === 'string' ? value : '');
	// survey-core resolves the choice list, including any none item the model enables.
	const choices = $derived(question.visibleChoices ?? []);
</script>

<RadioGroup.Root
	bind:value={() => selected, (next) => onchange(next)}
	aria-invalid={invalid ? 'true' : undefined}
	aria-describedby={describedBy}
	class="grid gap-3 sm:grid-cols-2"
>
	{#each choices as choice (choice.value)}
		<FieldLabel for="{controlId}-{choice.value}">
			<Field orientation="horizontal">
				<RadioGroup.Item
					id="{controlId}-{choice.value}"
					value={String(choice.value)}
					aria-invalid={invalid ? 'true' : undefined}
				/>
				<FieldContent>
					<FieldTitle class="font-display text-base font-semibold">{choice.text}</FieldTitle>
				</FieldContent>
			</Field>
		</FieldLabel>
	{/each}
</RadioGroup.Root>
