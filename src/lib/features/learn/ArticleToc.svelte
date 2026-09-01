<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import type { ArticleTocItem } from './types';

	interface Props {
		items: readonly ArticleTocItem[];
	}

	let { items }: Props = $props();
</script>

<nav aria-label={m.learn_toc_heading()} class="lg:sticky lg:top-6 lg:self-start">
	<h2 class="font-display text-lg font-semibold text-foreground">{m.learn_toc_heading()}</h2>
	<ul class="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4 lg:grid-cols-1">
		{#each items as item (item.id)}
			<li>
				<a
					href="#{item.id}"
					class="rounded-sm text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				>
					{item.label}
				</a>
			</li>
		{/each}
	</ul>
</nav>
