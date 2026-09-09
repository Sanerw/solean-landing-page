<script lang="ts">
	import type { Clinician } from './content';

	let { clinician }: { clinician: Clinician } = $props();
</script>

<article class="flex h-full flex-col overflow-hidden rounded-xl bg-surface-warm">
	{#if clinician.portrait}
		<!-- Decorative: the name immediately below carries the meaning. The fixed ratio reserves
		     the height before the file loads, and squares up the three portraits, which are
		     exported at slightly different sizes and would otherwise size the carousel cards
		     unequally. -->
		<img
			src={clinician.portrait.src}
					srcset={clinician.portrait.srcset}
					width={clinician.portrait.width}
					height={clinician.portrait.height}
			alt=""
			aria-hidden="true"
			loading="lazy"
			decoding="async"
			sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
			class="aspect-3/2 w-full object-cover"
		/>
	{/if}
	<div class="flex flex-1 flex-col p-6">
		<h3 class="font-display text-xl font-semibold text-foreground">{clinician.name}</h3>
		<p class="mt-1 text-sm font-semibold text-highlight-foreground">{clinician.role}</p>
		<p class="mt-3 text-sm text-muted-foreground">{clinician.description}</p>
	</div>
</article>
