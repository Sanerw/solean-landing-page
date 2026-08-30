<script lang="ts">
	import { Textarea } from '$lib/components/ui/textarea';
	import type { QuestionFieldProps } from '../question-registry';

	let { controlId, invalid, describedBy, value, onchange }: QuestionFieldProps = $props();

	const text = $derived(typeof value === 'string' ? value : '');
</script>

<Textarea
	id={controlId}
	rows={5}
	value={text}
	aria-invalid={invalid ? 'true' : undefined}
	aria-describedby={describedBy}
	oninput={(event) => onchange(event.currentTarget.value)}
/>
