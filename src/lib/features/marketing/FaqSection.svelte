<script lang="ts">
	import * as Accordion from '$lib/components/ui/accordion';
	import { CONTAINER } from './container';
	import { FAQ } from './content';
</script>

<section class={[CONTAINER, 'py-16 lg:py-20']} aria-label={FAQ.title}>
	<h2 class="font-display text-3xl font-medium text-foreground md:text-4xl lg:text-5xl">
		{FAQ.title}
	</h2>
	<p class="mt-2 text-base text-muted-foreground">{FAQ.lead}</p>

	<!-- First item open, as drawn. `single` so one answer is visible at a time. -->
	<!-- The adapted Accordion ships a boxed treatment (rounded-2xl + border). The reference
	     FAQ is not a box, it is hairline-separated rows on the page, so the box is removed
	     here at the call site and a top rule added above the first row. -->
	<Accordion.Root
		type="single"
		value={FAQ.items[0].question}
		class="mt-10 rounded-none border-0 border-t border-border"
	>
		{#each FAQ.items as item (item.question)}
			<Accordion.Item value={item.question} class="border-b border-border">
				<Accordion.Trigger class="rounded-none border-0 px-0 py-5 text-base font-medium hover:bg-transparent hover:text-highlight-foreground">
					{item.question}
				</Accordion.Trigger>
				<Accordion.Content class="px-0 pb-5 text-base text-muted-foreground">
					{item.answer}
				</Accordion.Content>
			</Accordion.Item>
		{/each}
	</Accordion.Root>
</section>
