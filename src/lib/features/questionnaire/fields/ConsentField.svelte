<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Field, FieldContent, FieldLabel, FieldTitle } from '$lib/components/ui/field';
	import type { FieldProps } from '../definition/field-props';

	let { question, controlId, value, onchange, invalid, describedBy }: FieldProps = $props();

	const checked = $derived(value === true);
	/**
	 * The wording beside the box, which is not the instruction above it: RxScale keeps this as
	 * a one-item choice list ("Bestätigen", "Ich verstehe") and ours is a boolean, so 24a gave
	 * the question its own `confirmLabel` rather than letting a screen invent one.
	 */
	const label = $derived(question.confirmLabel?.() ?? '');
</script>

<FieldLabel for={controlId} class="*:data-[slot=field]:min-h-12 *:data-[slot=field]:px-4 *:data-[slot=field]:py-3">
	<Field orientation="horizontal" class="has-[>[data-slot=field-content]]:items-center">
		<!-- `aria-label` for the same reason the choice fields carry one: bits-ui renders a
		     `<button role="checkbox">`, which HTML-AAM does not name from a wrapping label. -->
		<Checkbox
			id={controlId}
			{checked}
			aria-label={label}
			aria-invalid={invalid ? 'true' : undefined}
			aria-describedby={describedBy}
			onCheckedChange={(next) => onchange(next === true)}
		/>
		<FieldContent class="min-w-0">
			<FieldTitle class="block w-full min-w-0 break-words font-display text-sm font-semibold">
				{label}
			</FieldTitle>
		</FieldContent>
	</Field>
</FieldLabel>
