<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import { ROUTES } from '$lib/features/marketing/content';
	import { localizeHref } from '$lib/paraglide/runtime';
	import type { JournalArticle } from './journal';

	interface Props {
		article: JournalArticle;
	}

	let { article }: Props = $props();

	const href = $derived(localizeHref(ROUTES.learnArticle(article.slug)));
</script>

<!-- One link over the card, for the reason the featured card gives. -->
<a
	{href}
	aria-label={m.journal_open_article({ title: article.title })}
	class="group flex flex-1 flex-col gap-3.5 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
>
	{#if article.hero}
		<img
			src={article.hero.src}
			srcset={article.hero.srcset}
			width={article.hero.width}
			height={article.hero.height}
			sizes="(min-width: 1024px) 33vw, 100vw"
			alt=""
			aria-hidden="true"
			class="aspect-4/3 w-full rounded-xl object-cover"
		/>
	{/if}

	<p class="flex flex-wrap items-center gap-x-2 text-xs font-semibold text-muted-foreground">
		<span>{article.category}</span>
		{#if article.readTimeMinutes}
			<span aria-hidden="true">&middot;</span>
			<span>{m.learn_read_time({ minutes: article.readTimeMinutes })}</span>
		{/if}
	</p>

	<h3 class="text-balance font-display text-xl font-medium leading-tight text-foreground">
		{article.title}
	</h3>

	<p class="text-sm text-muted-foreground">{article.summary}</p>

	<span
		aria-hidden="true"
		class="mt-auto inline-flex items-center gap-1.5 pt-1 text-sm font-semibold text-foreground group-hover:text-highlight-foreground"
	>
		{m.journal_read_article()}
		<ArrowRightIcon class="size-4" />
	</span>
</a>
