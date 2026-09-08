<script lang="ts">
	import { rendererFor } from './block-registry';
	import UnsupportedBlock from './UnsupportedBlock.svelte';
	import type { ArticleBlock } from './types';

	interface Props {
		blocks: readonly ArticleBlock[];
		/** Whether a block that cannot be drawn is shown as well as logged. */
		showFailures?: boolean;
	}

	let { blocks, showFailures = false }: Props = $props();
</script>

<!--
	The composer. It knows the order of the blocks and nothing about what any of them means: the
	registry pairs a kind with its component, and the components know nothing about articles.

	This replaces the eight guarded sections that stood here until 26c. What it buys is that an
	article can hold two tables, no table, or a table between two paragraphs, without a deploy.
-->
<div class="flex flex-col gap-12">
	{#each blocks as block, index (index)}
		{@const found = rendererFor(block)}
		{#if found.entry}
			{@const Renderer = found.entry.component}
			<Renderer {...found.entry.props(block)} />
		{:else if block.kind === 'unsupported'}
			<UnsupportedBlock type={block.type} reason={found.reason} show={showFailures} />
		{/if}
	{/each}
</div>
