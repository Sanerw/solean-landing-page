<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import * as Accordion from '$lib/components/ui/accordion';
	import type { Article } from './types';

	interface Props {
		article: Article;
	}

	let { article }: Props = $props();
</script>

<section id="faqs" class="scroll-mt-6" aria-labelledby="article-faq-title">
	<h2 id="article-faq-title" class="font-display text-3xl font-medium text-foreground md:text-4xl">
		{m.learn_faq_heading()}
	</h2>
	<Accordion.Root type="single" class="mt-8 rounded-none border-0 border-t border-border">
		{#each article.faqs as item, index (item.question)}
			<Accordion.Item value={item.question} class="border-b border-border">
				<Accordion.Trigger
					id="article-faq-trigger-{index}"
					aria-controls="article-faq-panel-{index}"
					class="rounded-none border-0 px-0 py-5 text-base font-medium hover:bg-transparent hover:text-highlight-foreground"
				>
					{item.question}
				</Accordion.Trigger>
				<Accordion.Content
					id="article-faq-panel-{index}"
					role="region"
					aria-labelledby="article-faq-trigger-{index}"
					class="px-0 pb-5 text-base leading-relaxed text-muted-foreground"
				>
					{item.answer}
				</Accordion.Content>
			</Accordion.Item>
		{/each}
	</Accordion.Root>
</section>
