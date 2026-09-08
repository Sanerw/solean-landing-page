<script lang="ts">
	import { rendererFor } from '$lib/features/learn/block-registry';
	import { toBlocks } from '$lib/features/learn/blocks';
	import { localizeHref } from '$lib/paraglide/runtime';
	import LiveQuery from '$lib/sanity/LiveQuery.svelte';
	import { urlFor } from '$lib/sanity/image';
	import type { ArticleDetail } from '$lib/sanity/queries';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.options.initial.data?.title ?? 'Article'} · Solean</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
	<!--
		Localised because the bare path is German: an unprefixed href would send the server load
		looking for German documents while the page around it is still rendering English.
	-->
	<a class="text-muted-foreground text-sm hover:underline" href={localizeHref('/dev/sanity')}>
		Back to the list
	</a>

	<LiveQuery data={data as never} previewEnabled={data.previewEnabled}>
		{#snippet children(article: ArticleDetail | undefined)}
			{#if article}
				<p class="text-muted-foreground mt-8 text-sm">{article.category}</p>
				<h1 class="font-display mt-1 text-3xl">{article.title}</h1>
				<p class="text-muted-foreground mt-3">{article.summary}</p>

				{#if article.reviewer}
					<p class="text-muted-foreground mt-4 text-sm">
						Reviewed by {article.reviewer.name}, {article.reviewer.role}, on {article.reviewedAt}
					</p>
				{/if}

				{#if article.hero?.asset}
					<img
						class="mt-8 w-full rounded-2xl object-cover"
						src={urlFor(article.hero).width(1200).url()}
						alt={article.hero.alt ?? ''}
					/>
				{/if}

				<!--
					The body as a model rather than as a page: what blocks the document holds, in
					order, with the anchor each one derives and whether this app can draw it. The
					article itself is at `/learn/blog/[slug]`; what is useful here is the shape.
				-->
				<h2 class="font-display mt-12 text-xl">Body</h2>
				{#each toBlocks(article.body) as block, index (index)}
					{@const found = rendererFor(block)}
					<div class="border-border mt-3 rounded-lg border p-3 text-sm">
						<p class="font-medium">
							{block.kind === 'unsupported' ? block.type : block.kind}
							{#if !found.entry}
								<span class="text-destructive-text">no renderer: {found.reason}</span>
							{/if}
						</p>
						{#if block.kind !== 'unsupported'}
							<p class="text-muted-foreground mt-1">
								{block.heading ?? 'no heading, continues the section above'}
								{#if block.id}<code class="ml-2">#{block.id}</code>{/if}
								{#if block.label && block.label !== block.heading}
									<span class="ml-2">contents: {block.label}</span>
								{/if}
							</p>
						{/if}
					</div>
				{:else}
					<p class="text-muted-foreground mt-3 text-sm">This article has no body yet.</p>
				{/each}
			{/if}
		{/snippet}
	</LiveQuery>
</main>
