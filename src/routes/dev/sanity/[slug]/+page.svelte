<script lang="ts">
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

				{#if article.quickAnswer?.length}
					<h2 class="font-display mt-12 text-xl">Quick answer</h2>
					{#each article.quickAnswer as paragraph, index (index)}
						<p class="mt-3">{paragraph}</p>
					{/each}
				{/if}

				{#if article.treatmentProfiles?.length}
					<h2 class="font-display mt-12 text-xl">At a glance</h2>
					<div class="mt-4 overflow-x-auto">
						<table class="w-full text-left text-sm">
							<thead>
								<tr class="border-border border-b">
									<th class="py-2 pr-4 font-medium">Treatment</th>
									<th class="py-2 pr-4 font-medium">Active ingredient</th>
									<th class="py-2 pr-4 font-medium">Maker</th>
									<th class="py-2 font-medium">Frequency</th>
								</tr>
							</thead>
							<tbody>
								{#each article.treatmentProfiles as profile (profile._key)}
									<tr class="border-border border-b">
										<td class="py-2 pr-4">{profile.treatmentId}</td>
										<td class="py-2 pr-4">{profile.activeIngredient}</td>
										<td class="py-2 pr-4">{profile.manufacturer}</td>
										<td class="py-2">{profile.frequency}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}

				{#if article.sideEffects?.items?.length}
					<h2 class="font-display mt-12 text-xl">Side effects</h2>
					{#if article.sideEffects.intro}
						<p class="mt-3">{article.sideEffects.intro}</p>
					{/if}
					<ul class="mt-3 list-disc pl-5">
						{#each article.sideEffects.items as item, index (index)}
							<li>{item}</li>
						{/each}
					</ul>
				{/if}

				{#if article.faqs?.length}
					<h2 class="font-display mt-12 text-xl">FAQs</h2>
					{#each article.faqs as faq (faq._key)}
						<h3 class="mt-6 font-medium">{faq.question}</h3>
						<p class="text-muted-foreground mt-1">{faq.answer}</p>
					{/each}
				{/if}

				{#if article.sources?.length}
					<h2 class="font-display mt-12 text-xl">Sources</h2>
					<ul class="mt-3 list-disc pl-5">
						{#each article.sources as source (source._key)}
							<li>
								{#if source.href}
									<a class="hover:underline" href={source.href}>{source.label}</a>
								{:else}
									{source.label}
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			{/if}
		{/snippet}
	</LiveQuery>
</main>
