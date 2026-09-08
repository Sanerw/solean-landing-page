<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import type { ArticleTocItem } from './types';

	interface Props {
		items: readonly ArticleTocItem[];
	}

	let { items }: Props = $props();
</script>

<!--
	Drawn from `lg` up only. The narrow artboard has no contents list: at 390 it would be eight
	anchors between the reader and the first sentence, and the sections are one scroll apart
	anyway. The reading column takes the whole panel there instead.
-->
<nav
	aria-label={m.learn_toc_heading()}
	class="hidden lg:sticky lg:top-8 lg:block lg:w-56 lg:shrink-0 lg:self-start"
>
	<h2 class="font-display text-lg font-semibold text-foreground lg:text-xl">
		{m.learn_toc_heading()}
	</h2>
	<div aria-hidden="true" class="mt-3 h-0.5 w-11 bg-primary"></div>
	<ul class="mt-5 flex flex-col gap-4">
		{#each items as item (item.id)}
			<li>
				<a
					href="#{item.id}"
					class="rounded-sm text-base text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				>
					{item.label}
				</a>
			</li>
		{/each}
	</ul>
</nav>
