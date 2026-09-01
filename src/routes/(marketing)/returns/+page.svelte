<script lang="ts">
	import LegalPage from '$lib/features/legal/LegalPage.svelte';
	import { RETURNS } from '$lib/features/legal/content/returns';
</script>

<svelte:head>
	<title>Widerrufsrecht | Solean</title>
	<meta name="description" content="Widerrufsbelehrung und Muster-Widerrufsformular von Solean." />
</svelte:head>

<LegalPage document={RETURNS} />
