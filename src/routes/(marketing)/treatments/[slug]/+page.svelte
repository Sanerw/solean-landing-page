<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import StarRating from '$lib/components/brand/StarRating.svelte';
	import SiteHeader from '$lib/features/marketing/SiteHeader.svelte';
	import { BLEED, CONTAINER } from '$lib/features/marketing/container';
	import { RATING, ROUTES } from '$lib/features/marketing/content';
	import { formatScore } from '$lib/features/marketing/reviews';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import { findTreatmentPage, startingDose } from '$lib/features/treatments/content';
	import TreatmentGallery from '$lib/features/treatments/TreatmentGallery.svelte';
	import DoseSelector from '$lib/features/treatments/DoseSelector.svelte';
	import ConsultationOffer from '$lib/features/treatments/ConsultationOffer.svelte';
	import StickyConsultationBar from '$lib/features/treatments/StickyConsultationBar.svelte';
	import { findTreatment, treatmentDisplayName } from '$lib/domain';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Resolved during render, not in the load, so the copy follows the active locale. The load
	// already proved the slug exists, so both of these are narrowing rather than fallbacks.
	const treatmentPage = $derived(findTreatmentPage(data.slug)!);
	const name = $derived(treatmentDisplayName(findTreatment(data.slug)!));

	// Null when Reviews.io could not be reached, which the platform's own figures answer, the
	// same way the hero badge does.
	const rating = $derived(data.rating ?? RATING.fallback);

	/**
	 * The chosen dose lives here rather than inside the selector, because the offer card prices
	 * it too. Kept per slug and derived rather than reset by an effect: a bare `chosen` would
	 * survive a client-side move to another treatment, and "1.5mg" is not one of Mounjaro's
	 * doses, so the selector would show nothing chosen while the card priced something else.
	 */
	let chosenBySlug = $state<Record<string, string>>({});
	const chosen = $derived(chosenBySlug[data.slug] ?? startingDose(treatmentPage).label);
	const dose = $derived(
		treatmentPage.doses.find((each) => each.label === chosen) ?? startingDose(treatmentPage)
	);
</script>

<svelte:head>
	<title>{m.title_treatment({ name })}</title>
	<meta name="description" content={m.meta_treatment({ name })} />
</svelte:head>

<!--
	The header sits inside the page rather than in the marketing layout, the same way the learn
	and legal pages carry it: the landing page renders the overlay variant inside its hero, so a
	shared header would make one of the two wrong.
-->
<div class={[BLEED, 'sm:py-3']}>
	<SiteHeader />
</div>

<!--
	The whole product hero is meant to be readable without scrolling on the screen it is read
	on, which is a 13 inch laptop. That is why this section's rhythm is tighter than the rest
	of the site's and why the gallery is capped: measured on a 1440 by 900 viewport, the
	consultation CTA has to sit above the fold.
-->
<section class={[CONTAINER, 'pb-10 pt-4 lg:pb-10']} aria-labelledby="treatment-title">
	<!--
		Gallery first in the DOM, which is both the order the narrow artboard stacks them in and
		the left column of the wide one. The breadcrumb heads the details column rather than the
		page, as the wide artboard draws it.
	-->
	<!--
		`items-stretch`, so the gallery takes its height from the details column rather than from
		its own aspect ratio. That is the wide artboard's own arrangement, and it is what keeps
		the panel at half the page without pushing the CTA under the fold.
	-->
	<div class="grid gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-10">
		<TreatmentGallery page={treatmentPage} />

		<div>
			<Breadcrumb.Root>
				<Breadcrumb.List class="text-xs md:text-sm">
					<Breadcrumb.Item>
						<Breadcrumb.Link href={localizeHref(ROUTES.home)}>{m.nav_home()}</Breadcrumb.Link>
					</Breadcrumb.Item>
					<Breadcrumb.Separator>/</Breadcrumb.Separator>
					<Breadcrumb.Item>
						<!-- Text, not a link: the treatments index is still undrawn, and a breadcrumb
						     that sends the reader to a 404 is worse than one that does not move. -->
						<span>{m.nav_treatments()}</span>
					</Breadcrumb.Item>
					<Breadcrumb.Separator>/</Breadcrumb.Separator>
					<Breadcrumb.Item>
						<Breadcrumb.Page>{name}</Breadcrumb.Page>
					</Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb.Root>

			<h1
				id="treatment-title"
				class="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-5xl"
			>
				{name}
			</h1>

			<p
				class="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-muted-foreground"
			>
				<!-- Decorative: the score and the count are written out immediately beside them, so
				     the stars would otherwise announce the rating a second time. That is also what
				     lets them take the reference's own gold rather than the darker contrast tone. -->
				<StarRating rating={rating.score} treatment="inline" decorative />
				<!-- The count is formatted for the page's own locale: a German visitor reads 1.200
				     where an English one reads 1,200. -->
				<span>
					{m.treatment_rating_summary({
						score: formatScore(rating.score),
						count: rating.total.toLocaleString(getLocale())
					})}
				</span>
			</p>

			<p class="mt-3 text-sm text-muted-foreground md:text-base">
				{treatmentPage.intro}
			</p>

			<h2
				id="treatment-dose-heading"
				class="mt-6 font-display text-xl font-semibold text-foreground md:text-2xl"
			>
				{m.treatment_dose_heading()}
			</h2>
			<p class="mt-1 text-xs text-muted-foreground md:text-sm">
				{m.treatment_dose_guidance()}
			</p>

			<div class="mt-3">
				<DoseSelector
					doses={treatmentPage.doses}
					labelledBy="treatment-dose-heading"
					bind:value={() => chosen, (next) => (chosenBySlug[data.slug] = next)}
				/>
			</div>

			<div class="mt-3 flex items-center gap-3 rounded-md bg-accent p-3">
				<span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-card">
					<ShieldCheckIcon aria-hidden="true" class="size-4 text-foreground" />
				</span>
				<span>
					<span class="block text-sm font-bold text-foreground">
						{treatmentPage.clinicianNote.title}
					</span>
					<span class="mt-0.5 block text-xs text-muted-foreground">
						{treatmentPage.clinicianNote.body}
					</span>
				</span>
			</div>

			<ConsultationOffer page={treatmentPage} {dose} />
		</div>
	</div>
</section>

<StickyConsultationBar page={treatmentPage} />
