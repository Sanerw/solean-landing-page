<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { Button } from '$lib/components/ui/button';
	import { analyticsConfigured } from './config';
	import { analyticsConsent } from './consent.svelte';

	/**
	 * The DSGVO gate. It is not dismissable and offers no third choice: refusing has to cost
	 * the same one press as agreeing, or the agreement is not freely given.
	 *
	 * Rendered only while the decision is missing, and the decision arrives from the server,
	 * so a returning visitor never sees it flash. A deployment with no Mixpanel token asks
	 * nothing, because there is nothing it would do with the answer.
	 */

	/**
	 * The banner is server-rendered, so both buttons exist before the handlers that answer
	 * them do. A press in that window would be swallowed and the visitor would be left
	 * pressing a banner that will not go away, which is the same reason the questionnaire's
	 * own action stays disabled until it can do its job.
	 */
	let hydrated = $state(false);
	$effect(() => {
		hydrated = true;
	});
</script>

{#if analyticsConfigured() && analyticsConsent.undecided}
	<div
		role="dialog"
		aria-modal="false"
		aria-labelledby="consent-title"
		class="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6"
	>
		<div
			class="mx-auto flex max-w-3xl flex-col gap-4 rounded-xl border border-border bg-background p-6 sm:flex-row sm:items-center sm:gap-6"
		>
			<div class="flex-1 space-y-1">
				<p id="consent-title" class="font-display text-lg font-semibold text-foreground">
					{m.consent_title()}
				</p>
				<p class="text-sm text-muted-foreground">
					{m.consent_body()}
					<!-- Un-localised like the footer's: the policy exists as one German document. -->
					<a
						href="/privacy"
						class="underline underline-offset-4 hover:text-highlight-foreground"
					>
						{m.consent_privacy_link()}
					</a>
				</p>
			</div>

			<!-- Decline first in the DOM and equal in weight: neither answer is the default. -->
			<div class="flex shrink-0 gap-2">
				<Button
					variant="outline"
					size="sm"
					disabled={!hydrated}
					onclick={() => analyticsConsent.decide('denied')}
				>
					{m.consent_decline()}
				</Button>
				<Button size="sm" disabled={!hydrated} onclick={() => analyticsConsent.decide('granted')}>
					{m.consent_accept()}
				</Button>
			</div>
		</div>
	</div>
{/if}
