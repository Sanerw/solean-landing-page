<script lang="ts">
	import BentoGrid from '$lib/features/marketing/BentoGrid.svelte';
	import ClinicalTeamSection from '$lib/features/marketing/ClinicalTeamSection.svelte';
	import FaqSection from '$lib/features/marketing/FaqSection.svelte';
	import HeroSection from '$lib/features/marketing/HeroSection.svelte';
	import HowItWorks from '$lib/features/marketing/HowItWorks.svelte';
	import ProjectionSection from '$lib/features/marketing/ProjectionSection.svelte';
	import ResultsBand from '$lib/features/marketing/ResultsBand.svelte';
	import TestimonialsSection from '$lib/features/marketing/TestimonialsSection.svelte';
	import TrustBenefits from '$lib/features/marketing/TrustBenefits.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Solean - doctor-led weight loss for men</title>
	<meta
		name="description"
		content="Personalised, doctor-led weight-loss care designed to help men feel healthier, more confident and supported for the long term."
	/>
</svelte:head>

<div class="pb-3">
	<HeroSection rating={data.rating} />
	<TrustBenefits />
	<BentoGrid />
	<ResultsBand rating={data.rating} />
	<ProjectionSection />
	<TestimonialsSection />
	<ClinicalTeamSection />
	<HowItWorks />
	<FaqSection />
</div>
