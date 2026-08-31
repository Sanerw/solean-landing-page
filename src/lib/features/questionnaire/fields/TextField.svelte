<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import type { QuestionFieldProps } from '../question-registry';

	let { question, controlId, invalid, describedBy, value, onchange }: QuestionFieldProps = $props();

	const text = $derived(typeof value === 'string' || typeof value === 'number' ? String(value) : '');

	// The model states the input kind; anything it does not name is plain text. Numbers stay
	// type="text" with a numeric inputmode, so a value the browser cannot parse reaches
	// survey-core's own validators instead of being silently discarded by the input.
	const inputType = $derived('inputType' in question ? String(question.inputType ?? 'text') : 'text');
	const numeric = $derived(inputType === 'number');
</script>

<Input
	id={controlId}
	type={numeric ? 'text' : inputType === 'email' ? 'email' : 'text'}
	class="h-12 px-3 py-2 text-sm"
	inputmode={numeric ? 'numeric' : inputType === 'email' ? 'email' : undefined}
	autocomplete={inputType === 'email' ? 'email' : 'off'}
	value={text}
	aria-invalid={invalid ? 'true' : undefined}
	aria-describedby={describedBy}
	oninput={(event) => onchange(event.currentTarget.value)}
/>
