<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { FieldDescription, FieldLabel } from '$lib/components/ui/field';
	import { m } from '$lib/paraglide/messages';
	import type { AnyQuestion } from '../definition/kinds';

	interface Props {
		question: AnyQuestion;
		controlId: string;
		value: string;
		onchange: (next: string) => void;
		/** The question's own state: `other-text-missing` is about this box, not the choices. */
		invalid: boolean;
	}

	let { question, controlId, value, onchange, invalid }: Props = $props();

	// `-other-text`, not `-other`: that id already belongs to the choice this input follows,
	// and a duplicate would point its label at the wrong element.
	const id = $derived(`${controlId}-other-text`);
	const label = $derived(question.otherLabel?.());
	const description = $derived(question.otherDescription?.());
</script>

<div class="flex flex-col gap-2.5">
	<!-- Named where the artboard names it, and hidden where it does not: an unlabelled box
	     following a choice would otherwise be an unnamed input for a screen reader. -->
	<FieldLabel for={id} class={label ? '' : 'sr-only'}>{label ?? m.qn_opt_other()}</FieldLabel>
	<Input
		{id}
		type="text"
		placeholder={question.otherPlaceholder?.()}
		aria-invalid={invalid ? 'true' : undefined}
		aria-describedby={description ? `${id}-description` : undefined}
		{value}
		oninput={(event) => onchange(event.currentTarget.value)}
	/>
	{#if description}
		<FieldDescription id="{id}-description" class="leading-snug">{description}</FieldDescription>
	{/if}
</div>
