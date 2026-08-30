<script lang="ts">
	import * as NavigationMenu from '$lib/components/ui/navigation-menu';
	import { Button } from '$lib/components/ui/button';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import CircleDotIcon from '@lucide/svelte/icons/circle-dot';
	import SyringeIcon from '@lucide/svelte/icons/syringe';
	import PillIcon from '@lucide/svelte/icons/pill';
	import ShowcaseSection from './ShowcaseSection.svelte';

	// A neutral stand-in for the canonical nav model. The real fixture and its
	// Treatments entries belong to feature 3b; this only proves the primitive.
	const TREATMENTS = [
		{ label: 'Mounjaro Injection', description: 'Weekly prescription injection', icon: SyringeIcon },
		{ label: 'Wegovy Injection', description: 'Weekly GLP-1 injection', icon: CircleDotIcon },
		{ label: 'Wegovy Pill', description: 'Daily oral treatment', icon: PillIcon }
	];
</script>

<ShowcaseSection
	id="navigation-menu"
	title="NavigationMenu"
	description="Desktop site navigation. Plain links and the Treatments dropdown share one visual family and one surface contract, adapted for both the solid header and the transparent hero overlay."
>
	<div class="space-y-8">
		<div class="rounded-xl border border-border bg-card p-6">
			<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
				Solid header, surface="default"
			</p>
			<NavigationMenu.Root class="mt-4 max-w-none justify-start" viewport={false}>
				<NavigationMenu.List>
					<NavigationMenu.Item>
						<NavigationMenu.Link href="/">Home</NavigationMenu.Link>
					</NavigationMenu.Item>
					<NavigationMenu.Item>
						<NavigationMenu.Trigger>Treatments</NavigationMenu.Trigger>
						<NavigationMenu.Content>
							<ul class="grid w-72 gap-1">
								{#each TREATMENTS as treatment (treatment.label)}
									{@const Icon = treatment.icon}
									<li>
										<NavigationMenu.Link href="/treatments" class="gap-[13px]">
											<Icon aria-hidden="true" class="size-6 text-foreground" />
											<span class="min-w-0 flex-1">
												<span class="block text-sm font-semibold text-foreground">
													{treatment.label}
												</span>
												<span class="mt-0.5 block text-[11px] font-normal text-muted-foreground">
													{treatment.description}
												</span>
											</span>
											<ArrowUpRightIcon
												aria-hidden="true"
												class="size-4 text-highlight-foreground"
											/>
										</NavigationMenu.Link>
									</li>
								{/each}
							</ul>
						</NavigationMenu.Content>
					</NavigationMenu.Item>
					<NavigationMenu.Item>
						<NavigationMenu.Link href="/about">About Us</NavigationMenu.Link>
					</NavigationMenu.Item>
					<NavigationMenu.Item>
						<NavigationMenu.Link href="/#faq">FAQ</NavigationMenu.Link>
					</NavigationMenu.Item>
					<NavigationMenu.Item>
						<NavigationMenu.Link href="/learn" active>Learn</NavigationMenu.Link>
					</NavigationMenu.Item>
				</NavigationMenu.List>
			</NavigationMenu.Root>
		</div>

		<div class="rounded-xl bg-foreground p-6">
			<p class="text-xs font-semibold uppercase tracking-widest text-primary">
				Hero overlay, surface="dark"
			</p>
			<div class="mt-4 flex items-center justify-between gap-6">
				<NavigationMenu.Root surface="dark" class="max-w-none justify-start" viewport={false}>
					<NavigationMenu.List>
						<NavigationMenu.Item>
							<NavigationMenu.Link href="/">Home</NavigationMenu.Link>
						</NavigationMenu.Item>
						<NavigationMenu.Item>
							<NavigationMenu.Trigger>Treatments</NavigationMenu.Trigger>
							<NavigationMenu.Content>
								<ul class="grid w-72 gap-1">
									{#each TREATMENTS as treatment (treatment.label)}
										{@const Icon = treatment.icon}
										<li>
											<NavigationMenu.Link href="/treatments" class="gap-[13px]">
												<Icon aria-hidden="true" class="size-6 text-foreground" />
												<span class="min-w-0 flex-1">
													<span class="block text-sm font-semibold text-foreground">
														{treatment.label}
													</span>
													<span class="mt-0.5 block text-[11px] font-normal text-muted-foreground">
														{treatment.description}
													</span>
												</span>
												<ArrowUpRightIcon
													aria-hidden="true"
													class="size-4 text-highlight-foreground"
												/>
											</NavigationMenu.Link>
										</li>
									{/each}
								</ul>
							</NavigationMenu.Content>
						</NavigationMenu.Item>
						<NavigationMenu.Item>
							<NavigationMenu.Link href="/about">About Us</NavigationMenu.Link>
						</NavigationMenu.Item>
					</NavigationMenu.List>
				</NavigationMenu.Root>
				<Button surface="dark" size="sm">Check your eligibility</Button>
			</div>
		</div>

		<p class="max-w-3xl text-sm text-muted-foreground">
			Click or Tab to Treatments, then Enter or Space to open. Arrow keys move between items inside
			the panel, Escape closes and returns focus to the trigger, and an outside click or Tab away
			also closes it.
		</p>
	</div>
</ShowcaseSection>
