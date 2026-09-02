<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import StethoscopeIcon from '@lucide/svelte/icons/stethoscope';
	import { Button } from '$lib/components/ui/button';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import { BLEED, CONTAINER, PANEL_GAP_Y, PANEL_ROUND, PANEL_Y } from './container';
	import { CARD_HEADING, SECTION_HEADING, SECTION_LEAD } from './type';
	import type { howItWorksFrom } from './from-sanity';

	// Read during render so the copy follows the active locale.
	const { howItWorks }: { howItWorks: ReturnType<typeof howItWorksFrom> } = $props();

	const HOW_IT_WORKS = $derived(howItWorks);

	/** The artboard's foot button is the step's own link, not a second destination. */
	const primaryStep = $derived(HOW_IT_WORKS.steps.find((step) => step.href && step.linkLabel));
</script>

<section class={[BLEED, PANEL_GAP_Y]} aria-label={m.a11y_how_section()}>
	<div class={['bg-muted', PANEL_ROUND, PANEL_Y]}>
		<div class={CONTAINER}>
			<div class="grid gap-10 lg:grid-cols-2 lg:items-center">
				<div class="relative">
					{#if HOW_IT_WORKS.image}
						<img
							src={HOW_IT_WORKS.image.src}
							srcset={HOW_IT_WORKS.image.srcset}
							width={HOW_IT_WORKS.image.width}
							height={HOW_IT_WORKS.image.height}
							alt=""
							aria-hidden="true"
							loading="lazy"
							decoding="async"
							sizes="(min-width: 1024px) 50vw, 100vw"
							class="w-full rounded-xl object-cover"
						/>
					{/if}
					<!-- Caption chip sits on the card ground, not on the artwork, so its contrast does
					     not depend on whichever image ends up behind it. -->
					<div class="mt-4 flex items-start gap-3 rounded-lg bg-card p-4 sm:absolute sm:inset-x-4 sm:bottom-4 sm:mt-0">
						<span class="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary">
							<StethoscopeIcon aria-hidden="true" class="size-5 text-primary-foreground" />
						</span>
						<span>
							<span class="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
								{HOW_IT_WORKS.captionEyebrow}
							</span>
							<span class="mt-0.5 block text-sm font-medium text-foreground">
								{HOW_IT_WORKS.caption}
							</span>
						</span>
					</div>
				</div>

				<div>
					<h2 class={SECTION_HEADING}>
						{HOW_IT_WORKS.title}
					</h2>
					<p class={SECTION_LEAD}>{HOW_IT_WORKS.lead}</p>

					<!-- An ordered list, so the sequence is conveyed to assistive tech even though the
					     visible numerals are decorative and derived from the index. -->
					<ol class="mt-8 divide-y divide-border">
						{#each HOW_IT_WORKS.steps as step, index (step.title)}
							<li class="flex flex-wrap items-start gap-4 py-5">
								<span
									aria-hidden="true"
									class="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground font-display text-sm font-semibold text-background"
								>
									{String(index + 1).padStart(2, '0')}
								</span>
								<div class="min-w-0 flex-1">
									<h3 class={CARD_HEADING}>{step.title}</h3>
									<p class="mt-1 text-sm text-muted-foreground">{step.body}</p>
								</div>
								{#if step.href && step.linkLabel}
									<!-- Lifted into the foot button below the narrow artboard, so the step
									     offers one destination there rather than two. -->
									<a
										href={step.href}
										class="inline-flex items-center gap-1 rounded-sm text-sm font-semibold text-foreground outline-none hover:text-highlight-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-muted max-sm:hidden"
									>
										{step.linkLabel}
										<ArrowUpRightIcon aria-hidden="true" class="size-4" />
									</a>
								{/if}
							</li>
						{/each}
					</ol>

					{#if primaryStep}
						<!-- The artboard closes the section with one full-width primary button. -->
						<Button href={primaryStep.href} class="mt-8 w-full rounded-full sm:hidden">
							{primaryStep.linkLabel}
							<ArrowRightIcon aria-hidden="true" class="size-4" />
						</Button>
					{/if}
				</div>
			</div>
		</div>
	</div>
</section>
