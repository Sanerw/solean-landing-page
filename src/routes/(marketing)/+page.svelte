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
	import {
		bentoCardsFrom,
		cliniciansFrom,
		heroPicture,
		medicalFramingFrom,
		howItWorksFrom,
		resultsBandFrom,
		testimonialsFrom,
		trustBenefitsFrom
	} from '$lib/features/marketing/from-sanity';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// The page cannot render without its content, and the load already 500s if Sanity is
	// unreachable, so this is a type narrowing rather than a fallback.
	const home = $derived(data.home!);
</script>

<svelte:head>
	<title>{m.title_home()}</title>
	<meta
		name="description"
		content={m.meta_home()}
	/>
</svelte:head>

<!--
	Every section is guarded on its own content. A page composed of optional documents must
	degrade to a shorter page, never to an error: an editor who empties a section, or publishes
	a draft written before a field existed, should lose that section and nothing else. The
	alternative is what this page did once, which was to answer the whole site with a 500.
-->
<div class="pb-3">
	{#if home.hero}
		<HeroSection
			rating={data.rating}
			hero={home.hero}
			articleTeaser={home.articleTeaser}
			image={heroPicture(home)}
		/>
	{/if}
	{#if home.trustBenefits?.length}
		<TrustBenefits benefits={trustBenefitsFrom(home)} />
	{/if}
	{#if home.bento?.cards?.length}
		<BentoGrid section={home.bento} bentoCards={bentoCardsFrom(home)} />
	{/if}
	{#if home.resultsBand}
		<ResultsBand rating={data.rating} band={resultsBandFrom(home.resultsBand)} />
	{/if}
	{#if home.projection}
		<ProjectionSection projection={home.projection} framing={medicalFramingFrom(home.medicalFraming ?? { title: '', body: '', primaryCta: '', secondaryCta: '', factors: [] })} />
	{/if}
	{#if home.testimonialsSection?.testimonials?.length}
		<TestimonialsSection section={home.testimonialsSection} stories={testimonialsFrom(home)} />
	{/if}
	{#if home.clinicalTeam?.clinicians?.length}
		<ClinicalTeamSection section={home.clinicalTeam} team={cliniciansFrom(home)} />
	{/if}
	{#if home.howItWorks}
		<HowItWorks howItWorks={howItWorksFrom(home.howItWorks)} />
	{/if}
	{#if home.faq?.items?.length}
		<FaqSection faq={home.faq} />
	{/if}
</div>
