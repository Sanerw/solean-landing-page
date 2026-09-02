<script lang="ts">
	import { localizeHref } from '$lib/paraglide/runtime';
	import LiveQuery from '$lib/sanity/LiveQuery.svelte';
	import { urlFor } from '$lib/sanity/image';
	import type { ArticleListItem } from '$lib/sanity/queries';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Sanity content · Solean</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
	<h1 class="font-display text-3xl">Sanity content</h1>
	<p class="text-muted-foreground mt-2">
		Articles in the <code>{data.params.language}</code> dataset, read through the Sanity client.
		A development surface for checking the connection, not a public route.
	</p>

	<LiveQuery data={data as never} previewEnabled={data.previewEnabled}>
		{#snippet children(articles: ArticleListItem[] | undefined)}
			{#if articles?.length}
				<ul class="mt-10 grid gap-6">
					{#each articles as article (article._id)}
						<li>
							<a
								class="border-border hover:bg-accent focus-visible:ring-ring focus-visible:ring-offset-background flex gap-4 rounded-2xl border p-4 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
								href={localizeHref(`/dev/sanity/${article.slug.current}`)}
							>
								{#if article.hero?.asset}
									<img
										class="h-20 w-20 shrink-0 rounded-xl object-cover"
										src={urlFor(article.hero).width(160).height(160).url()}
										alt={article.hero.alt ?? ''}
									/>
								{/if}
								<span>
									<span class="text-muted-foreground block text-sm">{article.category}</span>
									<span class="font-display block text-lg">{article.title}</span>
									<span class="text-muted-foreground mt-1 block text-sm">{article.summary}</span>
								</span>
							</a>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="text-muted-foreground mt-10">
					No articles in this locale yet. Add one in the Studio, or run the seed script in
					<code>studio-solean</code>.
				</p>
			{/if}
		{/snippet}
	</LiveQuery>
</main>
