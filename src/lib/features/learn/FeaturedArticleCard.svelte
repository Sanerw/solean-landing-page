<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import StethoscopeIcon from '@lucide/svelte/icons/stethoscope';
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

	<!-- The corner, as the artboard draws it. Decoration inside the one link over the card, so
	     it is not a second tab stop: it says the card opens rather than doing the opening. -->
	<span
		aria-hidden="true"
		class="absolute right-6 top-6 flex size-12 items-center justify-center rounded-full bg-background/90 text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground sm:right-10 sm:top-10 sm:size-16"
	>
		<ArrowUpRightIcon class="size-5 sm:size-7" />
	</span>

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

		<div
			class="mt-2 flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-3 text-xs font-semibold text-background"
		>
			<div class="flex items-center gap-x-6 gap-y-2">
				{#if article.reviewer}
					<span class="flex items-center gap-2">
						<!-- The same pairing as the article's hero: the doctor's face when there is one,
						     and the artboard's stethoscope when there is not. -->
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
						{:else}
							<span
								aria-hidden="true"
								class="flex size-8 items-center justify-center rounded-full bg-surface-warm text-foreground"
							>
								<StethoscopeIcon class="size-4" />
							</span>
						{/if}
						{m.journal_reviewed_by({ reviewer: article.reviewer.name })}
					</span>

					{#if article.readTimeMinutes}
						<span aria-hidden="true" class="hidden h-5 w-px bg-background/35 sm:block"></span>
					{/if}
				{/if}
				{#if article.readTimeMinutes}
					<span class="flex items-center gap-1.5">
						<ClockIcon aria-hidden="true" class="size-4" />
						{m.learn_read_time({ minutes: article.readTimeMinutes })}
					</span>
				{/if}
			</div>

			<!-- The narrow artboard drops the chips and keeps everything else, so they start at
			     `sm`. `tagsOf` guarantees at least one, so the row is never empty. -->
			<ul class="hidden flex-wrap items-center gap-2 sm:flex">
				{#each article.tags as tag (tag)}
					<li class="rounded-full border border-background/40 bg-background/15 px-4 py-1.5">
						{tag}
					</li>
				{/each}
			</ul>
		</div>
	</div>
</a>
