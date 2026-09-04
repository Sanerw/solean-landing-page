<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { FieldLabel } from '$lib/components/ui/field';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		controlId: string;
		value: string;
		onchange: (next: string) => void;
	}

	let { controlId, value, onchange }: Props = $props();
</script>

<div class="mt-2">
	<!-- `-other-text`, not `-other`: that id already belongs to the choice this input follows,
	     and a duplicate would point its label at the wrong element. -->
	<FieldLabel for="{controlId}-other-text" class="sr-only">{m.qn_opt_other()}</FieldLabel>
	<Input
		id="{controlId}-other-text"
		type="text"
		class="h-12 px-3 py-2 text-sm"
		{value}
		oninput={(event) => onchange(event.currentTarget.value)}
	/>
</div>
