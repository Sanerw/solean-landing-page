<script lang="ts">
	import { localizeHref } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';
	import { Button } from '$lib/components/ui/button';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import { ROUTES } from '$lib/features/marketing/content';
	import type { Article } from './types';

	interface Props {
		article: Article;
	}

	let { article }: Props = $props();
</script>

<aside class="space-y-4 lg:sticky lg:top-6 lg:self-start" aria-label={m.learn_sidebar_label()}>
	<section class="rounded-lg bg-highlight p-6" aria-labelledby="takeaways-title">
		<div class="flex items-center gap-2">
			<SparklesIcon aria-hidden="true" class="size-5 text-highlight-foreground" />
			<h2 id="takeaways-title" class="font-display text-xl font-semibold">{m.learn_key_takeaways()}</h2>
		</div>
		<ul class="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground marker:text-highlight-foreground">
			{#each article.keyTakeaways as takeaway (takeaway)}
				<li class="pl-1">{takeaway}</li>
			{/each}
		</ul>
	</section>

	<section class="rounded-lg bg-foreground p-6 text-background" aria-labelledby="eligibility-title">
		<h2 id="eligibility-title" class="font-display text-xl font-semibold">
			{m.learn_sidebar_question()}
		</h2>
		<p class="mt-3 text-sm text-background/80">
			{m.learn_sidebar_body()}
		</p>
		<Button href={localizeHref(ROUTES.questionnaire)} class="mt-5 w-full">{m.learn_sidebar_cta()}</Button>
	</section>

	<!-- The artboard's third card. The sources themselves close the article in the main
	     column instead, so this states the standard rather than listing the evidence. -->
	<section class="rounded-lg bg-secondary p-6" aria-labelledby="standards-title">
		<h2 id="standards-title" class="font-display text-base font-semibold">
			{m.learn_standards_title()}
		</h2>
		<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
			{m.learn_standards_body()}
		</p>
	</section>
</aside>
