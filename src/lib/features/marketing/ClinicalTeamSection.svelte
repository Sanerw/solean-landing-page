<script lang="ts">
	import * as Carousel from '$lib/components/ui/carousel';
	import ClinicianCard from './ClinicianCard.svelte';
	import { CONTAINER, SECTION_Y } from './container';
	import { SECTION_HEADING, SECTION_LEAD } from './type';
	import { CLINICAL_TEAM, CLINICIANS } from './content';
</script>

<section class={[CONTAINER, SECTION_Y]} aria-label={CLINICAL_TEAM.title}>
	<Carousel.Root opts={{ align: 'start' }} class="w-full">
		<div class="flex flex-wrap items-end justify-between gap-6">
			<div>
				<h2 class={SECTION_HEADING}>
					{CLINICAL_TEAM.title}
				</h2>
				<p class={SECTION_LEAD}>{CLINICAL_TEAM.lead}</p>
			</div>
			<div class="relative flex shrink-0 gap-2">
				<Carousel.Previous class="static translate-y-0" aria-label="Previous clinician" variant="ghost" />
				<Carousel.Next class="static translate-y-0" aria-label="Next clinician" variant="inverse" />
			</div>
		</div>

		<Carousel.Content class="mt-10">
			{#each CLINICIANS as clinician (clinician.name)}
				<Carousel.Item class="basis-full md:basis-1/2 lg:basis-1/3">
					<ClinicianCard {clinician} />
				</Carousel.Item>
			{/each}
		</Carousel.Content>
	</Carousel.Root>
</section>
