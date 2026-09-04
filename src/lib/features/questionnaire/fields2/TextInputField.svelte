<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import type { FieldProps } from '../definition/field-props';

	let { question, controlId, value, onchange, invalid, describedBy }: FieldProps = $props();

	const text = $derived(typeof value === 'string' ? value : '');
	// The e-mail is the one text question with a keyboard and an autofill hint worth setting.
	const isEmail = $derived(question.id === 'email');
	const isPhone = $derived(question.id === 'phone');
</script>

<Input
	id={controlId}
	type={isEmail ? 'email' : isPhone ? 'tel' : 'text'}
	class="h-12 px-3 py-2 text-sm"
	inputmode={isEmail ? 'email' : isPhone ? 'tel' : undefined}
	autocomplete={isEmail ? 'email' : isPhone ? 'tel' : 'off'}
	placeholder={isEmail ? 'name@example.com' : undefined}
	aria-invalid={invalid ? 'true' : undefined}
	aria-describedby={describedBy}
	value={text}
	oninput={(event) => onchange(event.currentTarget.value)}
/>
