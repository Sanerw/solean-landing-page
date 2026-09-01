<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.ico';
	// Preloaded rather than left to the stylesheet: the @font-face rules sit inside a CSS
	// file that is itself @import-ed, so the browser only discovers the woff2 after two
	// nested stylesheet round trips, long after first paint.
	import dmSans from '@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2?url';
	import interTight from '@fontsource-variable/inter-tight/files/inter-tight-latin-wght-normal.woff2?url';
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { alternatesFor } from '$lib/i18n/alternates';
	import { entersQuestionnaire } from '$lib/navigation/view-transition';

	let { children } = $props();

	/**
	 * One crossfade, for the one navigation that is a hard cut: a photographic marketing page
	 * replaced by the funnel's bare shell. Every other navigation keeps the instant swap, and
	 * whether the motion actually plays is left to the stylesheet, which can ask about reduced
	 * motion in a way this callback cannot undo halfway through a transition.
	 */
	onNavigate((navigation) => {
		if (!entersQuestionnaire(navigation.from?.route.id, navigation.to?.route.id)) return;
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	// One alternate per locale for the page being viewed, plus x-default.
	const links = $derived(alternatesFor(page.url.pathname));
</script>

<svelte:head>
	<link rel="icon" href={favicon} type="image/x-icon" />
	<link rel="preload" href={interTight} as="font" type="font/woff2" crossorigin="anonymous" />
	<link rel="preload" href={dmSans} as="font" type="font/woff2" crossorigin="anonymous" />
	{#each links.alternates as alternate (alternate.locale)}
		<link rel="alternate" hreflang={alternate.locale} href={alternate.href} />
	{/each}
	<link rel="alternate" hreflang="x-default" href={links.canonical} />
</svelte:head>
{@render children()}
