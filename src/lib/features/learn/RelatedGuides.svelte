<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import { BLEED, CONTAINER } from '$lib/features/marketing/container';
	import type { RelatedArticlePreview } from './types';

	interface Props {
		guides: readonly RelatedArticlePreview[];
	}

	let { guides }: Props = $props();
</script>

<section class={BLEED} aria-labelledby="related-guides-title">
	<div class="rounded-xl bg-accent py-12 lg:py-16">
		<div class={[CONTAINER, 'grid gap-8 lg:grid-cols-4 lg:items-stretch']}>
			<div class="flex flex-col justify-center">
				<p class="text-xs font-semibold uppercase tracking-widest text-highlight-foreground">
					{m.learn_related_eyebrow()}
				</p>
				<h2 id="related-guides-title" class="mt-3 font-display text-3xl font-medium md:text-4xl">
					{m.learn_related_title()}
				</h2>
			</div>

			{#each guides as guide (guide.title)}
				<article class="flex min-h-48 flex-col rounded-lg bg-card p-6">
					<p class="text-xs font-semibold uppercase tracking-widest text-highlight-foreground">
						{guide.category}
					</p>
					<h3 class="mt-3 font-display text-xl font-semibold">{guide.title}</h3>
					{#if guide.href}
						<a
							href={guide.href}
							class="mt-auto inline-flex items-center gap-1 rounded-sm pt-6 text-sm font-semibold outline-none hover:text-highlight-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						>
							{m.learn_related_read()}
							<ArrowRightIcon aria-hidden="true" class="size-4" />
						</a>
					{:else}
						<span class="mt-auto pt-6 text-sm font-semibold text-text-tertiary">
							{m.learn_related_preview()}
						</span>
					{/if}
				</article>
			{/each}
		</div>
	</div>
</section>
