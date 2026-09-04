<script lang="ts">
	import SmartphoneIcon from '@lucide/svelte/icons/smartphone';
	import { Input } from '$lib/components/ui/input';
	import { InputGroup, InputGroupAddon, InputGroupInput } from '$lib/components/ui/input-group';
	import type { FieldProps } from '../definition/field-props';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import type { AnyQuestion } from '../definition/kinds';

	let { question, controlId, value, onchange, invalid, describedBy }: FieldProps = $props();

	const text = $derived(typeof value === 'string' ? value : '');
	// The e-mail and the phone are the two that deserve a keyboard of their own.
	const isEmail = $derived(question.id === 'email');
	const isPhone = $derived(question.id === 'phone');

	/** The browser fills a name and an address it already has; nothing else here is fillable. */
	const AUTOFILL: Partial<Record<string, HTMLInputAttributes['autocomplete']>> = {
		firstName: 'given-name',
		lastName: 'family-name',
		email: 'email'
	};

	/**
	 * The artboard shows every box on this screen holding an example. The e-mail and the phone
	 * have one drawn; the two names do not, so they echo their own label rather than inventing
	 * a person, which would put a made-up name in front of somebody about to type their own.
	 */
	function placeholderFor(field: AnyQuestion): string | undefined {
		if (field.placeholder) return field.placeholder();
		if (field.id === 'email') return 'name@example.com';
		if (field.id === 'phone') return '+49 151 234 56 78';
		if (field.id === 'firstName' || field.id === 'lastName') {
			return (field.shortLabel ?? field.label)();
		}

		return undefined;
	}

	const placeholder = $derived(placeholderFor(question));
</script>

{#if isPhone}
	<InputGroup>
		<!--
			`aria-hidden`, so the field's accessible name stays its label rather than picking up
			the icon. The artboard draws it; a screen reader has the label already.
		-->
		<InputGroupAddon align="inline-start" aria-hidden="true">
			<SmartphoneIcon />
		</InputGroupAddon>
		<InputGroupInput
			id={controlId}
			type="tel"
			inputmode="tel"
			class="h-full"
			autocomplete="tel"
			{placeholder}
			aria-invalid={invalid ? 'true' : undefined}
			aria-describedby={describedBy}
			value={text}
			oninput={(event) => onchange(event.currentTarget.value)}
		/>
	</InputGroup>
{:else}
	<Input
		id={controlId}
		type={isEmail ? 'email' : 'text'}
		inputmode={isEmail ? 'email' : undefined}
		autocomplete={AUTOFILL[question.id] ?? 'off'}
		{placeholder}
		aria-invalid={invalid ? 'true' : undefined}
		aria-describedby={describedBy}
		value={text}
		oninput={(event) => onchange(event.currentTarget.value)}
	/>
{/if}
