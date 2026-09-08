<script lang="ts">
	interface Props {
		id: string;
		heading: string;
		paragraphs: readonly string[];
	}

	let { id, heading, paragraphs }: Props = $props();
</script>

<!--
	A heading and its paragraphs, which is what most of the article is. It takes the shape it
	draws rather than the article, because 26c hands it a block instead of a named field.
-->
<section {id} class="scroll-mt-8" aria-labelledby="{id}-title">
	<h2
		id="{id}-title"
		class="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
	>
		{heading}
	</h2>
	<div class="mt-4 flex flex-col gap-4 text-base leading-relaxed text-muted-foreground lg:text-lg">
		{#each paragraphs as paragraph (paragraph)}
			<p>{paragraph}</p>
		{/each}
	</div>
</section>
