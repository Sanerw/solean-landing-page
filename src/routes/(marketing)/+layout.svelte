<script lang="ts">
	import AnnouncementBar from '$lib/features/marketing/AnnouncementBar.svelte';
	import SiteFooter from '$lib/features/marketing/SiteFooter.svelte';

	let { children } = $props();
</script>

<!--
	The header is not here: the landing page renders it inside the hero card as the overlay
	variant, and other marketing pages render the solid variant at the top of their own
	content. Putting it in the layout would force one of those to be wrong.
-->
<div class="flex min-h-svh flex-col bg-background">
	<AnnouncementBar />
	<main class="flex-1">
		{@render children()}
	</main>
	<SiteFooter />
</div>
