<script lang="ts">
	import * as Alert from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
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
		 *
		 * Reachable only when a browser restores this page alive, from its back-forward cache,
		 * after the redirect to Shopify. A plain reload holds nothing at all and lands back at
		 * the first question instead, because nothing is stored.
		 */
		answersHeld: boolean;
		/**
		 * Confirmed on the screen before this one. Null is a real answer: RxScale recommended
		 * nothing, or could not be reached, and the fallback plan is what gets ordered.
		 */
		selectedVariant: string | null;
		/** Returns to the choice, which is the only way to order something else. */
		onchangeplan: () => void;
		/** Called as the redirect is issued, while the answers are still worth something. */
		onhandoff: () => void;
	}

	let {
		questionTotal,
		anamnesisUid,
		email,
		answersHeld,
		selectedVariant,
		onchangeplan,
		onhandoff
	}: Props = $props();

	/**
	 * The order needs the answers, which only the browser has, so nothing here can work until
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

		const result = await requestCheckout(fetch, anamnesisUid, email, selectedVariant);

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

{#if answersHeld}
	{#if failure}
		<!--
			`assertive`: the reason is the only thing that explains what just happened.
		-->
		<Alert.Root variant="destructive" class="mt-6" role="alert" aria-live="assertive">
			<TriangleAlertIcon aria-hidden="true" />
			<Alert.Title>{CHECKOUT_FAILURES[failure].title}</Alert.Title>
			<Alert.Description>{CHECKOUT_FAILURES[failure].body}</Alert.Description>
		</Alert.Root>
	{/if}

	<Button type="button" class="relative mt-6 w-full" disabled={!hydrated || ordering} onclick={order}>
		{#if ordering}
			{COPY.ordering}
		{:else}
			{failure ? 'Try again' : COPY.action}
			<ArrowRightIcon aria-hidden="true" class="absolute right-8" />
		{/if}
	</Button>

	<!--
		The choice was made on the previous screen and nothing here names it, so the way back to
		it has to be visible: without this the plan is unchangeable until the session ends.
	-->
	<Button
		type="button"
		variant="ghost"
		class="mt-2 w-full"
		disabled={!hydrated || ordering}
		onclick={onchangeplan}
	>
		{COPY.changeAction}
	</Button>
{:else}
	<!--
		Nothing here can build a second order: the answers a checkout is made from went with the
		handoff. Saying so beats an action that would fail for a reason that is not true. Only a
		back-forward cache restore arrives here; a reload starts the questionnaire over.
	-->
	<p class="mt-4 text-center text-sm text-muted-foreground">
		Your checkout has already been opened, and this session's answers went with it. Ordering
		again starts from the questionnaire.
	</p>
{/if}

<Separator class="mt-6" />
<p class="mt-3 text-center text-xs text-text-tertiary">{COPY.trust.join(' · ')}</p>
