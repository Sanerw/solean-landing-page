<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';
	import {
		Field,
		FieldContent,
		FieldDescription,
		FieldLabel,
		FieldTitle
	} from '$lib/components/ui/field';
	import { Separator } from '$lib/components/ui/separator';
	import type { MultiSelectField, QuestionOption } from './types';

	interface Props {
		field: MultiSelectField;
		stepId: string;
		value: readonly string[];
		invalid: boolean;
		describedBy: string | undefined;
		onchange: (optionIds: string[]) => void;
	}

	let { field, stepId, value, invalid, describedBy, onchange }: Props = $props();

	const isTrailing = (option: QuestionOption) => option.trailing === true || option.exclusive === true;

	const primary = $derived(field.options.filter((option) => !isTrailing(option)));
	const trailing = $derived(field.options.filter(isTrailing));
	const exclusive = $derived(field.options.find((option) => option.exclusive) ?? null);
	const columns = $derived(field.optionColumns === 2 ? 'sm:grid-cols-2' : '');

	function optionId(option: QuestionOption): string {
		return `${stepId}-${field.id}-${option.id}`;
	}

	/**
	 * "None of the above" and any real answer contradict each other, so selecting either
	 * side clears the other rather than leaving both true and letting validation sort it out.
	 */
	function toggle(option: QuestionOption, checked: boolean): void {
		if (!checked) {
			onchange(value.filter((id) => id !== option.id));
			return;
		}

		if (option.exclusive) {
			onchange([option.id]);
			return;
		}

		const withoutExclusive = value.filter((id) => id !== exclusive?.id);
		onchange([...withoutExclusive, option.id]);
	}
</script>

{#snippet card(option: QuestionOption)}
	<FieldLabel for={optionId(option)}>
		<Field orientation="horizontal">
			<Checkbox
				id={optionId(option)}
				checked={value.includes(option.id)}
				aria-invalid={invalid ? 'true' : undefined}
				aria-describedby={describedBy}
				onCheckedChange={(checked) => toggle(option, checked === true)}
			/>
			<FieldContent>
				<FieldTitle class="font-sans text-base font-semibold normal-case tracking-normal">
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
{/snippet}

<div class="grid gap-3 {columns}">
	{#each primary as option (option.id)}
		{@render card(option)}
	{/each}
</div>

{#if trailing.length > 0}
	<!-- Decorative: the exclusivity is already conveyed by the control behavior, so the
	     separator is hidden rather than read out as a stray "or" between checkboxes. -->
	<div aria-hidden="true" class="relative my-1 flex items-center gap-3">
		<Separator class="flex-1" />
		<span class="font-sans text-xs font-semibold uppercase tracking-widest text-text-faint">
			or
		</span>
		<Separator class="flex-1" />
	</div>

	<div class="grid gap-3 {columns}">
		{#each trailing as option (option.id)}
			{@render card(option)}
		{/each}
	</div>
{/if}
