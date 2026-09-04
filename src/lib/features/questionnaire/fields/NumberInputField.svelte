<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { InputGroup, InputGroupAddon, InputGroupInput } from '$lib/components/ui/input-group';
	import type { FieldProps } from '../definition/field-props';

	let { question, controlId, value, onchange, invalid, describedBy }: FieldProps = $props();

	const text = $derived(typeof value === 'string' ? value : '');
	const unit = $derived(question.unit?.());
	const placeholder = $derived(question.placeholder?.());
</script>

<!--
	`type="text"` with a numeric inputmode, never `type="number"`. A number input discards what
	it cannot parse, so "96,5" or a stray letter would reach our validation as an empty string
	and be reported as missing rather than as out of range. The phone keyboard is the only
	thing `inputmode` is for here.
-->
{#if unit}
	<InputGroup>
		<InputGroupInput
			id={controlId}
			type="text"
			inputmode="numeric"
			class="h-full"
			autocomplete="off"
			{placeholder}
			aria-invalid={invalid ? 'true' : undefined}
			aria-describedby={describedBy}
			value={text}
			oninput={(event) => onchange(event.currentTarget.value)}
		/>
		<!--
			`aria-hidden`, so the field's accessible name stays its label. Without it the box is
			announced as "Größe cm", which reads as the name of the control rather than as the
			unit the number is in.
		-->
		<InputGroupAddon align="inline-end" aria-hidden="true">{unit}</InputGroupAddon>
	</InputGroup>
{:else}
	<Input
		id={controlId}
		type="text"
		inputmode="numeric"
		autocomplete="off"
		{placeholder}
		aria-invalid={invalid ? 'true' : undefined}
		aria-describedby={describedBy}
		value={text}
		oninput={(event) => onchange(event.currentTarget.value)}
	/>
{/if}
