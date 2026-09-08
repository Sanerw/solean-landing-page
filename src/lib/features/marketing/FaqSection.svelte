<script lang="ts">
	import * as Accordion from '$lib/components/ui/accordion';
	import { CONTAINER, SECTION_Y } from './container';
	import { SECTION_HEADING, SECTION_LEAD, type FaqContent } from './type';
	import {
		SECTION_HEADING as COMPACT_HEADING,
		SECTION_LEAD as COMPACT_LEAD,
		SECTION_Y as COMPACT_Y
	} from '$lib/features/treatments/type';

	interface Props {
		// `FaqContent`, not the Sanity type this used to name: the treatment pages pass a
		// repository fixture and the landing page passes a Sanity document, and both satisfy it.
		faq: FaqContent;
		/**
		 * The treatment pages set their headings one step below the landing page's, because the
		 * artboards do: 48px there against 64px here. A boolean rather than a class prop, so a
		 * caller chooses a scale the design system defines instead of passing arbitrary styling
		 * into a shared component.
		 */
		compact?: boolean;
	}

	const { faq, compact = false }: Props = $props();

	const FAQ = $derived(faq);
	const heading = $derived(compact ? COMPACT_HEADING : SECTION_HEADING);
	const lead = $derived(compact ? COMPACT_LEAD : SECTION_LEAD);
	const rhythm = $derived(compact ? COMPACT_Y : SECTION_Y);
</script>

<section class={[CONTAINER, rhythm]} aria-label={FAQ.title}>
	<h2 class={heading}>
		{FAQ.title}
	</h2>
	<p class={lead}>{FAQ.lead}</p>

	<!-- Every row starts closed, so the section opens at one consistent height. `single`
	     so one answer is visible at a time. -->
	<!-- The adapted Accordion ships a boxed treatment (rounded-2xl + border). The reference
	     FAQ is not a box, it is hairline-separated rows on the page, so the box is removed
	     here at the call site and a top rule added above the first row. -->
	<Accordion.Root
		type="single"
		class={[compact ? 'mt-6' : 'mt-10', 'rounded-none border-0 border-t border-border']}
	>
		{#each FAQ.items as item (item.question)}
			<Accordion.Item value={item.question} class="border-b border-border">
				<Accordion.Trigger
					class={[
						'rounded-none border-0 px-0 font-medium hover:bg-transparent hover:text-highlight-foreground',
						compact ? 'py-4 text-sm md:text-base' : 'py-5 text-base'
					]}
				>
					{item.question}
				</Accordion.Trigger>
				<Accordion.Content
					class={[
						'px-0 text-muted-foreground',
						compact ? 'pb-4 text-sm' : 'pb-5 text-base'
					]}
				>
					{item.answer}
				</Accordion.Content>
			</Accordion.Item>
		{/each}
	</Accordion.Root>
</section>
