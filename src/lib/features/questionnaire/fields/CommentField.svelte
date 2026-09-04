<script lang="ts">
	import { Textarea } from '$lib/components/ui/textarea';
	import type { FieldProps } from '../definition/field-props';

	let { question, controlId, value, onchange, invalid, describedBy }: FieldProps = $props();

	const text = $derived(typeof value === 'string' ? value : '');
</script>

<Textarea
	id={controlId}
	rows={4}
	class="px-4 py-3"
	placeholder={question.placeholder?.()}
	aria-invalid={invalid ? 'true' : undefined}
	aria-describedby={describedBy}
	value={text}
	oninput={(event) => onchange(event.currentTarget.value)}
/>
