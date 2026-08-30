<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { FieldLabel } from '$lib/components/ui/field';
	import type { Question } from 'survey-core';

	interface Props {
		question: Question;
		controlId: string;
		comment: string;
		oncomment: (next: string) => void;
	}

	let { question, controlId, comment, oncomment }: Props = $props();

	/**
	 * SurveyJS keeps the answer in `value` and this text in `comment`, and sends it as
	 * `<name>-Comment`. The label repeats the choice it belongs to for assistive technology
	 * only: on screen the checked option already carries that word.
	 */
	const label = $derived('otherText' in question ? String(question.otherText) : 'Other');
	const placeholder = $derived(
		'otherPlaceholder' in question ? String(question.otherPlaceholder ?? '') : ''
	);
</script>

<div class="mt-3">
	<!-- `-other-text`, not `-other`: that id already belongs to the choice this input follows,
	     and a duplicate would point its label at the wrong element. -->
	<FieldLabel for="{controlId}-other-text" class="sr-only">{label}</FieldLabel>
	<Input
		id="{controlId}-other-text"
		type="text"
		{placeholder}
		value={comment}
		oninput={(event) => oncomment(event.currentTarget.value)}
	/>
</div>
