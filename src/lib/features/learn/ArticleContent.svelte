<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import ArticleCallout from './sections/ArticleCallout.svelte';
	import ArticleChecklist from './sections/ArticleChecklist.svelte';
	import ArticleFaq from './ArticleFaq.svelte';
	import ArticleSources from './ArticleSources.svelte';
	import ArticleProse from './sections/ArticleProse.svelte';
	import ComparisonTable from './sections/ComparisonTable.svelte';
	import MakerCards from './sections/MakerCards.svelte';
	import type { Article } from './types';

	interface Props {
		article: Article;
	}

	let { article }: Props = $props();

	const profiles = $derived(article.comparison.profiles);

	const comparison = $derived({
		columns: profiles.map((profile) => profile.treatment.name),
		rows: [
			{
				label: m.learn_row_active_ingredient(),
				cells: profiles.map((profile) => profile.activeIngredient)
			},
			{
				label: m.learn_row_manufacturer(),
				cells: profiles.map((profile) => profile.manufacturer)
			},
			{
				label: m.learn_row_frequency(),
				cells: profiles.map((profile) => profile.frequency)
			},
			{
				label: m.learn_row_main_action(),
				cells: profiles.map((profile) => profile.mainAction)
			},
			{
				label: m.learn_row_result_claim(),
				cells: profiles.map((profile) => profile.treatment.claim)
			}
		]
	});
</script>

<!--
	The composer. It owns the section ids the contents list anchors to and maps the article's
	fields onto components that know nothing about articles. In 26c this mapping is replaced by
	the block registry and the components below do not change.

	Every section is guarded on its own content, per the rule in `project-overview.md`: an
	article that fills fewer of them renders shorter rather than printing empty headings.
-->
<div class="flex flex-col gap-12">
	{#if article.quickAnswer.length > 0}
		<ArticleCallout id="quick-answer" heading={m.learn_h_quick()} paragraphs={article.quickAnswer} />
	{/if}

	{#if profiles.length >= 2}
		<ComparisonTable
			id="at-a-glance"
			heading={m.learn_h_glance({ a: profiles[0].treatment.name, b: profiles[1].treatment.name })}
			caption={m.learn_table_comparison({
				a: profiles[0].treatment.name,
				b: profiles[1].treatment.name
			})}
			columns={comparison.columns}
			rows={comparison.rows}
		/>
	{/if}

	{#if article.howTheyWork.length > 0}
		<ArticleProse id="how-they-work" heading={m.learn_h_how()} paragraphs={article.howTheyWork} />
	{/if}

	{#if article.expectedResults.length > 0}
		<ArticleProse
			id="expected-results"
			heading={m.learn_h_results()}
			paragraphs={article.expectedResults}
		/>
	{/if}

	{#if article.sideEffects.items.length > 0}
		<ArticleChecklist
			id="side-effects"
			heading={m.learn_h_side_effects()}
			intro={article.sideEffects.intro}
			items={article.sideEffects.items}
		/>
	{/if}

	{#if article.manufacturers.length >= 2}
		<MakerCards
			id="manufacturers"
			heading={m.learn_h_manufacturers({
				a: article.manufacturers[0].treatment.name,
				b: article.manufacturers[1].treatment.name
			})}
			cards={article.manufacturers.map((profile) => ({
				name: profile.manufacturer,
				eyebrow: profile.manufacturerLabel,
				body: profile.manufacturerBody
			}))}
		/>
	{/if}

	{#if article.faqs.length > 0}
		<ArticleFaq id="faqs" heading={m.learn_faq_heading()} items={article.faqs} />
	{/if}

	<!-- Guarded on the sources rather than on the summary, so the section and the contents list
	     entry that points at it appear and disappear together. -->
	{#if article.sources.length > 0}
		<ArticleSources
			id="sources"
			heading={m.learn_sources_heading()}
			summary={article.sourcesSummary}
			sources={article.sources}
			reviewer={article.review.reviewer.name}
			nextReviewAt={article.review.nextReviewAt}
		/>
	{/if}
</div>
