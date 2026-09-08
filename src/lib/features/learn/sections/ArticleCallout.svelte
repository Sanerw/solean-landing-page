<script lang="ts">
	interface Props {
		id: string;
		heading: string;
		paragraphs: readonly string[];
	}

	let { id, heading, paragraphs }: Props = $props();
</script>

<!--
	The same content as a prose section, set against a gold rule. The artboard marks the answer a
	reader came for and nothing else this way, so it is a component rather than a flag on prose:
	one thing on the page carries it, and 26c gives an editor the choice per block.
-->
<section {id} class="scroll-mt-8 border-l-2 border-primary pl-6" aria-labelledby="{id}-title">
	<h2
		id="{id}-title"
		class="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
	>
		{heading}
	</h2>
	<div class="mt-3 flex flex-col gap-4 text-base leading-relaxed text-muted-foreground lg:text-lg">
		{#each paragraphs as paragraph (paragraph)}
			<p>{paragraph}</p>
		{/each}
	</div>
</section>
