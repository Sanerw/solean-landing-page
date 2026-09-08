<script lang="ts">
	import MinusIcon from '@lucide/svelte/icons/minus';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import * as Accordion from '$lib/components/ui/accordion';

	interface Props {
		id: string;
		heading: string;
		items: readonly { question: string; answer: string }[];
	}

	let { id, heading, items }: Props = $props();
</script>

<section {id} class="scroll-mt-8" aria-labelledby="{id}-title">
	<h2
		id="{id}-title"
		class="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
	>
		{heading}
	</h2>

	<!--
		Cards rather than a divided list, per the artboard: each question is its own bordered
		box with a gap between. The root loses its own frame because the items carry theirs.
	-->
	<Accordion.Root type="single" class="mt-6 flex flex-col gap-3 rounded-none border-0">
		{#each items as item, index (item.question)}
			<Accordion.Item
				value={item.question}
				class="rounded-sm border border-border bg-card not-last:border-b"
			>
				<Accordion.Trigger
					id="{id}-trigger-{index}"
					aria-controls="{id}-panel-{index}"
					class="rounded-sm border-0 px-5 py-4 text-base font-semibold hover:bg-transparent hover:text-highlight-foreground"
				>
					{item.question}
					{#snippet icon()}
						<!-- Plus to minus rather than a rotating chevron, as drawn. Two glyphs, one
						     shown at a time, because a plus rotated 180 degrees is still a plus. -->
						<PlusIcon
							data-slot="accordion-trigger-icon"
							class="pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden"
						/>
						<MinusIcon
							data-slot="accordion-trigger-icon"
							class="pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:block"
						/>
					{/snippet}
				</Accordion.Trigger>
				<Accordion.Content
					id="{id}-panel-{index}"
					role="region"
					aria-labelledby="{id}-trigger-{index}"
					class="px-5 pb-4 text-base leading-relaxed text-muted-foreground"
				>
					{item.answer}
				</Accordion.Content>
			</Accordion.Item>
		{/each}
	</Accordion.Root>
</section>
