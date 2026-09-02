<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import LockIcon from '@lucide/svelte/icons/lock';
	import PackageCheckIcon from '@lucide/svelte/icons/package-check';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import StethoscopeIcon from '@lucide/svelte/icons/stethoscope';
	import { CONTAINER, SECTION_Y } from './container';
	import { CARD_HEADING } from './type';
	import type { TrustBenefit } from './content';

	const { benefits }: { benefits: readonly TrustBenefit[] } = $props();

	const TRUST_BENEFITS = $derived(benefits);

	const ICONS = {
		stethoscope: StethoscopeIcon,
		'shield-check': ShieldCheckIcon,
		'package-check': PackageCheckIcon,
		lock: LockIcon
	} satisfies Record<TrustBenefit['icon'], unknown>;
</script>

<!-- The narrow artboard has no trust band: the hero's rating badge already carries it. -->
<section class={[CONTAINER, SECTION_Y, 'max-sm:hidden']} aria-label={m.a11y_trust_section()}>
	<ul class="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
		{#each TRUST_BENEFITS as benefit (benefit.title)}
			{@const Icon = ICONS[benefit.icon]}
			<li class="text-center">
				<Icon aria-hidden="true" class="mx-auto size-8 text-foreground" />
				<h2 class={['mt-4', CARD_HEADING]}>{benefit.title}</h2>
				<p class="mt-2 text-sm text-muted-foreground">{benefit.body}</p>
			</li>
		{/each}
	</ul>
</section>
