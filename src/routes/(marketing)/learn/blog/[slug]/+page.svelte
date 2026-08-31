<script lang="ts">
	import ArticleHero from '$lib/features/learn/ArticleHero.svelte';
	import ArticleContent from '$lib/features/learn/ArticleContent.svelte';
	import ArticleFaq from '$lib/features/learn/ArticleFaq.svelte';
	import ArticleSidebar from '$lib/features/learn/ArticleSidebar.svelte';
	import ArticleToc from '$lib/features/learn/ArticleToc.svelte';
	import RelatedGuides from '$lib/features/learn/RelatedGuides.svelte';
	import SiteHeader from '$lib/features/marketing/SiteHeader.svelte';
	import { BLEED, CONTAINER } from '$lib/features/marketing/container';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.article.title} | Solean</title>
	<meta name="description" content={data.article.summary} />
</svelte:head>

<div class={[BLEED, 'py-3']}>
	<SiteHeader />
</div>

<article>
	<ArticleHero article={data.article} />
	<div class={[CONTAINER, 'grid gap-12 py-16 lg:grid-cols-4 lg:py-24']}>
		<ArticleToc items={data.article.toc} />
		<ArticleContent article={data.article} />
		<ArticleSidebar article={data.article} />
	</div>
	<div class={[CONTAINER, 'pb-16 lg:pb-24']}>
		<ArticleFaq article={data.article} />
	</div>
	<RelatedGuides guides={data.article.related} />
</article>
