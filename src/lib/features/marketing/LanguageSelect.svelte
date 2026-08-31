<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import { LANGUAGES } from './content';

	interface Props {
		/** Matches SiteHeader's variant so the control reads on either ground. */
		surface?: 'default' | 'dark';
		/** `bare` strips the field chrome for the header; `field` keeps the primitive's own box. */
		variant?: 'bare' | 'field';
		/** The footer shows the full name; the header shows the short code. */
		display?: 'short' | 'full';
		showIcon?: boolean;
		class?: string;
	}

	let {
		surface = 'default',
		variant = 'bare',
		display = 'short',
		showIcon = false,
		class: className
	}: Props = $props();

	// Only English is selectable, so this never actually changes. It is bound anyway so the
	// control behaves like a real Select rather than a decoration.
	let value = $state('en');

	const selected = $derived(LANGUAGES.find((language) => language.value === value) ?? LANGUAGES[0]);
	const label = $derived(display === 'short' ? selected.short : selected.label);
</script>

<!--
	Select's own trigger is a form field: h-14, bordered, card fill. That is what the footer
	reference draws, so `field` takes the primitive untouched. A header is the wrong place for
	a form field, so `bare` strips the chrome down to text and a chevron.
-->
<Select.Root type="single" bind:value>
	<Select.Trigger
		aria-label="Language"
		class={[
			variant === 'field' && 'w-fit',
			// Geometry and states are the NavigationMenu link's, so the control reads as one
			// more item in the row rather than a form field parked beside it.
			variant === 'bare' && [
				'h-9 w-auto gap-1.5 rounded-full border-transparent bg-transparent px-4.5 py-2.5 text-sm font-medium',
				// The chevron is the primitive's own, so it is matched to the NavigationMenu
				// trigger's here rather than left at the form field's size and grey.
				'[&>svg]:size-3 [&>svg]:text-current',
				surface === 'dark'
					? 'text-background hover:bg-background/10 hover:text-background data-[state=open]:bg-background/10 data-[state=open]:text-background focus-visible:ring-primary focus-visible:ring-offset-foreground'
					: 'text-foreground hover:bg-accent data-[state=open]:bg-accent data-[state=open]:text-accent-foreground'
			],
			className
		]}
	>
		<!-- One child, so the trigger's justify-between separates the label group from the
		     chevron rather than spreading the icon away from the word it belongs to. -->
		<span class="flex items-center gap-2">
			{#if showIcon}
				<GlobeIcon aria-hidden="true" class="size-4" />
			{/if}
			{label}
		</span>
	</Select.Trigger>
	<Select.Content>
		{#each LANGUAGES as language (language.value)}
			<Select.Item value={language.value} label={language.label} disabled={!language.available} />
		{/each}
	</Select.Content>
</Select.Root>
