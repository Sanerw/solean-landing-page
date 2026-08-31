<script lang="ts">
	import * as Alert from '$lib/components/ui/alert';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import type { QuestionFieldProps } from '../question-registry';

	let { question }: QuestionFieldProps = $props();

	// The model puts the message in `description` and uses `title` as its short lead-in.
	const description = $derived(question.description ?? '');
</script>

<Alert.Root variant="highlighted">
	<SparklesIcon aria-hidden="true" />
	{#if question.title}
		<Alert.Title>{question.title}</Alert.Title>
	{/if}
	{#if description}
		<!-- The model's own line breaks carry meaning here: consent wording, a support
		     address, a bulleted note. Collapsing them would run them into one sentence. -->
		<Alert.Description class="whitespace-pre-line">{description}</Alert.Description>
	{/if}
</Alert.Root>
