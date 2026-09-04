<script lang="ts" module>
	/** One report per question, so walking the questionnaire does not flood the console. */
	const reported = new Set<string>();
</script>

<script lang="ts">
	import * as Alert from '$lib/components/ui/alert';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

	interface Props {
		questionId: string;
		reason: string;
	}

	let { questionId, reason }: Props = $props();

	/**
	 * A question that cannot be drawn is never skipped: continuing past it would submit an
	 * anamnesis missing an answer nobody was asked for, and RxScale would refuse it with a 400
	 * the visitor cannot act on. The screen shows this instead, and the id and the reason go to
	 * the console. No answer ever does.
	 */
	$effect(() => {
		if (reported.has(questionId)) return;
		reported.add(questionId);
		console.error(`Questionnaire: cannot render "${questionId}": ${reason}`);
	});
</script>

<Alert.Root variant="destructive" role="alert">
	<TriangleAlertIcon aria-hidden="true" />
	<Alert.Title>This question cannot be shown</Alert.Title>
	<Alert.Description>
		Something is wrong with the questionnaire, so it cannot continue past this question.
		Please contact support@solean.com.
	</Alert.Description>
</Alert.Root>
