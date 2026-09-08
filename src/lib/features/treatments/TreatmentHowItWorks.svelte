<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import StethoscopeIcon from '@lucide/svelte/icons/stethoscope';
	import { Button } from '$lib/components/ui/button';
	import {
		BLEED,
		CONTAINER,
		PANEL_GAP_Y,
		PANEL_ROUND,
		PANEL_Y
	} from '$lib/features/marketing/container';
	import { ROUTES } from '$lib/features/marketing/content';
	import { howItWorksSteps } from './content';
	import { SECTION_HEADING, SECTION_LEAD } from './type';
	import visual from '$lib/assets/panels/how-it-works-enhanced.webp?enhanced&w=400;600;800;1200&quality=90';

	// Read during render so the copy follows the active locale.
	const steps = $derived(howItWorksSteps());
</script>

<!--
	The same arrangement the landing page's How it works uses, because the artboard draws them
	the same way: the visual on the left with a caption card over its foot, the numbered steps
	on the right.

	Local to this feature rather than a reuse of that component, for one reason: its props are
	the Sanity picture shape, and this page's visual is a repository asset compiled by
	`enhanced:img`. Those are different types, and widening a Sanity-bound component to a union
	so it can serve both is a larger change than the markup it saves. What is shared is the
	layout vocabulary below, so the two sections cannot drift apart visually.
-->
<section class={[BLEED, PANEL_GAP_Y]} aria-labelledby="treatment-hiw-heading">
	<div class={['bg-muted', PANEL_ROUND, PANEL_Y]}>
		<div class={CONTAINER}>
			<div class="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
				<div class="relative">
					<enhanced:img
						src={visual}
						alt=""
						aria-hidden="true"
						sizes="(min-width: 1024px) 46vw, 100vw"
						class="aspect-4/3 w-full rounded-xl object-cover"
					/>
					<!-- The caption chip sits on the card ground rather than on the artwork, so its
					     contrast does not depend on whichever image ends up behind it. The landing
					     page's own visual makes the same call. -->
					<div
						class="mt-4 flex items-start gap-3 rounded-lg bg-card p-4 sm:absolute sm:inset-x-4 sm:bottom-4 sm:mt-0"
					>
						<span class="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary">
							<StethoscopeIcon aria-hidden="true" class="size-5 text-primary-foreground" />
						</span>
						<span>
							<span
								class="block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
							>
								{m.treatment_hiw_caption_eyebrow()}
							</span>
							<span class="mt-0.5 block text-sm font-medium text-foreground">
								{m.treatment_hiw_caption()}
							</span>
						</span>
					</div>
				</div>

				<div>
					<h2 id="treatment-hiw-heading" class={SECTION_HEADING}>
						{m.treatment_hiw_heading()}
					</h2>
					<p class={SECTION_LEAD}>{m.treatment_hiw_lead()}</p>

					<!-- An ordered list, so the sequence reaches assistive tech even though the visible
					     numerals are decorative and derived from the index. A stored numeral can go
					     stale against its position; this one cannot. -->
					<ol class="mt-6 divide-y divide-border">
						{#each steps as step, index (step.title)}
							<li class="flex items-start gap-4 py-4">
								<span
									aria-hidden="true"
									class="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground font-display text-xs font-semibold text-background"
								>
									{String(index + 1).padStart(2, '0')}
								</span>
								<div class="min-w-0 flex-1">
									<h3 class="font-display text-base font-semibold text-foreground md:text-lg">
										{step.title}
									</h3>
									<p class="mt-1 text-sm text-muted-foreground">{step.body}</p>
								</div>
							</li>
						{/each}
					</ol>

					<Button href={localizeHref(ROUTES.questionnaire)} class="mt-6 w-full sm:w-auto">
						{m.treatment_hiw_cta()}
						<ArrowRightIcon aria-hidden="true" class="size-4" />
					</Button>
				</div>
			</div>
		</div>
	</div>
</section>
