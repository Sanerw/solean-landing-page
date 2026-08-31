<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { EMAIL_QUESTION_NAME } from '$lib/config/checkout';
	import type { QuestionFieldProps } from '../question-registry';

	let { question, controlId, invalid, describedBy, value, onchange }: QuestionFieldProps = $props();

	const text = $derived(typeof value === 'string' || typeof value === 'number' ? String(value) : '');

	// The model states the input kind; anything it does not name is plain text. Numbers stay
	// type="text" with a numeric inputmode, so a value the browser cannot parse reaches
	// survey-core's own validators instead of being silently discarded by the input.
	const inputType = $derived('inputType' in question ? String(question.inputType ?? 'text') : 'text');
	const numeric = $derived(inputType === 'number');
	const email = $derived(inputType === 'email' || question.name === EMAIL_QUESTION_NAME);
	const modelPlaceholder = $derived(
		'placeholder' in question && typeof question.placeholder === 'string'
			? question.placeholder.trim()
			: ''
	);
	const placeholder = $derived(modelPlaceholder || (email ? 'name@example.com' : undefined));
</script>

<Input
	id={controlId}
	type={numeric ? 'text' : email ? 'email' : 'text'}
	class="h-12 px-3 py-2 text-sm"
	inputmode={numeric ? 'numeric' : email ? 'email' : undefined}
	autocomplete={email ? 'email' : 'off'}
	{placeholder}
	value={text}
	aria-invalid={invalid ? 'true' : undefined}
	aria-describedby={describedBy}
	oninput={(event) => onchange(event.currentTarget.value)}
/>
