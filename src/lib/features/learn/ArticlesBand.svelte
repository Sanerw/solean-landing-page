<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import ArticleCard from './ArticleCard.svelte';
	import { CONTAINER, SECTION_Y } from '$lib/features/marketing/container';
	import { categoriesOf, inCategory, type JournalArticle } from './journal';

	interface Props {
		articles: readonly JournalArticle[];
	}

	let { articles }: Props = $props();

	// `null` is the all-guides chip. Filtering happens here rather than in the URL because the
	// whole list is already loaded: a round trip would buy nothing a reader can see.
	let selected = $state<string | null>(null);

	const categories = $derived(categoriesOf(articles));
	const shown = $derived(inCategory(articles, selected));

	const chip =
		'h-13 shrink-0 rounded-full border px-6 text-base font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';
</script>

<section class={[CONTAINER, SECTION_Y]} aria-labelledby="journal-articles-heading">
	<div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
		<div class="flex flex-col items-start gap-4">
			<p
				class="rounded-full border border-border bg-surface-warm px-4 py-2 text-sm font-semibold text-muted-foreground"
			>
				{m.journal_latest_from()}
			</p>
			<h2
				id="journal-articles-heading"
				class="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl lg:text-5xl"
			>
				{m.journal_articles_heading()}
			</h2>
		</div>

		<!--
			A group rather than a tablist: these chips filter a list that is already on the page,
			they do not switch between panels, and the arrow-key contract a tablist promises
			would be a promise this does not keep.
		-->
		<div
			role="group"
			aria-label={m.journal_filter_label()}
			class="-mx-4 flex gap-3 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0"
		>
			<button
				type="button"
				aria-pressed={selected === null}
				onclick={() => (selected = null)}
				class={[
					chip,
					selected === null
						? 'border-foreground bg-foreground text-background'
						: 'border-border bg-card text-muted-foreground hover:text-foreground'
				]}
			>
				{m.journal_all_guides()}
			</button>
			{#each categories as category (category)}
				<button
					type="button"
					aria-pressed={selected === category}
					onclick={() => (selected = category)}
					class={[
						chip,
						selected === category
							? 'border-foreground bg-foreground text-background'
							: 'border-border bg-card text-muted-foreground hover:text-foreground'
					]}
				>
					{category}
				</button>
			{/each}
		</div>
	</div>

	<ul class="mt-10 grid gap-8 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3">
		{#each shown as article (article.id)}
			<li class="flex">
				<ArticleCard {article} />
			</li>
		{/each}
	</ul>
</section>
