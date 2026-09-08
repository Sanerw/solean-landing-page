<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { Button } from '$lib/components/ui/button';
	import SiteHeader from '$lib/features/marketing/SiteHeader.svelte';
	import { BLEED, CONTAINER } from '$lib/features/marketing/container';
	import { ROUTES } from '$lib/features/marketing/content';
</script>

<svelte:head>
	<title>{m.treatment_error_title()}</title>
</svelte:head>

<div class={[BLEED, 'sm:py-3']}>
	<SiteHeader />
</div>

<section class={[CONTAINER, 'py-20 text-center lg:py-32']} aria-labelledby="treatment-error-title">
	<p class="text-xs font-semibold uppercase tracking-widest text-highlight-foreground">
		{m.treatment_error_eyebrow()}
	</p>
	<h1 id="treatment-error-title" class="mt-4 font-display text-4xl font-medium sm:text-5xl">
		{m.treatment_error_title()}
	</h1>
	<p class="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
		{m.treatment_error_body()}
	</p>
	<div class="mt-8 flex flex-wrap justify-center gap-3">
		<!--
			Home, not a treatments index: that route is still undrawn, so pointing at it would
			send the reader from one 404 to another.
		-->
		<Button href={localizeHref(ROUTES.home)}>{m.treatment_error_cta()}</Button>
	</div>
</section>
