<script lang="ts">
	import { getLocale } from '$lib/paraglide/runtime';
	import LegalPage from '$lib/features/legal/LegalPage.svelte';
	import { toLegalDocument } from '$lib/features/legal/from-sanity';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const document = $derived(toLegalDocument(data.page));
	const german = $derived(getLocale() === 'de');
</script>

<svelte:head>
	<title>{german ? 'Impressum | Solean' : 'Legal notice | Solean'}</title>
	<meta name="description" content={german ? 'Impressum von Solean.' : 'Legal notice of Solean.'} />
</svelte:head>

<LegalPage {document} lang={data.page.language} />
