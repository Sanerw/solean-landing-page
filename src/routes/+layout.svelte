<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.ico';
	// Preloaded rather than left to the stylesheet: the @font-face rules sit inside a CSS
	// file that is itself @import-ed, so the browser only discovers the woff2 after two
	// nested stylesheet round trips, long after first paint.
	import dmSans from '@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2?url';
	import interTight from '@fontsource-variable/inter-tight/files/inter-tight-latin-wght-normal.woff2?url';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} type="image/x-icon" />
	<link rel="preload" href={interTight} as="font" type="font/woff2" crossorigin="anonymous" />
	<link rel="preload" href={dmSans} as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>
{@render children()}
