<script lang="ts">
	import { BLEED, CONTAINER } from '$lib/features/marketing/container';
	import SiteHeader from '$lib/features/marketing/SiteHeader.svelte';
	import type { LegalDocument, LegalLine, LegalSpan } from './types';

	interface Props {
		document: LegalDocument;
	}

	let { document }: Props = $props();
</script>

<!--
	The same header wrapper the Learn article uses, so the logo and navigation do not jump
	when a reader moves between pages.
-->
<div class={[BLEED, 'sm:py-3']}>
	<SiteHeader />
</div>

<!--
	`lang="de"` on the article, not on the page: the shell around it is English, and a screen
	reader that reads German legal text with an English voice is unusable. This is the seam
	feature 19 closes.
-->
<article lang="de" class={[CONTAINER, 'py-12 lg:py-16']}>
	<div class="mx-auto max-w-3xl">
		<h1 class="font-display text-3xl font-medium sm:text-4xl">{document.title}</h1>

		<div class="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
			{#each document.blocks as block, index (index)}
				{#if block.kind === 'paragraph'}
					<p>
						{#each block.lines as line, lineIndex (lineIndex)}
							{#if lineIndex > 0}<br />{/if}{@render spans(line)}
						{/each}
					</p>
				{:else}
					<ul class="list-disc space-y-2 ps-5">
						{#each block.items as item, itemIndex (itemIndex)}
							<li>{@render spans(item)}</li>
						{/each}
					</ul>
				{/if}
			{/each}
		</div>
	</div>
</article>

{#snippet spans(line: LegalLine)}
	{#each line as span, index (index)}{@render run(span)}{/each}
{/snippet}

{#snippet run(span: LegalSpan)}
	{#if span.href}
		<a
			href={span.href}
			rel="noopener noreferrer"
			target="_blank"
			class="rounded-sm font-medium text-foreground underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
		>
			{span.text}
		</a>
	{:else if span.bold && span.underline}
		<strong class="font-semibold text-foreground underline">{span.text}</strong>
	{:else if span.bold}
		<strong class="font-semibold text-foreground">{span.text}</strong>
	{:else if span.underline}
		<span class="underline">{span.text}</span>
	{:else}{span.text}{/if}
{/snippet}
