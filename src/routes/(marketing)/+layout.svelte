<script lang="ts">
	// Temporarily hidden, not removed: the bar's copy still comes from Sanity and the
	// layout load still reads it, so putting it back is uncommenting these two lines.
	// import AnnouncementBar from '$lib/features/marketing/AnnouncementBar.svelte';
	import SiteFooter from '$lib/features/marketing/SiteFooter.svelte';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
</script>

<!--
	The header is not here: the landing page renders it inside the hero card as the overlay
	variant, and other marketing pages render the solid variant at the top of their own
	content. Putting it in the layout would force one of those to be wrong.
-->
<div class="flex min-h-svh flex-col bg-background">
	<!-- <AnnouncementBar announcement={data.announcement} /> -->
	<main class="flex-1">
		{@render children()}
	</main>
	<SiteFooter />
</div>
