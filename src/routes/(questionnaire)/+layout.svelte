<script lang="ts">
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<!--
	The questionnaire is defined in this repository from feature 24, so there is nothing to
	fetch on the way in and no entry failure to render. Through feature 23 this layout carried
	three of them, for an unset uid, an unknown one, and an API that could not answer; all
	three are gone with the fetch, along with the retry that re-ran it.
-->
{@render children()}
