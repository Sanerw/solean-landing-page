<script lang="ts">
	import { Field, FieldError, FieldLabel } from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import * as InputGroup from '$lib/components/ui/input-group';
	import SmartphoneIcon from '@lucide/svelte/icons/smartphone';
	import type { ContactField, FieldValue } from './types';

	interface Props {
		field: ContactField;
		values: FieldValue;
		/** Keyed by control id, so a contact input reads its own `fieldId.inputId` entry. */
		errors: Record<string, string>;
		domId: (controlKey: string) => string;
		errorId: (controlKey: string) => string;
		onchange: (inputId: string, value: string) => void;
	}

	let { field, values, errors, domId, errorId, onchange }: Props = $props();

	const record = $derived(
		(typeof values === 'object' && !Array.isArray(values) ? values : {}) as Record<string, string>
	);

	function key(inputId: string): string {
		return `${field.id}.${inputId}`;
	}
</script>

<div class="grid gap-6 sm:grid-cols-2">
	{#each field.inputs as input (input.id)}
		{@const controlKey = key(input.id)}
		{@const message = errors[controlKey]}
		{@const helpId = input.help ? `${domId(controlKey)}-help` : null}
		{@const described =
			[helpId, message ? errorId(controlKey) : null].filter(Boolean).join(' ') || undefined}

		<Field
			data-control-id={controlKey}
			class={input.width === 'half' ? '' : 'sm:col-span-2'}
		>
			<FieldLabel for={domId(controlKey)}>{input.label}</FieldLabel>

			{#if input.type === 'tel'}
				<InputGroup.Root>
					<InputGroup.Addon>
						<SmartphoneIcon aria-hidden="true" />
					</InputGroup.Addon>
					<InputGroup.Input
						id={domId(controlKey)}
						type="tel"
						autocomplete={input.autocomplete}
						placeholder={input.placeholder}
						value={record[input.id] ?? ''}
						aria-invalid={message ? 'true' : undefined}
						aria-describedby={described}
						oninput={(event) => onchange(input.id, event.currentTarget.value)}
					/>
				</InputGroup.Root>
			{:else}
				<Input
					id={domId(controlKey)}
					type={input.type}
					autocomplete={input.autocomplete}
					placeholder={input.placeholder}
					value={record[input.id] ?? ''}
					aria-invalid={message ? 'true' : undefined}
					aria-describedby={described}
					oninput={(event) => onchange(input.id, event.currentTarget.value)}
				/>
			{/if}

			{#if input.help}
				<p id={helpId} class="text-sm text-muted-foreground">{input.help}</p>
			{/if}

			{#if message}
				<FieldError id={errorId(controlKey)}>{message}</FieldError>
			{/if}
		</Field>
	{/each}
</div>
