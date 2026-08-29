<script lang="ts">
	import {
		Field,
		FieldContent,
		FieldDescription,
		FieldLabel,
		FieldTitle
	} from '$lib/components/ui/field';
	import * as RadioGroup from '$lib/components/ui/radio-group';
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
	class="grid gap-3 sm:grid-cols-2"
>
	{#each field.options as option (option.id)}
		<FieldLabel for="{stepId}-{field.id}-{option.id}">
			<Field orientation="horizontal">
				<RadioGroup.Item
					id="{stepId}-{field.id}-{option.id}"
					value={option.id}
					aria-invalid={invalid ? 'true' : undefined}
				/>
				<FieldContent>
					<!-- FieldLabel carries the uppercase eyebrow treatment for bare field labels; an
					     option card is a sentence-case choice, as the reference shows it. -->
					<FieldTitle class="font-display text-base font-semibold normal-case tracking-normal">
						{option.label}
					</FieldTitle>
					{#if option.description}
						<FieldDescription class="normal-case tracking-normal">
							{option.description}
						</FieldDescription>
					{/if}
				</FieldContent>
			</Field>
		</FieldLabel>
	{/each}
</RadioGroup.Root>
