<script lang="ts">
	import ArticleHero from '$lib/features/learn/ArticleHero.svelte';
	import ArticleContent from '$lib/features/learn/ArticleContent.svelte';
	import ArticleNeighbours from '$lib/features/learn/ArticleNeighbours.svelte';
	import ArticleToc from '$lib/features/learn/ArticleToc.svelte';
	import { toArticle } from '$lib/features/learn/from-sanity';
	import SiteHeader from '$lib/features/marketing/SiteHeader.svelte';
	import { BLEED, CONTAINER, PANEL_ROUND } from '$lib/features/marketing/container';
	import LiveQuery from '$lib/sanity/LiveQuery.svelte';
	import type { ArticleDetail } from '$lib/sanity/queries';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// The head reads the server's copy rather than the live one: `<svelte:head>` belongs at the
	// top level of a component, and a title that follows every keystroke in the Studio would buy
	// nothing a search engine ever sees.
	const document = $derived(data.options.initial.data);
</script>

<svelte:head>
	<title>{document?.seoTitle ?? document?.title} | Solean</title>
	<meta name="description" content={document?.seoDescription ?? document?.summary ?? ''} />
</svelte:head>

<!--
	The landing page renders its header inside the hero card, which the bleed gutter insets
	by 12px from sm up and not at all below it. This wrapper reproduces exactly that, so the
	logo, the navigation and the CTA do not jump when a reader moves between the two pages.
-->
<div class={[BLEED, 'sm:py-3']}>
	<SiteHeader />
</div>

<LiveQuery data={data as never} previewEnabled={data.previewEnabled}>
	{#snippet children(doc: ArticleDetail | undefined)}
		{#if doc}
			{@const article = toArticle(doc)}
			<article>
				<ArticleHero {article} next={data.neighbours.next} />

				<!--
					One panel, one reading column. The artboard sets the column against the contents
					list and centres the pair, rather than running the text the width of the page:
					the measure is a line length, so it does not grow with the viewport, and the
					right margin the old sidebar filled is now margin.
				-->
				<section class={[BLEED, 'sm:pt-6']} aria-label={article.title}>
					<div class={['bg-card', PANEL_ROUND]}>
						<div class={[CONTAINER, 'py-12 lg:py-20']}>
							<div class="mx-auto flex max-w-6xl flex-col lg:flex-row lg:gap-16">
								<ArticleToc items={article.toc} />

								<div class="min-w-0 flex-1">
									<ArticleContent {article} />
								</div>
							</div>
						</div>
					</div>
				</section>
			</article>
		{/if}
	{/snippet}
</LiveQuery>

<!--
	Outside the live query on purpose: the neighbours are not this article's content, so a
	keystroke in the Studio should not send the library round again.
-->
<ArticleNeighbours previous={data.neighbours.previous} next={data.neighbours.next} />
