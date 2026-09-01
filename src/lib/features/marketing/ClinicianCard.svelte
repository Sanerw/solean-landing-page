<script lang="ts">
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import { clinicalTeam, type Clinician } from './content';

	// Read during render so the copy follows the active locale.
	const CLINICAL_TEAM = $derived(clinicalTeam());

	interface Props {
		clinician: Clinician;
	}

	let { clinician }: Props = $props();
</script>

<article class="flex h-full flex-col overflow-hidden rounded-xl bg-surface-warm">
	{#if clinician.portrait}
		<!-- Decorative: the name immediately below carries the meaning. The fixed ratio reserves
		     the height before the file loads, and squares up the three portraits, which are
		     exported at slightly different sizes and would otherwise size the carousel cards
		     unequally. -->
		<enhanced:img
			src={clinician.portrait}
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
		<!-- Individual profile pages are not designed, so this is inert text rather than a
		     link that would promise a page that does not exist. -->
		<span class="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-semibold text-text-tertiary">
			{CLINICAL_TEAM.learnMore}
			<ArrowRightIcon aria-hidden="true" class="size-4" />
		</span>
	</div>
</article>
