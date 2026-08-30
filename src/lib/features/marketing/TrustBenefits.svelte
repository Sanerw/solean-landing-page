<script lang="ts">
	import LockIcon from '@lucide/svelte/icons/lock';
	import PackageCheckIcon from '@lucide/svelte/icons/package-check';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import StethoscopeIcon from '@lucide/svelte/icons/stethoscope';
	import { CONTAINER } from './container';
	import { TRUST_BENEFITS, type TrustBenefit } from './content';

	const ICONS = {
		stethoscope: StethoscopeIcon,
		'shield-check': ShieldCheckIcon,
		'package-check': PackageCheckIcon,
		lock: LockIcon
	} satisfies Record<TrustBenefit['icon'], unknown>;
</script>

<section class={[CONTAINER, 'py-16 lg:py-20']} aria-label="Why Solean">
	<ul class="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
		{#each TRUST_BENEFITS as benefit (benefit.title)}
			{@const Icon = ICONS[benefit.icon]}
			<li class="text-center">
				<Icon aria-hidden="true" class="mx-auto size-8 text-foreground" />
				<h2 class="mt-4 font-display text-lg font-semibold text-foreground">{benefit.title}</h2>
				<p class="mt-2 text-sm text-muted-foreground">{benefit.body}</p>
			</li>
		{/each}
	</ul>
</section>
