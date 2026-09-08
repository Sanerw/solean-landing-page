<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import { formatArticleDate } from './format-article-date';

	interface Props {
		/** Empty when nobody has reviewed the article. The note is then not drawn at all. */
		reviewer: string;
		nextReviewAt?: string;
	}

	let { reviewer, nextReviewAt }: Props = $props();
</script>

<!--
	Who signed the article off and when it is next due. Rendered by the page rather than by the
	sources block, because that is whose data it is: the reviewer and the review date are the
	document's, and a block that printed them would be reaching past its own content for them.

	It closes the reading column, which for an article ending on its sources is exactly where it
	sat before: under them.

	**Nothing is drawn without a reviewer.** This panel claims a clinical review, with a shield
	and "Fachlich auf Richtigkeit geprüft" over it. An article nobody has reviewed may not make
	that claim, and making it with an empty name would be worse than not making it: it reads as
	a page that failed to load rather than as an article awaiting review.

	The date is guarded separately, because the two absences are different. A reviewer with no
	next review date has been reviewed, and simply has no date to announce.
-->
{#if reviewer}
	<div class="flex items-center gap-3 rounded-sm bg-accent p-4">
		<ShieldCheckIcon aria-hidden="true" class="size-6 shrink-0 text-foreground" />
		<div>
			<p class="font-display text-base font-semibold text-foreground">{m.learn_reviewed_title()}</p>
			<p class="text-sm text-muted-foreground">
				{#if nextReviewAt}
					{m.learn_reviewed_body({ reviewer })}
					<time datetime={nextReviewAt}>{formatArticleDate(nextReviewAt)}</time>.
				{:else}
					{m.learn_reviewed_body_undated({ reviewer })}
				{/if}
			</p>
		</div>
	</div>
{/if}
