<script lang="ts">
	import { dev } from '$app/environment';
	import ArticleHero from '$lib/features/learn/ArticleHero.svelte';
	import ArticleBody from '$lib/features/learn/ArticleBody.svelte';
	import ArticleNeighbours from '$lib/features/learn/ArticleNeighbours.svelte';
	import ArticleReviewNote from '$lib/features/learn/ArticleReviewNote.svelte';
	import ArticleToc from '$lib/features/learn/ArticleToc.svelte';
	import { tocFrom } from '$lib/features/learn/blocks';
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

	// A block this app cannot draw is always logged and only drawn where somebody can act on it:
	// an editor in the Presentation tool, or a developer. A reader gets the rest of the article.
	const showFailures = $derived(dev || data.previewEnabled);

	// The neighbours band closes the reading panel rather than opening its own, so the panel keeps
	// its bottom corners only when there is no band to hand them to.
	const hasNeighbours = $derived(Boolean(data.neighbours.previous || data.neighbours.next));
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
					<div class={['bg-card', hasNeighbours ? 'sm:rounded-t-xl' : PANEL_ROUND]}>
						<div class={[CONTAINER, 'py-12 lg:py-20']}>
							<div class="mx-auto flex max-w-6xl flex-col lg:flex-row lg:gap-16">
								<ArticleToc items={tocFrom(article.body)} />

								<div class="min-w-0 flex-1">
									<ArticleBody blocks={article.body} {showFailures} />

									<!-- Its own margin rather than a place in the body's rhythm: the note is
									     the document's, so it closes the column instead of joining the
									     sequence of blocks above it. -->
									<div class="mt-6">
										<ArticleReviewNote
											reviewer={article.review.reviewer.name}
											nextReviewAt={article.review.nextReviewAt}
										/>
									</div>
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
