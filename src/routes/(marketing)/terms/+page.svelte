<script lang="ts">
	import LegalPage from '$lib/features/legal/LegalPage.svelte';
	import { TERMS } from '$lib/features/legal/content/terms';
</script>

<svelte:head>
	<title>AGB | Solean</title>
	<meta name="description" content="Allgemeine Geschäftsbedingungen von Solean." />
</svelte:head>

<LegalPage document={TERMS} />
