<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { dev } from '$app/environment';
	import { invalidate } from '$app/navigation';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import QuestionnaireShell from '$lib/features/questionnaire/QuestionnaireShell.svelte';
	import { QUESTIONNAIRE_HOME_HREF } from '$lib/features/questionnaire/routes';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	let retrying = $state(false);

	// Only a developer can act on which failure it was, so the reason stays out of the
	// user-facing copy. There is deliberately no local questionnaire to fall back to: a
	// model we invented would be rejected at submission and is not the approved one.
	const detail = $derived(
		data.questionnaire.ok
			? null
			: {
					'not-configured': 'PUBLIC_RXSCALE_QUESTIONNAIRE_UID is not set.',
					'not-found': 'The API does not recognise PUBLIC_RXSCALE_QUESTIONNAIRE_UID.',
					unavailable: 'The questionnaire API did not return a usable model.'
				}[data.questionnaire.reason]
	);

	async function retry(): Promise<void> {
		retrying = true;
		try {
			await invalidate('rxscale:questionnaire');
		} finally {
			retrying = false;
		}
	}
</script>

{#if data.questionnaire.ok}
	{@render children()}
{:else}
	<QuestionnaireShell backHref={QUESTIONNAIRE_HOME_HREF}>
		<h1 class="font-display text-4xl font-medium sm:text-5xl">{m.q_cannot_open_title()}</h1>
		<p class="mt-3 text-base text-muted-foreground md:text-lg">
			{m.q_cannot_open_body()}
		</p>

		<Button class="mt-8" onclick={retry} disabled={retrying}>
			<RefreshCwIcon aria-hidden="true" />
			{retrying ? m.q_retrying() : m.q_try_again()}
		</Button>

		{#if dev && detail}
			<Alert.Root class="mt-8">
				<Alert.Title>Development detail</Alert.Title>
				<Alert.Description>{detail}</Alert.Description>
			</Alert.Root>
		{/if}
	</QuestionnaireShell>
{/if}
