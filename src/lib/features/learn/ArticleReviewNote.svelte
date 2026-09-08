<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import { formatArticleDate } from './format-article-date';

	interface Props {
		reviewer: string;
		nextReviewAt: string;
	}

	let { reviewer, nextReviewAt }: Props = $props();
</script>

<!--
	Who signed the article off and when it is next due. Rendered by the page rather than by the
	sources block, because that is whose data it is: the reviewer and the review date are the
	document's, and a block that printed them would be reaching past its own content for them.

	It closes the reading column, which for an article ending on its sources is exactly where it
	sat before: under them.
-->
<div class="flex items-center gap-3 rounded-sm bg-accent p-4">
	<ShieldCheckIcon aria-hidden="true" class="size-6 shrink-0 text-foreground" />
	<div>
		<p class="font-display text-base font-semibold text-foreground">{m.learn_reviewed_title()}</p>
		<p class="text-sm text-muted-foreground">
			{m.learn_reviewed_body({ reviewer })}
			<time datetime={nextReviewAt}>{formatArticleDate(nextReviewAt)}</time>.
		</p>
	</div>
</div>
