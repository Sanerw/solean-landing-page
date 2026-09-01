<script lang="ts">
	import LegalPage from '$lib/features/legal/LegalPage.svelte';
	import { PRIVACY } from '$lib/features/legal/content/privacy';
</script>

<svelte:head>
	<title>Datenschutzerklärung | Solean</title>
	<meta name="description" content="Datenschutzerklärung von Solean." />
</svelte:head>

<LegalPage document={PRIVACY} />
