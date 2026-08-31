<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Field, FieldError, FieldLabel } from '$lib/components/ui/field';
	import type { MultipleTextItemModel } from 'survey-core';
	import type { QuestionFieldProps } from '../question-registry';
	import { questionnaireSession } from '../survey-state.svelte';

	let { question, controlId, describedBy, value, onchange }: QuestionFieldProps = $props();

	const items = $derived(('items' in question ? question.items : []) as MultipleTextItemModel[]);
	const values = $derived(
		typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
	);

	/**
	 * A composite reports its failures on the item editors, not on itself: a height outside
	 * the model's range leaves `question.errors` empty while `items[0].editor.errors` carries
	 * the message. Reading the question alone would leave a step that refuses to advance with
	 * nothing on screen to explain why.
	 */
	function errorFor(item: MultipleTextItemModel): string | null {
		questionnaireSession.revision;
		return item.editor.errors.length > 0 ? item.editor.errors[0].getText() : null;
	}

	function update(item: MultipleTextItemModel, next: string): void {
		// Merged from the engine rather than from the `value` prop: two controls can be typed
		// into faster than the prop round-trips, and merging a stale copy drops the first one.
		const current = (question.value ?? {}) as Record<string, unknown>;

		onchange({ ...current, [item.name]: next });
	}
</script>

<div class="grid gap-3 sm:grid-cols-2">
	{#each items as item (item.name)}
		{@const id = `${controlId}-${item.name}`}
		{@const error = errorFor(item)}
		<Field class="gap-2">
			<FieldLabel for={id}>{item.title}</FieldLabel>
			<Input
				{id}
				type={item.inputType === 'number' ? 'text' : 'text'}
				class="h-12 px-3 py-2 text-sm"
				inputmode={item.inputType === 'number' ? 'numeric' : undefined}
				value={typeof values[item.name] === 'string' || typeof values[item.name] === 'number'
					? String(values[item.name])
					: ''}
				aria-invalid={error !== null ? 'true' : undefined}
				aria-describedby={error ? `${id}-error` : describedBy}
				oninput={(event) => update(item, event.currentTarget.value)}
			/>
			{#if error}
				<FieldError id="{id}-error">{error}</FieldError>
			{/if}
		</Field>
	{/each}
</div>
