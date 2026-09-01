<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import * as Alert from '$lib/components/ui/alert';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import { formatArticleDate } from './format-article-date';
	import type { Article } from './types';

	interface Props {
		article: Article;
	}

	let { article }: Props = $props();
</script>

<!--
	The artboard closes the article on this, in the main column under the FAQ, rather than
	in the sidebar: it is the last thing read, not a reference panel beside the reading.
-->
<section id="sources" class="scroll-mt-6" aria-labelledby="sources-title">
	<h2 id="sources-title" class="font-display text-3xl font-medium text-foreground">
		{m.learn_sources_heading()}
	</h2>

	<p class="mt-4 text-sm leading-relaxed text-muted-foreground">
		{article.sourcesSummary}
	</p>

	<ul class="mt-4 space-y-2 text-sm text-muted-foreground">
		{#each article.sources as source (source.label)}
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

	<Alert.Root class="mt-6">
		<ShieldCheckIcon aria-hidden="true" />
		<Alert.Title>{m.learn_reviewed_title()}</Alert.Title>
		<Alert.Description>
			{m.learn_reviewed_body({ reviewer: article.review.reviewer.name })}
			<time datetime={article.review.nextReviewAt}>
				{formatArticleDate(article.review.nextReviewAt)}
			</time>.
		</Alert.Description>
	</Alert.Root>
</section>
