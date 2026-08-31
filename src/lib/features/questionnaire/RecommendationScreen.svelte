<script lang="ts">
	import * as Alert from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { RECOMMENDED_TREATMENT_ID } from '$lib/config/treatment';
	import { eur, findTreatment, formatEur } from '$lib/domain';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import CheckIcon from '@lucide/svelte/icons/check';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import { CHECKOUT_FAILURES, RECOMMENDATION as COPY } from './recommendation-content';
	import { requestCheckout, type CheckoutFailure } from './checkout-client';

	interface Props {
		/** Questions answered, from the plan. The reference's own count is a known defect. */
		questionTotal: number;
		/** The submitted anamnesis. Without it an order reaches a doctor with nothing to read. */
		anamnesisUid: string | null;
		/** Read from the answers by configured name, and null when the question was skipped. */
		email: string | null;
		/**
		 * False once the handoff has taken them. The count and the order action both describe a
		 * walk this browser no longer holds, so neither may be shown as though it still did.
		 */
		answersHeld: boolean;
		/** Called as the redirect is issued, while the answers are still worth something. */
		onhandoff: () => void;
	}

	let { questionTotal, anamnesisUid, email, answersHeld, onhandoff }: Props = $props();

	const treatment = findTreatment(RECOMMENDED_TREATMENT_ID);

	/**
	 * The order needs the answers, which only the browser has, so the action cannot work until
	 * this screen is running. It says so by staying disabled rather than by doing nothing.
	 */
	let hydrated = $state(false);
	$effect(() => {
		hydrated = true;
	});

	let ordering = $state(false);
	let failure = $state<CheckoutFailure | null>(null);

	/**
	 * The checkout is asked for here, on the press. Each one creates a cart at Shopify, so it
	 * must not happen on entry, on hover, or speculatively.
	 */
	async function order(): Promise<void> {
		if (ordering) return;

		ordering = true;
		failure = null;

		const result = await requestCheckout(fetch, anamnesisUid, email);

		if (!result.ok) {
			ordering = false;
			failure = result.reason;
			return;
		}

		// The answers have done their work: the anamnesis is filed and the checkout is built.
		onhandoff();

		// Exactly as returned, and a full navigation because it leaves this app for Shopify.
		// `ordering` stays true: the button must not be pressable while the browser is leaving.
		window.location.assign(result.checkoutUrl);
	}

	// Displayed, never charged: Shopify owns the amount, so this total is the sum of the
	// lines above it and nothing else depends on it.
	const total = $derived(
		eur(COPY.priceLines.reduce((sum, line) => sum + line.amount.amount, 0))
	);
</script>

<!--
	The artboard's celebration mark. Decorative: the heading below says the same thing, so it
	carries no label of its own.
-->
<div aria-hidden="true" class="flex justify-center">
	<span class="flex size-20 items-center justify-center rounded-full bg-highlight">
		<span class="flex size-14 items-center justify-center rounded-full bg-primary">
			<CheckIcon class="size-7 text-primary-foreground" />
		</span>
	</span>
</div>

{#if answersHeld}
	<p
		class="mt-3 text-center font-sans text-xs font-semibold tracking-widest text-highlight-foreground uppercase"
	>
		All {questionTotal} steps complete
	</p>
{/if}

<h1 class="mt-2 text-center font-display text-3xl font-medium sm:text-4xl">{COPY.headline}</h1>

<div class="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground sm:text-base">
	{#each COPY.body as line (line)}
		<p>{line}</p>
	{/each}
</div>

<ul class="mt-3 flex flex-wrap justify-center gap-2">
	{#each COPY.assurances as assurance (assurance)}
		<li>
			<Badge variant="secondary" class="gap-2 py-1">
				<CircleCheckIcon aria-hidden="true" class="size-4" />
				{assurance}
			</Badge>
		</li>
	{/each}
</ul>

{#if treatment}
	<section aria-labelledby="plan-heading" class="mt-4 rounded-lg bg-surface-warm p-4">
		<div class="flex flex-wrap items-baseline justify-between gap-2">
			<h2 id="plan-heading" class="font-display text-xl font-medium">{treatment.name}</h2>
			<p class="text-sm text-muted-foreground">{treatment.dose} · {treatment.form}</p>
		</div>

		<dl class="mt-3 space-y-1 text-sm">
			{#each COPY.priceLines as line (line.label)}
				<div class="flex items-baseline justify-between gap-4">
					<dt class="text-muted-foreground">{line.label}</dt>
					<dd class="font-display font-semibold">{formatEur(line.amount)}</dd>
				</div>
			{/each}
			<div class="flex items-baseline justify-between gap-4">
				<dt class="text-muted-foreground">{COPY.shippingLabel}</dt>
				<dd class="font-display font-semibold">{COPY.shippingValue}</dd>
			</div>

			<Separator class="my-2" />

			<div class="flex items-baseline justify-between gap-4">
				<dt class="font-medium text-foreground">{COPY.totalLabel}</dt>
				<dd class="font-display text-xl font-semibold">{formatEur(total)}</dd>
			</div>
		</dl>

		<p class="mt-2 text-xs text-text-tertiary">{COPY.totalNote}</p>
	</section>
{/if}

{#if answersHeld}
	{#if failure}
		<!--
			The press was supposed to open a payment page and nothing visible moved, so this is
			`assertive`: the reason is the only thing that explains what just happened.
		-->
		<Alert.Root variant="destructive" class="mt-4" role="alert" aria-live="assertive">
			<TriangleAlertIcon aria-hidden="true" />
			<Alert.Title>{CHECKOUT_FAILURES[failure].title}</Alert.Title>
			<Alert.Description>{CHECKOUT_FAILURES[failure].body}</Alert.Description>
		</Alert.Root>
	{/if}

	<Button
		type="button"
		size="lg"
		class="relative mt-4 w-full"
		disabled={!hydrated || ordering}
		onclick={order}
	>
		{#if ordering}
			Opening your checkout
		{:else}
			{failure ? 'Try again' : COPY.action}
			<ArrowRightIcon aria-hidden="true" class="absolute right-8" />
		{/if}
	</Button>
{:else}
	<!--
		Nothing here can build a second order: the answers a checkout is made from went with the
		handoff. Saying so beats an action that would fail for a reason that is not true.
	-->
	<p class="mt-4 text-center text-sm text-muted-foreground">
		Your checkout has already been opened, and this session's answers went with it. Ordering
		again starts from the questionnaire.
	</p>
{/if}

<p class="mt-3 text-center text-xs text-text-tertiary">{COPY.trust.join(' · ')}</p>
