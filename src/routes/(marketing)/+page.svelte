<script lang="ts">
	import { m } from '$lib/paraglide/messages';
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
	<title>{m.title_home()}</title>
	<meta
		name="description"
		content={m.meta_home()}
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
