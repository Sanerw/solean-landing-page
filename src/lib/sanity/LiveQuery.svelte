<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';

	/**
	 * Renders Sanity content, live when preview is on and straight from the server load otherwise.
	 *
	 * The point of the split is what a page costs when nobody is previewing. `useQuery` can only be
	 * imported from `@sanity/sveltekit`, whose single entry point also carries the Visual Editing
	 * overlay and Sanity UI's stylesheet, and those rules are unlayered, so they outrank every
	 * Tailwind utility and strip the layout off the page that imported them. Reaching for it from a
	 * page component ships all of that to every visitor. Here it sits behind a dynamic import that
	 * only preview takes, and an ordinary visit renders the data the loader already returned.
	 *
	 * Pass the whole `data` from a load that returned `{query, params, options: {initial}}`.
	 */
	interface Props {
		data: { options: { initial: { data: T } } };
		previewEnabled: boolean;
		children: Snippet<[T | undefined]>;
	}

	const { data, previewEnabled, children }: Props = $props();

	// Read once at setup on purpose: preview is turned on by a redirect through `/preview/enable`,
	// so the value cannot change without a full page load.
	// svelte-ignore state_referenced_locally
	const live = previewEnabled ? import('$lib/sanity/LiveQueryActive.svelte') : null;
</script>

{#if live}
	{#await live then { default: LiveQueryActive }}
		<LiveQueryActive {data} {children} />
	{/await}
{:else}
	{@render children(data.options.initial.data)}
{/if}
