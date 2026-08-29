<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import BrainIcon from '@lucide/svelte/icons/brain';
	import DnaIcon from '@lucide/svelte/icons/dna';
	import { MEDICAL_FRAMING, ROUTES, type MedicalFactor } from './content';

	const ICONS = {
		brain: BrainIcon,
		activity: ActivityIcon,
		dna: DnaIcon
	} satisfies Record<MedicalFactor['icon'], unknown>;
</script>

<div>
	<h2 class="font-display text-3xl font-medium text-foreground md:text-4xl lg:text-5xl">
		{MEDICAL_FRAMING.title}
	</h2>
	<p class="mt-6 text-base text-muted-foreground md:text-lg">{MEDICAL_FRAMING.body}</p>

	<ul class="mt-8 flex flex-wrap gap-x-10 gap-y-4">
		{#each MEDICAL_FRAMING.factors as factor (factor.label)}
			{@const Icon = ICONS[factor.icon]}
			<li class="flex items-center gap-3">
				<span class="flex size-10 items-center justify-center rounded-full bg-accent">
					<Icon aria-hidden="true" class="size-5 text-foreground" />
				</span>
				<span class="text-base text-foreground">{factor.label}</span>
			</li>
		{/each}
	</ul>

	<div class="mt-10 flex flex-col gap-4 sm:flex-row">
		<Button href={ROUTES.questionnaire} size="lg">
			{MEDICAL_FRAMING.primaryCta}
			<ArrowRightIcon aria-hidden="true" class="size-5" />
		</Button>
		<!-- Inert, matching how the hero treats the same destination until it exists. -->
		<Button href="/treatments" variant="outline" size="lg">
			{MEDICAL_FRAMING.secondaryCta}
			<ArrowUpRightIcon aria-hidden="true" class="size-5" />
		</Button>
	</div>
</div>
