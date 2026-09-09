<script lang="ts">
	import LegalPage from '$lib/features/legal/LegalPage.svelte';
	import { toLegalDocument } from '$lib/features/legal/from-sanity';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const document = $derived(toLegalDocument(data.page));
</script>

<LegalPage {document} lang={data.page.language} />
