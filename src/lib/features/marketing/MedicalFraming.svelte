<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import BrainIcon from '@lucide/svelte/icons/brain';
	import DnaIcon from '@lucide/svelte/icons/dna';
	import { medicalFraming, ROUTES, type MedicalFactor } from './content';
	import { SECTION_HEADING, SECTION_LEAD } from './type';

	// Read during render so the copy follows the active locale.
	const MEDICAL_FRAMING = $derived(medicalFraming());

	const ICONS = {
		brain: BrainIcon,
		activity: ActivityIcon,
		dna: DnaIcon
	} satisfies Record<MedicalFactor['icon'], unknown>;
</script>

<div>
	<h2 class={SECTION_HEADING}>
		{MEDICAL_FRAMING.title}
	</h2>
	<p class={SECTION_LEAD}>{MEDICAL_FRAMING.body}</p>

	<ul class="mt-7 flex flex-wrap gap-x-8 gap-y-4">
		{#each MEDICAL_FRAMING.factors as factor (factor.label)}
			{@const Icon = ICONS[factor.icon]}
			<li class="flex items-center gap-3">
				<span class="flex size-9 items-center justify-center rounded-full bg-accent">
					<Icon aria-hidden="true" class="size-4 text-foreground" />
				</span>
				<span class="text-sm text-foreground">{factor.label}</span>
			</li>
		{/each}
	</ul>

	<!-- The narrow artboard ends this block at the factor tags: the hero and the how-it-works
	     section already carry the same two destinations, so repeating them here would be the
	     third and fourth on one scroll. -->
	<div class="mt-8 flex flex-col gap-4 max-sm:hidden sm:flex-row">
		<Button href={ROUTES.questionnaire} class="rounded-full">
			{MEDICAL_FRAMING.primaryCta}
			<ArrowRightIcon aria-hidden="true" class="size-5" />
		</Button>
		<!-- Inert, matching how the hero treats the same destination until it exists. -->
		<Button href="/treatments" variant="outline" class="rounded-full">
			{MEDICAL_FRAMING.secondaryCta}
			<ArrowUpRightIcon aria-hidden="true" class="size-5" />
		</Button>
	</div>
</div>
