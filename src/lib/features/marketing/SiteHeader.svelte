<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import SoleanLogo from '$lib/components/brand/SoleanLogo.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as NavigationMenu from '$lib/components/ui/navigation-menu';
	import { CONTAINER } from './container';
	import { navItems, ROUTES } from './content';

	// Read during render so the labels follow the active locale.
	const NAV_ITEMS = $derived(navItems());
	import LanguageSelect from './LanguageSelect.svelte';
	import MobileNav from './MobileNav.svelte';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import CircleDotIcon from '@lucide/svelte/icons/circle-dot';
	import PillIcon from '@lucide/svelte/icons/pill';
	import SyringeIcon from '@lucide/svelte/icons/syringe';

	// Read during render so the copy follows the active locale.

	interface Props {
		/** `overlay` sits inside the hero card on the scrim; `solid` is every other page. */
		variant?: 'overlay' | 'solid';
	}

	let { variant = 'solid' }: Props = $props();

	const surface = $derived(variant === 'overlay' ? ('dark' as const) : ('default' as const));

	function treatmentIcon(label: string) {
		if (label.startsWith('Mounjaro')) return SyringeIcon;
		if (label.endsWith('Pill')) return PillIcon;
		return CircleDotIcon;
	}
</script>

<header class={variant === 'solid' ? 'bg-card' : 'bg-transparent'}>
	<div
		class={[
			CONTAINER,
			'grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 py-3 min-[1200px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]',
			// The taller narrow-screen mark needs a deeper inset, in both variants, so the
			// header keeps one height across the pages a phone moves between.
			'max-sm:py-4'
		]}
	>
		<!-- Desktop nav. Every top-level item is a NavigationMenu link, not a bare anchor,
		     so keyboard and focus behavior comes from the adapted primitive in both variants. -->
		<NavigationMenu.Root
			{surface}
			viewport={false}
			class="hidden min-w-0 max-w-none justify-start min-[1200px]:flex"
		>
			<NavigationMenu.List>
				{#each NAV_ITEMS as item (item.label)}
					<NavigationMenu.Item>
						{#if item.children}
							<NavigationMenu.Trigger>{item.label}</NavigationMenu.Trigger>
							<NavigationMenu.Content>
								<ul class="grid w-72 gap-1">
									{#each item.children as child (child.label)}
										{@const Icon = treatmentIcon(child.label)}
										<li>
											<NavigationMenu.Link
												href={child.inert ? undefined : child.href}
												aria-disabled={child.inert ? 'true' : undefined}
												class="gap-[13px]"
											>
												<Icon aria-hidden="true" class="size-6 text-foreground" />
												<span class="min-w-0 flex-1">
													<span class="block text-sm font-semibold text-foreground">{child.label}</span>
													{#if child.description}
														<span class="mt-0.5 block text-[11px] font-normal text-muted-foreground">
															{child.description}
														</span>
													{/if}
												</span>
												<ArrowUpRightIcon aria-hidden="true" class="size-4 text-highlight-foreground" />
											</NavigationMenu.Link>
										</li>
									{/each}
								</ul>
							</NavigationMenu.Content>
						{:else}
							<NavigationMenu.Link
								href={item.inert ? undefined : item.href}
								aria-disabled={item.inert ? 'true' : undefined}
							>
								{item.label}
							</NavigationMenu.Link>
						{/if}
					</NavigationMenu.Item>
				{/each}
			</NavigationMenu.List>
		</NavigationMenu.Root>

		<!-- Centred by the equal flex-1 columns either side, not by absolute positioning. -->
		<a
			href={ROUTES.home}
			aria-label={m.a11y_home()}
			class={[
				'shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
				surface === 'dark'
					? 'text-background focus-visible:ring-primary focus-visible:ring-offset-foreground'
					: 'text-foreground focus-visible:ring-ring focus-visible:ring-offset-background'
			]}
		>
			<!-- One narrow-screen size for both variants: the two headers appear on the same
			     phone, so a mark that changed size between them would read as a bug. -->
			<SoleanLogo size="default" class="max-sm:h-12 min-[1200px]:h-15" />
		</a>

		<div class="flex min-w-0 items-center justify-end gap-2">
			<LanguageSelect {surface} class="hidden sm:inline-flex" />
			<Button
				href={ROUTES.questionnaire}
				surface={surface}
				size="sm"
				class="hidden rounded-full sm:inline-flex"
			>
				{m.hero_primary_cta()}
			</Button>
			<MobileNav {surface} />
		</div>
	</div>
</header>
