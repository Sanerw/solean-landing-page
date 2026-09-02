<script lang="ts">
	import ArticleHero from '$lib/features/learn/ArticleHero.svelte';
	import ArticleContent from '$lib/features/learn/ArticleContent.svelte';
	import ArticleFaq from '$lib/features/learn/ArticleFaq.svelte';
	import ArticleSidebar from '$lib/features/learn/ArticleSidebar.svelte';
	import ArticleSources from '$lib/features/learn/ArticleSources.svelte';
	import ArticleToc from '$lib/features/learn/ArticleToc.svelte';
	import { toArticle } from '$lib/features/learn/from-sanity';
	import SiteHeader from '$lib/features/marketing/SiteHeader.svelte';
	import { BLEED, CONTAINER } from '$lib/features/marketing/container';
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
				<ArticleHero {article} />
				<div class={[CONTAINER, 'grid gap-12 py-16 lg:grid-cols-4 lg:py-24']}>
					<ArticleToc items={article.toc} />
					<ArticleContent {article} />
					<ArticleSidebar {article} />
				</div>
				<div class={[CONTAINER, 'grid gap-12 pb-16 lg:grid-cols-4 lg:pb-24']}>
					<div class="lg:col-span-3 lg:col-start-2">
						<ArticleFaq {article} />
						<div class="mt-16">
							<ArticleSources {article} />
						</div>
					</div>
				</div>
			</article>
		{/if}
	{/snippet}
</LiveQuery>
