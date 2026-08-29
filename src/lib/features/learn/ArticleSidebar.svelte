<script lang="ts">
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import { ROUTES } from '$lib/features/marketing/content';
	import { formatArticleDate } from './format-article-date';
	import type { Article } from './types';

	interface Props {
		article: Article;
	}

	let { article }: Props = $props();
</script>

<aside class="space-y-4 lg:sticky lg:top-6 lg:self-start" aria-label="Article summary and standards">
	<section class="rounded-lg bg-highlight p-6" aria-labelledby="takeaways-title">
		<div class="flex items-center gap-2">
			<SparklesIcon aria-hidden="true" class="size-5 text-highlight-foreground" />
			<h2 id="takeaways-title" class="font-display text-xl font-semibold">Key takeaways</h2>
		</div>
		<ul class="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground marker:text-highlight-foreground">
			{#each article.keyTakeaways as takeaway (takeaway)}
				<li class="pl-1">{takeaway}</li>
			{/each}
		</ul>
	</section>

	<section class="rounded-lg bg-foreground p-6 text-background" aria-labelledby="eligibility-title">
		<h2 id="eligibility-title" class="font-display text-xl font-semibold">
			Not sure which treatment fits?
		</h2>
		<p class="mt-3 text-sm text-background/80">
			A clinical questionnaire will help a qualified prescriber assess suitability.
		</p>
		<Button href={ROUTES.questionnaire} class="mt-5 w-full">Check your eligibility</Button>
	</section>

	<section id="sources" class="scroll-mt-6 rounded-lg bg-secondary p-6" aria-labelledby="sources-title">
		<h2 id="sources-title" class="font-display text-xl font-semibold">Sources and medical review</h2>
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
			<Alert.Title>Clinically reviewed for accuracy</Alert.Title>
			<Alert.Description>
				Reviewed by {article.review.reviewer.name}. Next review due
				<time datetime={article.review.nextReviewAt}>
					{formatArticleDate(article.review.nextReviewAt)}
				</time>.
			</Alert.Description>
		</Alert.Root>

		<p class="mt-5 text-xs leading-relaxed text-text-faint">
			Prototype editorial content only. This page is not approved medical advice and does not
			replace assessment by a qualified clinician.
		</p>
	</section>
</aside>
