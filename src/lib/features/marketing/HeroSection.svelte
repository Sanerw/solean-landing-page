<script lang="ts">
	import heroImage from '$lib/assets/hero.jpg';
	import { Button } from '$lib/components/ui/button';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import { CONTAINER } from './container';
	import { HERO, ROUTES } from './content';
	import HeroArticleTeaser from './HeroArticleTeaser.svelte';
	import HeroRatingBadge from './HeroRatingBadge.svelte';
	import SiteHeader from './SiteHeader.svelte';
</script>

<div class="px-3 py-3">
	<section
		class="relative isolate flex flex-col overflow-hidden rounded-xl lg:h-hero-frame"
		aria-labelledby="hero-heading"
	>
		<img
			src={heroImage}
			alt=""
			aria-hidden="true"
			class="absolute inset-0 -z-10 size-full object-cover"
		/>

		<!-- The export layers a light colour wash over a directional scrim. Keeping them
		     separate preserves the photograph while the header and lower overlays stay legible. -->
		<div aria-hidden="true" class="absolute inset-0 -z-10 bg-foreground/15"></div>
		<div
			aria-hidden="true"
			class="absolute inset-0 -z-10 bg-gradient-to-b from-foreground/45 via-foreground/55 to-foreground/75"
		></div>

		<SiteHeader variant="overlay" />

		<div class={[CONTAINER, 'flex min-h-0 flex-1 flex-col pb-6 lg:pb-8']}>
			<div
				class="mx-auto flex max-w-6xl flex-1 flex-col items-center justify-center py-6 text-center lg:py-4"
			>
				<p
					class="inline-block rounded-full border border-background/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-background"
				>
					{HERO.eyebrow}
				</p>

				<h1
					id="hero-heading"
					class="mt-4 max-w-5xl text-balance font-display text-4xl font-medium leading-none tracking-tight text-background sm:text-4xl lg:text-5xl xl:text-6xl"
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

				<p class="mx-auto mt-4 max-w-2xl text-base text-background/85 md:text-lg">
					{HERO.lead}
				</p>

				<div class="mt-5 flex flex-col items-center justify-center gap-4 sm:flex-row">
					<Button
						href={ROUTES.questionnaire}
						surface="dark"
						class="w-full rounded-full sm:w-auto"
					>
						{HERO.primaryCta}
						<ArrowRightIcon aria-hidden="true" class="size-5" />
					</Button>
					<Button
						href="/treatments"
						variant="outline"
						surface="dark"
						class="w-full rounded-full sm:w-auto"
					>
						{HERO.secondaryCta}
					</Button>
				</div>
			</div>

			<div class="flex flex-col items-start gap-6 pt-2 md:flex-row md:items-end md:justify-between">
				<HeroRatingBadge />
				<HeroArticleTeaser />
			</div>
		</div>
	</section>
</div>
