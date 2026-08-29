<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		role: string;
		font: string;
		classes: string;
		children: Snippet;
	}

	let { role, font, classes, children }: Props = $props();
</script>

<div class="grid gap-4 border-b border-border py-8 last:border-b-0 md:grid-cols-3 md:gap-8">
	<div class="space-y-1">
		<p class="text-sm font-medium">{role}</p>
		<p class="text-xs text-text-tertiary">{font}</p>
		<code class="block font-sans text-xs text-muted-foreground">{classes}</code>
	</div>
	<div class="min-w-0 md:col-span-2">
		{@render children()}
	</div>
</div>
