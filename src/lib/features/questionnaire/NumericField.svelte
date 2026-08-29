<script lang="ts">
	import * as InputGroup from '$lib/components/ui/input-group';
	import type { NumericField } from './types';

	interface Props {
		field: NumericField;
		controlId: string;
		value: string;
		invalid: boolean;
		describedBy: string | undefined;
		onchange: (value: string) => void;
	}

	let { field, controlId, value, invalid, describedBy, onchange }: Props = $props();
</script>

<!--
	type="text" with inputmode="numeric", not type="number": the number input silently
	discards what it cannot parse, so "12a" would arrive here as an empty string and be
	reported as missing rather than malformed. Parsing and its message stay in the schema.
-->
<InputGroup.Root>
	<InputGroup.Input
		id={controlId}
		type="text"
		inputmode="numeric"
		autocomplete="off"
		placeholder={field.placeholder}
		{value}
		aria-invalid={invalid ? 'true' : undefined}
		aria-describedby={describedBy}
		oninput={(event) => onchange(event.currentTarget.value)}
	/>
	<InputGroup.Addon align="inline-end">
		<InputGroup.Text aria-hidden="true">{field.unit}</InputGroup.Text>
	</InputGroup.Addon>
</InputGroup.Root>
