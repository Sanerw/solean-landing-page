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
	import ConsentBanner from '$lib/analytics/ConsentBanner.svelte';
	import { analyticsConsent } from '$lib/analytics/consent.svelte';
	import { trackPageView } from '$lib/analytics/events';
	import { alternatesFor } from '$lib/i18n/alternates';
	import { entersQuestionnaire } from '$lib/navigation/view-transition';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	// Destructured once at setup: the value only changes on a full load, because enabling
	// preview is a redirect through `/preview/enable` rather than a client-side transition.
	// svelte-ignore state_referenced_locally
	const { previewEnabled } = data;

	/**
	 * Seeded before anything can be tracked, and only ever from the server's read of the
	 * cookie. Done at setup rather than in an effect so the banner's first render already
	 * knows the answer and a returning visitor never sees it appear and vanish.
	 */
	// svelte-ignore state_referenced_locally
	analyticsConsent.hydrate(data.analyticsConsent);

	/**
	 * Loaded only once preview is on, never at module scope, and that includes the client, whose
	 * module imports the same entry point. `@sanity/sveltekit` has a single entry point that also
	 * carries the Visual Editing overlay and Sanity UI's stylesheet, whose rules are unlayered and
	 * so outrank every Tailwind utility. The production build tree-shakes it away for ordinary
	 * visitors; the dev server does not, so a static import here would strip the layout off every
	 * page under `pnpm dev`.
	 */
	const preview = previewEnabled
		? Promise.all([import('@sanity/sveltekit'), import('$lib/sanity/client')])
		: null;

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

	/**
	 * The page view, sent from here because SvelteKit navigates on the client: the SDK's own
	 * listener would only ever see the first load. Questionnaire steps are excluded by
	 * `trackPageView` itself, since their paths are derived from the answers.
	 *
	 * It depends on the consent decision as well as the path, and that is not incidental. The
	 * banner is answered on the page the visitor landed on, by which time this effect has
	 * already run and been dropped for want of consent; without the decision as a dependency
	 * the first page view, the arrival itself, is the one view never recorded.
	 */
	$effect(() => {
		analyticsConsent.state;
		trackPageView(page.url.pathname);
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

{#if preview}
	{#await preview then [{ PreviewMode, VisualEditing, QueryLoader }, { client }]}
		<PreviewMode enabled>
			<VisualEditing enabled>
				<QueryLoader enabled {client}>
					{@render children()}
				</QueryLoader>
			</VisualEditing>
		</PreviewMode>
	{/await}
{:else}
	{@render children()}
{/if}

<ConsentBanner />
