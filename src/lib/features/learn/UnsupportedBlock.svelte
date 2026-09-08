<script lang="ts" module>
	/** One report per block type, so a body holding three of them does not print three lines. */
	const reported = new Set<string>();
</script>

<script lang="ts">
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

	interface Props {
		type: string;
		reason: string;
		/** Drawn for whoever can act on it: an editor in preview, a developer in dev. */
		show: boolean;
	}

	let { type, reason, show }: Props = $props();

	/**
	 * A block this app cannot draw is a section of an article that would otherwise go missing in
	 * silence, so it is always reported. It is only *drawn* where somebody can act on it: an
	 * editor previewing their own page, or a developer. A reader of a marketing article is shown
	 * nothing, because a defect report is not what they came for and nothing here is unsafe to
	 * omit. That is the difference from the questionnaire, where a question that cannot be drawn
	 * stops the flow rather than shortening it.
	 */
	$effect(() => {
		if (reported.has(type)) return;
		reported.add(type);
		console.error(`Article: ${reason}`);
	});
</script>

{#if show}
	<div
		role="alert"
		class="flex items-start gap-3 rounded-sm border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive-text"
	>
		<TriangleAlertIcon aria-hidden="true" class="mt-0.5 size-5 shrink-0" />
		<div>
			<p class="font-semibold">This block cannot be shown</p>
			<p class="mt-1">{reason}. Nobody outside preview sees this message.</p>
		</div>
	</div>
{/if}
