<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import * as Sheet from '$lib/components/ui/sheet';
	import MenuIcon from '@lucide/svelte/icons/menu';
	import { HERO, NAV_ITEMS, ROUTES } from './content';
	import LanguageSelect from './LanguageSelect.svelte';

	interface Props {
		surface?: 'default' | 'dark';
	}

	let { surface = 'default' }: Props = $props();

	let open = $state(false);

	/** Inert destinations render as plain text so nothing promises a page that does not exist. */
	function linkClass(inert: boolean | undefined) {
		return inert
			? 'block py-2 text-base text-text-faint'
			: 'block rounded-sm py-2 text-base font-medium text-foreground outline-none hover:text-highlight-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="ghost"
				size="icon"
				{surface}
				class="lg:hidden"
				aria-label="Open menu"
			>
				<MenuIcon aria-hidden="true" />
			</Button>
		{/snippet}
	</Sheet.Trigger>

	<Sheet.Content side="right" class="w-full sm:max-w-sm">
		<Sheet.Header>
			<Sheet.Title>Menu</Sheet.Title>
		</Sheet.Header>

		<!-- Treatments is expanded inline rather than nested: a disclosure inside a sheet
		     adds a second layer of keyboard state for no gain on a short list. -->
		<nav aria-label="Main" class="flex-1 overflow-y-auto px-4">
			<ul class="space-y-1">
				{#each NAV_ITEMS as item (item.label)}
					<li>
						{#if item.inert}
							<span class={linkClass(true)}>{item.label}</span>
						{:else}
							<a href={item.href} class={linkClass(false)} onclick={() => (open = false)}>
								{item.label}
							</a>
						{/if}

						{#if item.children}
							<ul class="mb-2 ml-4 space-y-1 border-l border-border pl-4">
								{#each item.children as child (child.label)}
									<li>
										{#if child.inert}
											<span class="block py-1.5 text-sm text-text-faint">{child.label}</span>
										{:else}
											<a
												href={child.href}
												class="block rounded-sm py-1.5 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
												onclick={() => (open = false)}
											>
												{child.label}
											</a>
										{/if}
									</li>
								{/each}
							</ul>
						{/if}
					</li>
				{/each}
			</ul>
		</nav>

		<Sheet.Footer>
			<Separator class="mb-4" />
			<Button href={ROUTES.questionnaire} size="lg" class="w-full" onclick={() => (open = false)}>
				{HERO.primaryCta}
			</Button>
			<LanguageSelect display="full" showIcon class="mt-2 self-start" />
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
