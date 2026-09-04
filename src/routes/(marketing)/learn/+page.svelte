<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import ArticlesBand from '$lib/features/learn/ArticlesBand.svelte';
	import FeaturedArticleCard from '$lib/features/learn/FeaturedArticleCard.svelte';
	import JournalHero from '$lib/features/learn/JournalHero.svelte';
	import SiteHeader from '$lib/features/marketing/SiteHeader.svelte';
	import { splitJournal } from '$lib/features/learn/journal';
	import { BLEED, CONTAINER, PANEL_ROUND } from '$lib/features/marketing/container';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const { featured, rest } = $derived(splitJournal(data.articles));
</script>

<svelte:head>
	<title>{m.title_journal()}</title>
	<meta name="description" content={m.meta_journal()} />
</svelte:head>

<!--
	The header sits inside the page rather than in the marketing layout, the same way the legal
	pages carry it: the landing page renders the overlay variant inside its hero, so a shared
	header would make one of the two wrong.
-->
<div class={[BLEED, 'sm:py-3']}>
	<SiteHeader />
</div>

<section class={BLEED} aria-labelledby="journal-heading">
	<div class={['bg-surface-warm', PANEL_ROUND]}>
		<JournalHero />

		<!--
			Guarded, like every Sanity-fed section on this site: an empty dataset should cost the
			reader this card and nothing else, never the page.
		-->
		{#if featured}
			<div class={[CONTAINER, 'pb-10 lg:pb-14']}>
				<FeaturedArticleCard article={featured} />
			</div>
		{/if}
	</div>
</section>

<!--
	The band is the rest of the library, so with one article there is no rest and none of it is
	drawn: no heading promising more, no chips filtering a single item, no empty grid.
-->
{#if rest.length > 0}
	<ArticlesBand articles={rest} />
{/if}
