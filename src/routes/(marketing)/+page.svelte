<script lang="ts">
	import BentoGrid from '$lib/features/marketing/BentoGrid.svelte';
	import HeroSection from '$lib/features/marketing/HeroSection.svelte';
	import HowItWorks from '$lib/features/marketing/HowItWorks.svelte';
	import ResultsBand from '$lib/features/marketing/ResultsBand.svelte';
	import TrustBenefits from '$lib/features/marketing/TrustBenefits.svelte';
</script>

<svelte:head>
	<title>Solean - doctor-led weight loss for men</title>
	<meta
		name="description"
		content="Personalised, doctor-led weight-loss care designed to help men feel healthier, more confident and supported for the long term."
	/>
</svelte:head>

<!--
	One vertical rhythm owned here rather than baked into each section, so the page reads as a
	single document and features 4b and 5 can slot their sections into the same spacing.
-->
<div class="space-y-16 pb-16 lg:space-y-24 lg:pb-24">
	<HeroSection />
	<TrustBenefits />
	<BentoGrid />
	<ResultsBand />
	<HowItWorks />
</div>
