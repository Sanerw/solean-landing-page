<script lang="ts">
	import ArticleHero from '$lib/features/learn/ArticleHero.svelte';
	import ArticleContent from '$lib/features/learn/ArticleContent.svelte';
	import ArticleFaq from '$lib/features/learn/ArticleFaq.svelte';
	import ArticleSidebar from '$lib/features/learn/ArticleSidebar.svelte';
	import ArticleSources from '$lib/features/learn/ArticleSources.svelte';
	import ArticleToc from '$lib/features/learn/ArticleToc.svelte';
	import SiteHeader from '$lib/features/marketing/SiteHeader.svelte';
	import { BLEED, CONTAINER } from '$lib/features/marketing/container';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.article.title} | Solean</title>
	<meta name="description" content={data.article.summary} />
</svelte:head>

<!--
	The landing page renders its header inside the hero card, which the bleed gutter insets
	by 12px from sm up and not at all below it. This wrapper reproduces exactly that, so the
	logo, the navigation and the CTA do not jump when a reader moves between the two pages.
-->
<div class={[BLEED, 'sm:py-3']}>
	<SiteHeader />
</div>

<article>
	<ArticleHero article={data.article} />
	<div class={[CONTAINER, 'grid gap-12 py-16 lg:grid-cols-4 lg:py-24']}>
		<ArticleToc items={data.article.toc} />
		<ArticleContent article={data.article} />
		<ArticleSidebar article={data.article} />
	</div>
	<div class={[CONTAINER, 'grid gap-12 pb-16 lg:grid-cols-4 lg:pb-24']}>
		<div class="lg:col-span-3 lg:col-start-2">
			<ArticleFaq article={data.article} />
			<div class="mt-16">
				<ArticleSources article={data.article} />
			</div>
		</div>
	</div>
</article>
