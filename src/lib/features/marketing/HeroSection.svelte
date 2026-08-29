<script lang="ts">
	import heroImage from '$lib/assets/hero.jpg';
	import { Button } from '$lib/components/ui/button';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import { BLEED, CONTAINER } from './container';
	import { HERO, ROUTES } from './content';
	import HeroArticleTeaser from './HeroArticleTeaser.svelte';
	import HeroRatingBadge from './HeroRatingBadge.svelte';
	import SiteHeader from './SiteHeader.svelte';
</script>

<!-- Near full-bleed card: page gutter only, no max-width, matching the reference where the
     hero sits just inside the viewport edge. Its contents still use CONTAINER, so the
     headline lines up with the trust row and the footer below. -->
<div class={BLEED}>
	<section class="relative isolate overflow-hidden rounded-xl">
		<!-- Generated placeholder art; see the spec's open decision. Decorative, so the section's
		     own heading carries the meaning and the image is hidden from assistive tech. -->
		<img
			src={heroImage}
			alt=""
			aria-hidden="true"
			class="absolute inset-0 -z-10 size-full object-cover"
		/>

		<!--
			Dark at both ends, light through the middle. The two dark ends are where text sits on
			the busiest part of the art: the header band at the top (which also has to read as
			--foreground so surface="dark" focus rings do not show a mismatched offset) and the
			rating badge and article teaser at the bottom. The middle is deliberately the lightest
			point, at roughly half opacity, so the artwork is actually visible behind the headline
			rather than being flattened into a solid panel.

			The stops are not eyeballed. Every text role was measured at its real height against
			the brightest pixel in that row of the shipped asset: the tightest pairing is the gold
			text-xs eyebrow in the teaser, which clears its 4.5:1 floor with a 1.12x margin here.
			Lightening the middle stop past ~0.55 starts to fail the lead paragraph.
		-->
		<div
			aria-hidden="true"
			class="absolute inset-0 -z-10 bg-gradient-to-b from-foreground/90 via-foreground/50 to-foreground/90"
		></div>

		<SiteHeader variant="overlay" />

		<div class={[CONTAINER, 'pb-10']}>
			<div class="mx-auto max-w-6xl pt-10 pb-12 text-center sm:pt-14 lg:pt-16">
				<p
					class="inline-block rounded-full border border-background/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-background"
				>
					{HERO.eyebrow}
				</p>

				<h1
					class="mt-6 text-balance font-display text-4xl font-medium leading-tight text-background sm:text-5xl lg:text-7xl xl:text-8xl"
				>
					{HERO.headlineLead}
					<!-- A real <s>, so the "not this, but that" meaning survives without the styling. -->
					<!-- nowrap so the rule never breaks across two lines, which reads as two separate
					     struck words rather than one struck phrase. -->
					<s class="text-background/65 sm:whitespace-nowrap decoration-primary decoration-4">
						{HERO.headlineStruck}
					</s>
					{HERO.headlineTail}
				</h1>

				<p class="mx-auto mt-5 max-w-2xl text-base text-background/85 md:text-lg">
					{HERO.lead}
				</p>

				<div class="mt-7 flex flex-col items-center justify-center gap-4 sm:flex-row">
					<Button href={ROUTES.questionnaire} size="lg" surface="dark" class="w-full sm:w-auto">
						{HERO.primaryCta}
						<ArrowRightIcon aria-hidden="true" class="size-5" />
					</Button>
					<Button
						href="/treatments"
						variant="outline"
						size="lg"
						surface="dark"
						class="w-full sm:w-auto"
					>
						{HERO.secondaryCta}
					</Button>
				</div>
			</div>

			<!-- Stacked on small screens, opposite corners from md up, so neither overlay ever
			     sits on top of the headline. -->
			<div class="flex flex-col items-start gap-8 pt-4 md:flex-row md:items-end md:justify-between">
				<HeroRatingBadge />
				<HeroArticleTeaser />
			</div>
		</div>
	</section>
</div>
