<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		id: string;
		title: string;
		description?: string;
		children: Snippet;
	}

	let { id, title, description, children }: Props = $props();
</script>

<section {id} class="border-t border-border py-12 first:border-t-0">
	<h2 class="font-display text-3xl font-medium md:text-4xl">{title}</h2>
	{#if description}
		<p class="mt-3 max-w-3xl text-base text-muted-foreground">{description}</p>
	{/if}
	<div class="mt-8">
		{@render children()}
	</div>
</section>
