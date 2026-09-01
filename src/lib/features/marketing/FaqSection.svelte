<script lang="ts">
	import * as Accordion from '$lib/components/ui/accordion';
	import { CONTAINER, SECTION_Y } from './container';
	import { SECTION_HEADING, SECTION_LEAD } from './type';
	import { faq } from './content';

	// Read during render so the copy follows the active locale.
	const FAQ = $derived(faq());
</script>

<section class={[CONTAINER, SECTION_Y]} aria-label={FAQ.title}>
	<h2 class={SECTION_HEADING}>
		{FAQ.title}
	</h2>
	<p class={SECTION_LEAD}>{FAQ.lead}</p>

	<!-- Every row starts closed, so the section opens at one consistent height. `single`
	     so one answer is visible at a time. -->
	<!-- The adapted Accordion ships a boxed treatment (rounded-2xl + border). The reference
	     FAQ is not a box, it is hairline-separated rows on the page, so the box is removed
	     here at the call site and a top rule added above the first row. -->
	<Accordion.Root
		type="single"
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
