<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import { formatArticleDate } from './format-article-date';
	import type { ArticleSource } from './types';

	interface Props {
		id: string;
		heading: string;
		summary: string;
		sources: readonly ArticleSource[];
		/** The document's, not the section's: the note credits the article, not its evidence. */
		reviewer: string;
		nextReviewAt: string;
	}

	let { id, heading, summary, sources, reviewer, nextReviewAt }: Props = $props();
</script>

<!--
	The artboard closes the article on this, in the reading column under the FAQ, rather than
	in a sidebar: it is the last thing read, not a reference panel beside the reading.

	The artboard carries the prose and the review note and no list. The list stays: this is a
	medically reviewed article and its citations are evidence, not decoration. Dropping them
	would be an editorial decision, not a visual one.
-->
<section {id} class="scroll-mt-8" aria-labelledby="{id}-title">
	<h2 id="{id}-title" class="font-display text-2xl font-semibold tracking-tight text-foreground">
		{heading}
	</h2>

	<p class="mt-4 text-base leading-relaxed text-muted-foreground">{summary}</p>

	{#if sources.length > 0}
		<ul class="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
			{#each sources as source (source.label)}
				<li>
					{#if source.href}
						<a
							href={source.href}
							target="_blank"
							rel="noopener noreferrer"
							class="rounded-sm underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
						>
							{source.label}
						</a>
					{:else}
						<span>{source.label}</span>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}

	<div class="mt-6 flex items-center gap-3 rounded-sm bg-accent p-4">
		<ShieldCheckIcon aria-hidden="true" class="size-6 shrink-0 text-foreground" />
		<div>
			<p class="font-display text-base font-semibold text-foreground">
				{m.learn_reviewed_title()}
			</p>
			<p class="text-sm text-muted-foreground">
				{m.learn_reviewed_body({ reviewer })}
				<time datetime={nextReviewAt}>{formatArticleDate(nextReviewAt)}</time>.
			</p>
		</div>
	</div>
</section>
