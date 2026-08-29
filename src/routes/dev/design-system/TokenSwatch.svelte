<script lang="ts">
	import type { ColorToken } from './tokens';

	let { token }: { token: ColorToken } = $props();
</script>

<div class="flex items-center gap-4">
	<!-- The token name is data, so the chip reads the custom property directly.
	     A Tailwind utility cannot be built from a runtime string. -->
	<div
		class="size-12 shrink-0 rounded-md border border-border"
		style="background-color: var({token.name})"
	></div>
	<div class="min-w-0">
		<code class="block truncate font-sans text-sm font-medium">{token.name}</code>
		<p class="text-xs text-text-tertiary">{token.value}</p>
		<p class="text-xs text-text-faint">{token.role}</p>
	</div>
</div>
