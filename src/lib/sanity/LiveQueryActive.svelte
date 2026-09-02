<script lang="ts" generics="T">
	import { useQuery } from '@sanity/sveltekit';
	import type { Snippet } from 'svelte';

	/**
	 * The live half of `LiveQuery`, in its own module so the static import above lands in a chunk
	 * that is only fetched in preview. Subscribing has to happen at component level: Svelte's `$`
	 * auto-subscription does not work on a value produced inside a block.
	 */
	const { data, children }: { data: unknown; children: Snippet<[T | undefined]> } = $props();

	const query = $derived(useQuery<T>(data as never));
</script>

{@render children($query.data)}
