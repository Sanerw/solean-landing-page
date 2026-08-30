<script lang="ts" module>
	/** One report per question, so walking the questionnaire does not flood the console. */
	const reported = new Set<string>();
</script>

<script lang="ts">
	import * as Alert from '$lib/components/ui/alert';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import type { Question } from 'survey-core';

	interface Props {
		question: Question;
		reason: string;
		/** True when the question collects an answer, so the step cannot be walked past. */
		blocking: boolean;
	}

	let { question, reason, blocking }: Props = $props();

	const key = $derived(`${question.name}:${question.getType()}`);

	$effect(() => {
		if (reported.has(key)) return;
		reported.add(key);
		// The type and the question name only. An answer never reaches the console.
		console.error(`Questionnaire: cannot render "${question.name}" (${question.getType()}): ${reason}`);
	});
</script>

<Alert.Root variant={blocking ? 'destructive' : 'default'}>
	<TriangleAlertIcon aria-hidden="true" />
	<Alert.Title>
		{blocking ? 'This question cannot be shown yet' : 'This text cannot be shown yet'}
	</Alert.Title>
	<Alert.Description>
		<span>{question.title}</span>
		<span class="mt-2 block text-sm">
			Type <code>{question.getType()}</code>: {reason}.
			{#if blocking}
				The questionnaire cannot continue past it, because answering it is required and skipping it
				would send an incomplete anamnesis.
			{:else}
				It collects no answer, so it does not hold the questionnaire up.
			{/if}
		</span>
	</Alert.Description>
</Alert.Root>
