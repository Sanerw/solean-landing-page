<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import SoleanLogo from '$lib/components/brand/SoleanLogo.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Sheet from '$lib/components/ui/sheet';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import MenuIcon from '@lucide/svelte/icons/menu';
	import XIcon from '@lucide/svelte/icons/x';
	import { hero, navItems, ROUTES } from './content';

	// Read during render so the labels follow the active locale.
	const NAV_ITEMS = $derived(navItems());
	import LanguageSelect from './LanguageSelect.svelte';

	// Read during render so the copy follows the active locale.
	const HERO = $derived(hero());

	interface Props {
		surface?: 'default' | 'dark';
	}

	let { surface = 'default' }: Props = $props();

	let open = $state(false);

	const pad = (index: number) => String(index + 1).padStart(2, '0');
</script>

<Sheet.Root bind:open>
	<Sheet.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="ghost"
				size="icon"
				{surface}
				class={[
					'max-sm:size-11 min-[1200px]:hidden',
					// The disc reads off the photograph on the hero and off a border on a solid
					// header, which has no scrim to lift a translucent fill.
					surface === 'dark' ? 'max-sm:bg-background/10' : 'max-sm:border-border'
				]}
				aria-label={m.a11y_open_menu()}
			>
				<MenuIcon aria-hidden="true" class="size-4 max-sm:size-5" />
			</Button>
		{/snippet}
	</Sheet.Trigger>

	<!-- The reference keeps the offer bar visible and drops the panel under it, so both the
	     panel and its scrim start at the bar's height rather than covering the viewport. The
	     primitive's own side geometry is overridden; its focus trap, Escape handling and
	     scroll lock are not. The inset matches the closed header, so the logo and the
	     button do not move when the menu opens. -->
	<Sheet.Content
		side="right"
		showCloseButton={false}
		overlayClass="top-16 sm:top-11"
		class="gap-0 bg-foreground px-4 pb-7 pt-4 text-background
			data-[side=right]:border-l-0 data-[side=right]:inset-x-0 data-[side=right]:inset-y-auto data-[side=right]:bottom-0
			data-[side=right]:top-16 data-[side=right]:h-auto data-[side=right]:w-full
			data-[side=right]:sm:top-11 data-[side=right]:sm:max-w-none"
	>
		<Sheet.Header class="flex-row items-center justify-between gap-4 p-0">
			<!-- The dialog still needs its name; the logo carries it visually. -->
			<Sheet.Title class="sr-only">Menu</Sheet.Title>
			<a
				href={ROUTES.home}
				aria-label={m.a11y_home()}
				class="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
				onclick={() => (open = false)}
			>
				<SoleanLogo size="default" class="h-12 text-background" />
			</a>

			<Sheet.Close>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="ghost"
						size="icon"
						surface="dark"
						class="size-11 bg-background/10"
						aria-label={m.a11y_close_menu()}
					>
						<XIcon aria-hidden="true" class="size-5" />
					</Button>
				{/snippet}
			</Sheet.Close>
		</Sheet.Header>

		<!-- Numbered rows in display type, separated by hairlines rather than boxed. -->
		<nav aria-label={m.a11y_main_nav()} class="flex-1 overflow-y-auto pt-10">
			<ul>
				{#each NAV_ITEMS as item, index (item.label)}
					<li class="border-b border-background/20">
						{#snippet row()}
							<!-- A fixed column, not tabular figures: DM Sans ships no tabular set, so
							     01 renders narrower than 02 and every label would start at its own
							     indent. The width is what actually lines the labels up. -->
							<span class="w-6 shrink-0 text-xs font-bold tracking-widest text-primary">
								{pad(index)}
							</span>
							<span class="flex-1 font-display text-3xl font-semibold">{item.label}</span>
						{/snippet}

						{#if item.inert}
							<!-- Inert destinations are not links: nothing promises a page that does not exist. -->
							<span class="flex items-center gap-3.5 py-5 text-background/55">
								{@render row()}
							</span>
						{:else}
							<a
								href={item.href}
								onclick={() => (open = false)}
								class="flex items-center gap-3.5 rounded-sm py-5 outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
							>
								{@render row()}
								<ArrowUpRightIcon aria-hidden="true" class="size-5 text-background/60" />
							</a>
						{/if}

					</li>
				{/each}
			</ul>
		</nav>

		<Sheet.Footer class="gap-3.5 p-0">
			<Button
				href={ROUTES.questionnaire}
				class="w-full rounded-full"
				onclick={() => (open = false)}
			>
				{HERO.primaryCta}
				<ArrowRightIcon aria-hidden="true" class="size-4" />
			</Button>
			<LanguageSelect display="full" showIcon surface="dark" class="self-start" />
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
