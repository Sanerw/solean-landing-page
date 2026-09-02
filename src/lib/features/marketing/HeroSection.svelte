<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import type { Rating } from './reviews';
	import { CONTAINER } from './container';
	import { ROUTES } from './content';
	import type { HomePage } from '$lib/sanity/queries';
	import type { SanityPicture } from '$lib/sanity/image';
	import HeroArticleTeaser from './HeroArticleTeaser.svelte';
	import HeroRatingBadge from './HeroRatingBadge.svelte';
	import SiteHeader from './SiteHeader.svelte';

	interface Props {
		hero: NonNullable<HomePage['hero']>;
		/** The hero photograph, already resolved to a Sanity CDN srcset. */
		image: SanityPicture | undefined;
		articleTeaser: HomePage['articleTeaser'];
		/** Read on the server; null when Reviews.io could not be reached. */
		rating: Rating | null;
	}

	let { rating, hero, articleTeaser, image }: Props = $props();

	const HERO = $derived(hero);

	// Below lg the frame is taller than the photograph, so object-cover scales the asset up
	// until it covers the height and crops the overhanging width away. A width-shaped 100vw
	// there buys a candidate about a third of what the frame actually draws, which is what
	// made the narrow hero soft: ask for the whole asset and let the crop discard the rest.
	const heroSizes = $derived(`(min-width: 1024px) 100vw, ${image?.width ?? 0}px`);
	const heroPreloadHref = $derived(image?.src);
</script>

<svelte:head>
	{#if image}
		<!-- Match the picture's candidates and sizes so this request is reused when the hero
		     markup is parsed instead of causing a second image download. No `type` any more:
		     the CDN picks AVIF or WebP by content negotiation, so the format is not known here
		     the way it was when the build produced the candidates. -->
		<link
			rel="preload"
			as="image"
			href={heroPreloadHref}
			imagesrcset={image.srcset}
			imagesizes={heroSizes}
			fetchpriority="high"
		/>
	{/if}
</svelte:head>

<!-- The narrow reference runs the photograph to the viewport edge; the card gutter and
     radius return with the wider composition. -->
<div class="sm:px-3 sm:py-3">
	<section
		class="relative isolate flex min-h-hero-bleed flex-col overflow-hidden sm:min-h-hero-bleed-sm sm:rounded-xl lg:h-hero-frame lg:min-h-0"
		aria-labelledby="hero-heading"
	>
		<!-- One asset, cropped by object-position rather than a second source: the narrow
		     frame keeps the right of the photograph, which is where the subject sits. -->
		{#if image}
			<img
				src={image.src}
				srcset={image.srcset}
				width={image.width}
				height={image.height}
				alt=""
				aria-hidden="true"
				sizes={heroSizes}
				fetchpriority="high"
				class="absolute inset-0 -z-10 size-full object-cover object-[86%_center] sm:object-center"
			/>
		{/if}

		<!-- Each artboard darkens differently, so each is followed rather than averaged. The
		     wide one lays a flat wash under a 28-to-72 percent scrim; the narrow one carries
		     no wash and runs 45 to 90, because its crop keeps the sunlit facade and the pale
		     pavement that the wide composition crops out. -->
		<div aria-hidden="true" class="absolute inset-0 -z-10 sm:bg-scrim/15"></div>
		<div
			aria-hidden="true"
			class="absolute inset-0 -z-10 bg-gradient-to-b from-scrim/45 via-scrim/70 to-scrim/90 sm:from-scrim/30 sm:via-scrim/55 sm:to-scrim/70"
		></div>

		<SiteHeader variant="overlay" />

		<div class={[CONTAINER, 'flex min-h-0 flex-1 flex-col pb-6 lg:pb-8']}>
			<div
				class="mx-auto flex max-w-6xl flex-1 flex-col items-start justify-center py-6 text-left sm:items-center sm:text-center lg:py-4"
			>
				<!-- Each branch is display:none when it is not the live one, so the accessibility
				     tree only ever carries the copy actually on screen. -->
				<p
					class="inline-block rounded-full border border-background/30 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-background sm:px-4 sm:py-1.5"
				>
					<span class="sm:hidden">{HERO.mobileEyebrow}</span>
					<span class="hidden sm:inline">{HERO.eyebrow}</span>
				</p>

				<h1
					id="hero-heading"
					class="mt-4 max-w-5xl text-balance font-display text-5xl font-medium leading-none tracking-tight text-background sm:text-4xl lg:text-5xl xl:text-6xl"
				>
					<!-- The narrow frame drops the struck phrase: at this measure the rule breaks
					     across lines and reads as two struck words rather than one struck idea. -->
					<span class="sm:hidden">{HERO.mobileHeadline}</span>
					<span class="hidden sm:inline">
						{HERO.headlineLead}
						<!-- A real <s>, so the "not this, but that" meaning survives without the styling. -->
						<!-- nowrap so the rule never breaks across two lines, which reads as two separate
						     struck words rather than one struck phrase. -->
						<s class="text-background/65 sm:whitespace-nowrap decoration-primary decoration-4">
							{HERO.headlineStruck}
						</s>
						{HERO.headlineTail}
					</span>
				</h1>

				<p class="mt-4 max-w-2xl text-base text-background/85 sm:mx-auto md:text-lg">
					<span class="sm:hidden">{HERO.mobileLead}</span>
					<span class="hidden sm:inline">{HERO.lead}</span>
				</p>

				<div class="mt-5 flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row">
					<Button
						href={ROUTES.questionnaire}
						surface="dark"
						class="w-full rounded-full sm:w-auto"
					>
						{HERO.primaryCta}
						<ArrowRightIcon aria-hidden="true" class="size-5" />
					</Button>
					<!-- The reference offers one route into the funnel on a narrow screen; the
					     second CTA and the teaser return with the room to carry them. -->
					<Button
						href="/treatments"
						variant="outline"
						surface="dark"
						class="hidden w-full rounded-full sm:inline-flex sm:w-auto"
					>
						{HERO.secondaryCta}
					</Button>
				</div>
			</div>

			<div class="flex flex-col items-start gap-6 pt-2 md:flex-row md:items-end md:justify-between">
				<HeroRatingBadge {rating} />
				<div class="hidden sm:block">
					{#if articleTeaser}
						<HeroArticleTeaser teaser={articleTeaser} />
					{/if}
				</div>
			</div>
		</div>
	</section>
</div>
