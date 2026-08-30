<script lang="ts">
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import StethoscopeIcon from '@lucide/svelte/icons/stethoscope';
	import { BLEED, CONTAINER } from './container';
	import { HOW_IT_WORKS } from './content';
</script>

<section class={[BLEED, 'py-8']} aria-label="How it works">
	<div class="rounded-xl bg-muted py-12 lg:py-16">
		<div class={CONTAINER}>
			<div class="grid gap-10 lg:grid-cols-2 lg:items-center">
				<div class="relative">
					<img
						src={HOW_IT_WORKS.image}
						alt=""
						aria-hidden="true"
						class="w-full rounded-xl object-cover"
						width="720"
						height="430"
					/>
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
					<h2 class="font-display text-3xl font-medium text-foreground md:text-4xl">
						{HOW_IT_WORKS.title}
					</h2>
					<p class="mt-3 text-base text-muted-foreground">{HOW_IT_WORKS.lead}</p>

					<!-- An ordered list, so the sequence is conveyed to assistive tech even though the
					     visible numerals are decorative and derived from the index. -->
					<ol class="mt-8 divide-y divide-border">
						{#each HOW_IT_WORKS.steps as step, index (step.title)}
							<li class="flex flex-wrap items-start gap-4 py-5">
								<span
									aria-hidden="true"
									class="flex size-10 shrink-0 items-center justify-center rounded-md bg-card font-display text-sm font-semibold text-foreground"
								>
									{String(index + 1).padStart(2, '0')}
								</span>
								<div class="min-w-0 flex-1">
									<h3 class="font-display text-lg font-semibold text-foreground">{step.title}</h3>
									<p class="mt-1 text-sm text-muted-foreground">{step.body}</p>
								</div>
								{#if step.href && step.linkLabel}
									<a
										href={step.href}
										class="inline-flex items-center gap-1 rounded-sm text-sm font-semibold text-foreground outline-none hover:text-highlight-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-muted"
									>
										{step.linkLabel}
										<ArrowUpRightIcon aria-hidden="true" class="size-4" />
									</a>
								{/if}
							</li>
						{/each}
					</ol>
				</div>
			</div>
		</div>
	</div>
</section>
