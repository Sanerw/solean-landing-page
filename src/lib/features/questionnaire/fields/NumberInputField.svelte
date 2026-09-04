<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import type { FieldProps } from '../definition/field-props';

	let { controlId, value, onchange, invalid, describedBy }: FieldProps = $props();

	const text = $derived(typeof value === 'string' ? value : '');
</script>

<!--
	`type="text"` with a numeric inputmode, never `type="number"`. A number input discards what
	it cannot parse, so "96,5" or a stray letter would reach our validation as an empty string
	and be reported as missing rather than as out of range. The phone keyboard is the only
	thing `inputmode` is for here.
-->
<Input
	id={controlId}
	type="text"
	inputmode="numeric"
	class="h-12 px-3 py-2 text-sm"
	autocomplete="off"
	aria-invalid={invalid ? 'true' : undefined}
	aria-describedby={describedBy}
	value={text}
	oninput={(event) => onchange(event.currentTarget.value)}
/>
