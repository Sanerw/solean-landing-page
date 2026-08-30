<script lang="ts">
	import StarRating from '$lib/components/brand/StarRating.svelte';
	import { Button } from '$lib/components/ui/button';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import ClipboardCheckIcon from '@lucide/svelte/icons/clipboard-check';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import StethoscopeIcon from '@lucide/svelte/icons/stethoscope';
	import { BLEED, CONTAINER } from './container';
	import { RATING, RESULTS_BAND, ROUTES, type MiniBenefit } from './content';

	const ICONS = {
		stethoscope: StethoscopeIcon,
		'clipboard-check': ClipboardCheckIcon,
		'message-circle': MessageCircleIcon
	} satisfies Record<MiniBenefit['icon'], unknown>;
</script>

<!-- Ground is --highlight, which the reference uses here exactly. It carries the top three
     text roles but not --text-faint, so nothing on this band uses that role. -->
<section class={BLEED} aria-label="Care built in">
	<div class="rounded-xl bg-highlight py-12 lg:py-16">
		<div class={CONTAINER}>
			<ul class="grid gap-8 sm:grid-cols-3">
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

			<div class="mt-12 grid items-center gap-10 lg:grid-cols-3">
				<div>
					<h2 class="font-display text-3xl font-medium text-foreground md:text-4xl">
						{RESULTS_BAND.title}
					</h2>
					<p class="mt-4 text-base text-muted-foreground">{RESULTS_BAND.lead}</p>
					<Button href={ROUTES.questionnaire} variant="inverse" size="lg" class="mt-6">
						{RESULTS_BAND.cta}
						<ArrowRightIcon aria-hidden="true" class="size-5" />
					</Button>
				</div>

				<img
					src={RESULTS_BAND.image}
					alt=""
					aria-hidden="true"
					class="w-full rounded-xl object-cover"
					width="517"
					height="476"
				/>

				<div>
					<div class="flex items-center gap-3">
						<p class="font-display text-4xl font-medium text-foreground">{RATING.score}</p>
						<StarRating rating={RATING.score} size="sm" />
					</div>
					<p class="mt-1 text-sm text-muted-foreground">{RATING.label}</p>

					<!-- A real blockquote with its attribution in the accompanying figcaption, so the
					     quote and the person are associated without relying on visual proximity. -->
					<figure class="mt-6 border-t border-foreground/15 pt-6">
						<blockquote class="text-base text-foreground">
							<p>&ldquo;{RESULTS_BAND.quote}&rdquo;</p>
						</blockquote>
						<figcaption class="mt-4 text-sm">
							<span class="block font-semibold text-foreground">{RESULTS_BAND.author}</span>
							<span class="block text-muted-foreground">{RESULTS_BAND.authorRole}</span>
						</figcaption>
					</figure>
				</div>
			</div>
		</div>
	</div>
</section>
