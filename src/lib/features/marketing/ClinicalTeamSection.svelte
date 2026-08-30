<script lang="ts">
	import * as Carousel from '$lib/components/ui/carousel';
	import ClinicianCard from './ClinicianCard.svelte';
	import { CONTAINER } from './container';
	import { CLINICAL_TEAM, CLINICIANS } from './content';
</script>

<section class={[CONTAINER, 'py-14 lg:py-16']} aria-label={CLINICAL_TEAM.title}>
	<Carousel.Root opts={{ align: 'start' }} class="w-full">
		<div class="flex flex-wrap items-end justify-between gap-6">
			<div>
				<h2 class="font-display text-3xl font-medium text-foreground md:text-4xl lg:text-5xl">
					{CLINICAL_TEAM.title}
				</h2>
				<p class="mt-2 text-base text-muted-foreground">{CLINICAL_TEAM.lead}</p>
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
