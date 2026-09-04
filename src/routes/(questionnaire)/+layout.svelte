<script lang="ts">
	import { answerStore } from '$lib/features/questionnaire/answers/store.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// Here rather than in a page: the layout is entered once for the whole funnel, so the
	// stored answers are read once and every screen below sees the same restored session.
	// Guarded inside the store against running on the server, where the module is shared
	// between requests and `localStorage` does not exist.
	answerStore.restore();
</script>

<!--
	The questionnaire is defined in this repository from feature 24, so there is nothing to
	fetch on the way in and no entry failure to render. Through feature 23 this layout carried
	three of them, for an unset uid, an unknown one, and an API that could not answer; all
	three are gone with the fetch, along with the retry that re-ran it.
-->
{@render children()}
