<script lang="ts">
	import LegalPage from '$lib/features/legal/LegalPage.svelte';
	import { LEGAL_NOTICE } from '$lib/features/legal/content/legal-notice';
</script>

<svelte:head>
	<title>Impressum | Solean</title>
	<meta name="description" content="Impressum und Anbieterkennzeichnung von Solean." />
</svelte:head>

<LegalPage document={LEGAL_NOTICE} />
