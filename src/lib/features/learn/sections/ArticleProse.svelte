<script lang="ts">
	interface Props {
		/** Absent together: a prose block with no heading continues the section above it. */
		id?: string;
		heading?: string;
		paragraphs: readonly string[];
	}

	let { id, heading, paragraphs }: Props = $props();
</script>

<!--
	A heading and its paragraphs, which is what most of the article is. It takes the shape it
	draws rather than the article, because 26c hands it a block instead of a named field.

	Without a heading it is paragraphs and nothing else: no `section`, because a section with no
	accessible name is a landmark a screen-reader user has to enter to identify, and no anchor,
	because the contents list has nothing to call it.
-->
{#snippet paragraphList(spacing: string)}
	<div class={[spacing, 'flex flex-col gap-4 text-base leading-relaxed text-muted-foreground lg:text-lg']}>
		{#each paragraphs as paragraph (paragraph)}
			<p>{paragraph}</p>
		{/each}
	</div>
{/snippet}

{#if heading}
	<section {id} class="scroll-mt-8" aria-labelledby="{id}-title">
		<h2
			id="{id}-title"
			class="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
		>
			{heading}
		</h2>
		{@render paragraphList('mt-4')}
	</section>
{:else}
	{@render paragraphList('')}
{/if}
