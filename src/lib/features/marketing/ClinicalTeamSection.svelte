<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import * as Carousel from '$lib/components/ui/carousel';
	import ClinicianCard from './ClinicianCard.svelte';
	import { CONTAINER, SECTION_Y } from './container';
	import { SECTION_HEADING, SECTION_LEAD } from './type';
	import type { Clinician } from './content';
	import type { HomePage } from '$lib/sanity/queries';

	// Read during render so the copy follows the active locale.
	const { section, team }: { section: NonNullable<HomePage['clinicalTeam']>; team: readonly Clinician[] } = $props();

	const CLINICIANS = $derived(team);

	// Read during render so the copy follows the active locale.
	const CLINICAL_TEAM = $derived(section);
</script>

<section class={[CONTAINER, SECTION_Y]} aria-label={CLINICAL_TEAM.title}>
	<Carousel.Root opts={{ align: 'start' }} class="flex w-full flex-col">
		<div class="flex flex-wrap items-end justify-between gap-6 max-sm:contents">
			<div>
				<h2 class={SECTION_HEADING}>
					{CLINICAL_TEAM.title}
				</h2>
				<p class={SECTION_LEAD}>{CLINICAL_TEAM.lead}</p>
			</div>
			<!-- Below sm the controls move under the card and centre, as drawn. `contents`
			     dissolves this row into the carousel's own column there, so one set of
			     controls is reordered rather than a second set rendered and hidden. -->
			<div class="relative flex shrink-0 gap-2 max-sm:order-3 max-sm:mt-8 max-sm:justify-center">
				<Carousel.Previous class="static translate-y-0" aria-label={m.a11y_prev_clinician()} variant="ghost" />
				<Carousel.Next class="static translate-y-0" aria-label={m.a11y_next_clinician()} variant="inverse" />
			</div>
		</div>

		<Carousel.Content class="mt-10 max-sm:order-2">
			{#each CLINICIANS as clinician (clinician.name)}
				<Carousel.Item class="basis-full md:basis-1/2 lg:basis-1/3">
					<ClinicianCard {clinician} learnMore={CLINICAL_TEAM.learnMore} />
				</Carousel.Item>
			{/each}
		</Carousel.Content>
	</Carousel.Root>
</section>
