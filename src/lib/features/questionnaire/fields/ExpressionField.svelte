<script lang="ts">
	import type { QuestionFieldProps } from '../question-registry';

	let { question }: QuestionFieldProps = $props();

	// The model puts the message in `description` and uses `title` as its short lead-in.
	const description = $derived(question.description ?? '');
</script>

<div class="rounded-lg border border-border bg-surface-subtle p-4">
	{#if question.title}
		<p class="font-display text-base font-semibold">{question.title}</p>
	{/if}
	{#if description}
		<!-- The model's own line breaks carry meaning here: consent wording, a support
		     address, a bulleted note. Collapsing them would run them into one sentence. -->
		<p class="mt-1 text-sm whitespace-pre-line text-muted-foreground">{description}</p>
	{/if}
</div>
