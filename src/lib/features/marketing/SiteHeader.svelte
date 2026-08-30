<script lang="ts">
	import SoleanLogo from '$lib/components/brand/SoleanLogo.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as NavigationMenu from '$lib/components/ui/navigation-menu';
	import { CONTAINER } from './container';
	import { HERO, NAV_ITEMS, ROUTES } from './content';
	import LanguageSelect from './LanguageSelect.svelte';
	import MobileNav from './MobileNav.svelte';

	interface Props {
		/** `overlay` sits inside the hero card on the scrim; `solid` is every other page. */
		variant?: 'overlay' | 'solid';
	}

	let { variant = 'solid' }: Props = $props();

	const surface = $derived(variant === 'overlay' ? ('dark' as const) : ('default' as const));
</script>

<header class={variant === 'solid' ? 'bg-card' : 'bg-transparent'}>
	<div class={[CONTAINER, 'flex items-center justify-between gap-4 py-3']}>
		<!-- Desktop nav. Every top-level item is a NavigationMenu link, not a bare anchor,
		     so keyboard and focus behavior comes from the adapted primitive in both variants. -->
		<NavigationMenu.Root
			{surface}
			viewport={false}
			class="hidden max-w-none flex-1 justify-start lg:flex"
		>
			<NavigationMenu.List>
				{#each NAV_ITEMS as item (item.label)}
					<NavigationMenu.Item>
						{#if item.children}
							<NavigationMenu.Trigger>{item.label}</NavigationMenu.Trigger>
							<NavigationMenu.Content>
								<ul class="grid w-72 gap-1">
									{#each item.children as child (child.label)}
										<li>
											<NavigationMenu.Link
												href={child.inert ? undefined : child.href}
												aria-disabled={child.inert ? 'true' : undefined}
												class="items-start gap-3"
											>
												<span>
													<span class="block font-medium">{child.label}</span>
													{#if child.description}
														<span class="mt-0.5 block text-sm font-normal text-muted-foreground">
															{child.description}
														</span>
													{/if}
												</span>
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
			aria-label="Solean, home"
			class={[
				'shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
				surface === 'dark'
					? 'text-background focus-visible:ring-primary focus-visible:ring-offset-foreground'
					: 'text-foreground focus-visible:ring-ring focus-visible:ring-offset-background'
			]}
		>
			<SoleanLogo size="sm" />
		</a>

		<div class="flex flex-1 items-center justify-end gap-2">
			<LanguageSelect {surface} class="hidden sm:inline-flex" />
			<Button
				href={ROUTES.questionnaire}
				surface={surface}
				size="sm"
				class="hidden rounded-full sm:inline-flex"
			>
				{HERO.primaryCta}
			</Button>
			<MobileNav {surface} />
		</div>
	</div>
</header>
