<script lang="ts">
	import {
		Field,
		FieldContent,
		FieldDescription,
		FieldLabel,
		FieldTitle
	} from '$lib/components/ui/field';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import TreatmentOption from './TreatmentOption.svelte';
	import type { SingleSelectField } from './types';

	interface Props {
		field: SingleSelectField;
		stepId: string;
		value: string;
		invalid: boolean;
		describedBy: string | undefined;
		onchange: (optionId: string) => void;
	}

	let { field, stepId, value, invalid, describedBy, onchange }: Props = $props();
</script>

<RadioGroup.Root
	bind:value={() => value, (next) => onchange(next)}
	aria-invalid={invalid ? 'true' : undefined}
	aria-describedby={describedBy}
	class={field.optionPresentation === 'treatment' ? 'grid gap-4' : 'grid gap-3 sm:grid-cols-2'}
>
	{#if field.optionPresentation === 'treatment'}
		{#each field.options as option (option.id)}
			<div>
				<TreatmentOption
					treatmentId={option.id}
					controlId="{stepId}-{field.id}-{option.id}"
					{invalid}
					{describedBy}
				/>
			</div>
		{/each}
	{:else}
	{#each field.options as option (option.id)}
		<FieldLabel for="{stepId}-{field.id}-{option.id}">
			<Field orientation="horizontal">
				<RadioGroup.Item
					id="{stepId}-{field.id}-{option.id}"
					value={option.id}
					aria-invalid={invalid ? 'true' : undefined}
				/>
				<FieldContent>
					<FieldTitle class="font-display text-base font-semibold">
						{option.label}
					</FieldTitle>
					{#if option.description}
						<FieldDescription>
							{option.description}
						</FieldDescription>
					{/if}
				</FieldContent>
			</Field>
		</FieldLabel>
	{/each}
	{/if}
</RadioGroup.Root>
