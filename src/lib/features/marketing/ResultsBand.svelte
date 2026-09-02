<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import StarRating from '$lib/components/brand/StarRating.svelte';
	import { Button } from '$lib/components/ui/button';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import ClipboardCheckIcon from '@lucide/svelte/icons/clipboard-check';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import StethoscopeIcon from '@lucide/svelte/icons/stethoscope';
	import { BLEED, CONTAINER, PANEL_GAP_Y, PANEL_ROUND, PANEL_Y } from './container';
	import { SECTION_HEADING, SECTION_LEAD } from './type';
	import { RATING, ROUTES, type MiniBenefit } from './content';
	import type { resultsBandFrom } from './from-sanity';
	import { formatScore, type Rating } from './reviews';

	interface Props {
		band: ReturnType<typeof resultsBandFrom>;
		/** Read on the server; null when Reviews.io could not be reached. */
		rating: Rating | null;
	}

	let { rating, band }: Props = $props();

	const shown = $derived(rating ?? RATING.fallback);
	const RESULTS_BAND = $derived(band);

	const ICONS = {
		stethoscope: StethoscopeIcon,
		'clipboard-check': ClipboardCheckIcon,
		'message-circle': MessageCircleIcon
	} satisfies Record<MiniBenefit['icon'], unknown>;
</script>

<!-- Ground is --highlight, which the reference uses here exactly. It carries the top three
     text roles but not --text-faint, so nothing on this band uses that role. -->
<!-- The rounded panel needs its own breathing room: BLEED carries only the horizontal
     gutter, so without this the card butts straight into the section above and below. -->
<section class={[BLEED, PANEL_GAP_Y]} aria-label={m.a11y_results_section()}>
	<div class={['overflow-hidden bg-highlight', PANEL_ROUND, PANEL_Y]}>
		<div class={CONTAINER}>
			<!-- The narrow artboard opens this band on its heading. The three assurances are
			     not dropped from the page, only from the top of this section, where they would
			     stand between the band's ground and the heading that names it. -->
			<ul class="grid gap-8 max-sm:hidden sm:grid-cols-3">
				{#each RESULTS_BAND.benefits as benefit (benefit.title)}
					{@const Icon = ICONS[benefit.icon]}
					<li class="flex items-start gap-3">
						<Icon aria-hidden="true" class="mt-0.5 size-5 shrink-0 text-foreground" />
						<div>
							<h3 class="text-sm font-semibold text-foreground">{benefit.title}</h3>
							<p class="mt-1 text-sm text-muted-foreground">{benefit.body}</p>
						</div>
					</li>
				{/each}
			</ul>

			<!-- 3:4:3 is the reference's 520:660:520 column allocation on stock columns. The
			     two text columns start level and the artwork runs past them, so the row is
			     top-aligned rather than centred. -->
			<div class="grid gap-8 max-sm:mt-0 sm:mt-12 lg:grid-cols-10">
				<div class="lg:col-span-3">
					<p
						class="text-[10px] font-bold uppercase tracking-[0.12em] text-highlight-foreground sm:hidden"
					>
						{RESULTS_BAND.eyebrow}
					</p>
					<h2 class={[SECTION_HEADING, 'max-sm:mt-2.5']}>
						{RESULTS_BAND.title}
					</h2>
					<p class={SECTION_LEAD}>{RESULTS_BAND.lead}</p>
					<Button
						href={ROUTES.questionnaire}
						variant="inverse"
						class="mt-6 w-full rounded-full sm:w-auto"
					>
						{RESULTS_BAND.cta}
						<ArrowRightIcon aria-hidden="true" class="size-5" />
					</Button>
				</div>

				<!-- The reference does not box this artwork. It multiplies into the yellow ground
				     and dissolves on all four edges, so the negative margin lets it run into the
				     panel's own padding instead of stopping on a card edge. -->
				<div class="relative lg:col-span-4 lg:-mt-6 lg:-mb-16">
					{#if RESULTS_BAND.image}
						<img
							src={RESULTS_BAND.image.src}
							srcset={RESULTS_BAND.image.srcset}
							width={RESULTS_BAND.image.width}
							height={RESULTS_BAND.image.height}
							alt=""
							aria-hidden="true"
							loading="lazy"
							decoding="async"
							sizes="(min-width: 1024px) 40vw, 100vw"
							class="w-full mix-blend-multiply"
						/>
					{/if}
					<div aria-hidden="true" class="absolute inset-0 bg-highlight/10"></div>
					<div
						aria-hidden="true"
						class="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-highlight to-highlight/0"
					></div>
					<div
						aria-hidden="true"
						class="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-highlight to-highlight/0"
					></div>
					<div
						aria-hidden="true"
						class="absolute inset-x-0 top-0 h-1/5 bg-gradient-to-b from-highlight to-highlight/0"
					></div>
					<div
						aria-hidden="true"
						class="absolute inset-x-0 bottom-0 h-1/5 bg-gradient-to-t from-highlight to-highlight/0"
					></div>
				</div>

				<div class="lg:col-span-3">
					<div class="flex items-center gap-3">
						<p class="font-display text-4xl font-medium text-foreground">{formatScore(shown.score)}</p>
						<div>
							<StarRating rating={shown.score} treatment="outline" class="mt-1.5 text-foreground" />
							<p class="mt-1 text-xs font-semibold text-muted-foreground">
								{m.rating_reviews_on({
									count: shown.total.toLocaleString(getLocale()),
									platform: RATING.platform
								})}
							</p>
						</div>
					</div>

					<div aria-hidden="true" class="mt-5 h-0.5 w-12 bg-foreground"></div>

					<!-- A real blockquote with its attribution in the accompanying figcaption, so the
					     quote and the person are associated without relying on visual proximity. -->
					<figure class="mt-5">
						<blockquote class="text-base leading-relaxed text-foreground">
							<p>&ldquo;{RESULTS_BAND.quote}&rdquo;</p>
						</blockquote>
						<figcaption class="mt-5 flex items-center gap-3">
							{#if RESULTS_BAND.authorAvatar}
								<img
									src={RESULTS_BAND.authorAvatar.src}
									srcset={RESULTS_BAND.authorAvatar.srcset}
									width={RESULTS_BAND.authorAvatar.width}
									height={RESULTS_BAND.authorAvatar.height}
									alt=""
									aria-hidden="true"
									loading="lazy"
									decoding="async"
									sizes="40px"
									class="size-10 shrink-0 rounded-full object-cover"
								/>
							{/if}
							<span class="text-sm">
								<span class="block font-semibold text-foreground">{RESULTS_BAND.author}</span>
								<span class="block text-xs text-muted-foreground">{RESULTS_BAND.authorRole}</span>
							</span>
						</figcaption>
					</figure>

					<!-- Same destination as the hero badge, so the page never offers two review
					     platforms. -->
					<div class="mt-5 flex justify-end">
						<Button
							href={RATING.href}
							variant="link"
							size="sm"
							target="_blank"
							rel="noopener noreferrer"
							aria-label="{RESULTS_BAND.reviewCta} on Reviews.io (opens in a new tab)"
						>
							{RESULTS_BAND.reviewCta}
							<ArrowUpRightIcon aria-hidden="true" class="size-4" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
