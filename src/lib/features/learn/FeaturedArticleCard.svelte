<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import { Badge } from '$lib/components/ui/badge';
	import { ROUTES } from '$lib/features/marketing/content';
	import { localizeHref } from '$lib/paraglide/runtime';
	import type { JournalArticle } from './journal';

	interface Props {
		article: JournalArticle;
	}

	let { article }: Props = $props();

	const href = $derived(localizeHref(ROUTES.learnArticle(article.slug)));
</script>

<!--
	One link over the whole card rather than a link per element: the title, the summary and the
	arrow all lead to the same article, so three tab stops to one destination would be three
	stops too many. The arrow is decoration inside it.
-->
<a
	{href}
	aria-label={m.journal_open_article({ title: article.title })}
	class="group relative isolate flex min-h-96 flex-col justify-end overflow-hidden rounded-xl p-6 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-warm sm:min-h-112 sm:p-10 lg:min-h-128"
>
	{#if article.hero}
		<img
			src={article.hero.src}
			srcset={article.hero.srcset}
			width={article.hero.width}
			height={article.hero.height}
			sizes="(min-width: 1024px) 1768px, 100vw"
			alt=""
			aria-hidden="true"
			class="absolute inset-0 -z-10 size-full object-cover"
		/>
	{/if}
	<!-- The same ramp the hero uses, for the same reason: the copy sits over a photograph
	     nobody chose for its contrast. -->
	<div
		aria-hidden="true"
		class="absolute inset-0 -z-10 bg-gradient-to-b from-scrim/40 via-scrim/70 to-scrim/95"
	></div>

	<div class="flex flex-col items-start gap-4">
		<!-- Gold, per the reference. The primitive has no primary variant and one card is a thin
		     reason to add one to a shared component, so the pairing is set here. -->
		<Badge
			class="rounded-full bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground"
		>
			{m.journal_featured_badge()}
		</Badge>

		<h2
			class="max-w-4xl text-balance font-display text-2xl font-medium leading-tight tracking-tight text-background sm:text-3xl lg:text-4xl"
		>
			{article.title}
		</h2>

		<p class="max-w-3xl text-sm text-background/85 md:text-base">{article.summary}</p>

		<div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-background">
			{#if article.reviewer}
				<span class="flex items-center gap-2">
					{#if article.reviewer.portrait}
						<img
							src={article.reviewer.portrait.src}
							srcset={article.reviewer.portrait.srcset}
							width={article.reviewer.portrait.width}
							height={article.reviewer.portrait.height}
							sizes="32px"
							alt=""
							aria-hidden="true"
							class="size-8 rounded-full object-cover"
						/>
					{/if}
					{m.journal_reviewed_by({ reviewer: article.reviewer.name })}
				</span>
			{/if}
			{#if article.readTimeMinutes}
				<span class="flex items-center gap-1.5">
					<ClockIcon aria-hidden="true" class="size-4" />
					{m.learn_read_time({ minutes: article.readTimeMinutes })}
				</span>
			{/if}
		</div>

		<!-- The reference sets the arrow against the article's tags. One category means one tag;
		     inventing a second to fill the row would be putting the artboard above the data. -->
		<div class="mt-2 flex w-full flex-wrap items-center justify-between gap-3">
			<span
				aria-hidden="true"
				class="inline-flex size-11 items-center justify-center rounded-full bg-background/15 text-background transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
			>
				<ArrowRightIcon class="size-5" />
			</span>
			<span
				class="rounded-full border border-background/30 px-3 py-1 text-xs font-semibold text-background"
			>
				{article.category}
			</span>
		</div>
	</div>
</a>
