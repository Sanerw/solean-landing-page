<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import type { QuestionFieldProps } from '../question-registry';

	let { controlId, invalid, describedBy, value, onchange }: QuestionFieldProps = $props();

	/**
	 * RxScale's `os-date-picker` declares no properties, so the stored shape is ours to
	 * choose. A native date input speaks the visitor's locale while its value is always
	 * `YYYY-MM-DD`, which is what reaches the submission.
	 */
	const date = $derived(typeof value === 'string' ? value : '');
</script>

<Input
	id={controlId}
	type="date"
	value={date}
	class="max-w-xs"
	aria-invalid={invalid ? 'true' : undefined}
	aria-describedby={describedBy}
	oninput={(event) => onchange(event.currentTarget.value)}
/>
