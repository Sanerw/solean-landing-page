<script lang="ts">
	import * as Alert from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Field, FieldContent, FieldLabel, FieldTitle } from '$lib/components/ui/field';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Separator } from '$lib/components/ui/separator';
	import { formatEur } from '$lib/domain';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import CheckIcon from '@lucide/svelte/icons/check';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import { CHECKOUT_FAILURES, RECOMMENDATION as COPY } from './recommendation-content';
	import { requestCheckout, type CheckoutFailure } from './checkout-client';
	import {
		defaultVariant,
		fetchRecommendation,
		type RecommendedPlan
	} from './recommendation-client';

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

	/**
	 * The order needs the answers, which only the browser has, so nothing here can work until
	 * this screen is running. It says so by staying disabled rather than by doing nothing.
	 */
	let hydrated = $state(false);
	$effect(() => {
		hydrated = true;
	});

	let loading = $state(true);
	let plans = $state<RecommendedPlan[]>([]);
	let unreachable = $state(false);
	let selected = $state('');

	/**
	 * Read once the browser has the uid. This is a read and creates nothing, which is why it
	 * may happen on entry where the checkout may not.
	 */
	$effect(() => {
		if (!hydrated || !answersHeld) return;

		let current = true;
		void (async () => {
			const result = await fetchRecommendation(fetch, anamnesisUid);
			if (!current) return;

			loading = false;
			unreachable = !result.ok;
			plans = result.ok ? result.plans : [];
			selected = defaultVariant(plans) ?? '';
		})();

		return () => {
			current = false;
		};
	});

	// Two headings, because a prescription with no medication is a different purchase and its
	// lower price would otherwise read as a discount on the same thing.
	const treatments = $derived(plans.filter((plan) => !plan.prescriptionOnly));
	const prescriptions = $derived(plans.filter((plan) => plan.prescriptionOnly));

	/** Nothing recommended is an answer. The order still stands, on the configured plan. */
	const nothingOffered = $derived(!loading && plans.length === 0);

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

		const result = await requestCheckout(fetch, anamnesisUid, email, selected || null);

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

{#snippet planGroup(group: RecommendedPlan[], heading: string, note: string | null)}
	<section class="mt-4">
		<h2 class="font-sans text-xs font-semibold tracking-widest text-text-tertiary uppercase">
			{heading}
		</h2>
		{#if note}
			<p class="mt-1 text-xs text-text-tertiary">{note}</p>
		{/if}

		<div class="mt-3 space-y-3">
			{#each group as plan (plan.id)}
				<div class="rounded-lg bg-surface-warm p-4">
					<div class="flex items-center gap-3">
						{#if plan.image}
							<img
								src={plan.image}
								alt=""
								loading="lazy"
								class="size-12 shrink-0 rounded-md bg-card object-contain"
							/>
						{/if}
						<h3 class="font-display text-lg font-medium">{plan.name}</h3>
					</div>

					<div class="mt-3 grid gap-2 sm:grid-cols-2">
						{#each plan.options as option (option.variantId)}
							<FieldLabel
								for="plan-{option.variantId}"
								class="*:data-[slot=field]:min-h-12 *:data-[slot=field]:p-3"
							>
								<Field
									orientation="horizontal"
									class="has-[>[data-slot=field-content]]:items-center"
								>
									<!--
										Named here rather than by the wrapping `<label for>`, which does not
										name a `<button role="radio">`. Plan, dose and price together, because
										each alone leaves out what a person is choosing between: the price is
										beside the option visually and would otherwise never be announced.
									-->
									<RadioGroup.Item
										id="plan-{option.variantId}"
										value={option.variantId}
										aria-label={[plan.name, option.label, formatEur(option.price)]
											.filter(Boolean)
											.join(' ')}
									/>
									<FieldContent class="min-w-0">
										<FieldTitle
											class="flex w-full min-w-0 items-baseline justify-between gap-3 font-display text-sm font-semibold"
										>
											{#if option.label}
												<span class="min-w-0 break-words">{option.label}</span>
											{/if}
											<span class="ml-auto shrink-0">{formatEur(option.price)}</span>
										</FieldTitle>
									</FieldContent>
								</Field>
							</FieldLabel>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</section>
{/snippet}

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
	{#if loading}
		<p role="status" class="mt-6 text-center text-sm text-muted-foreground">
			{COPY.loading}
		</p>
	{:else if plans.length > 0}
		<!--
			One group across every plan: a person orders one treatment, so two treatments and a
			prescription are three answers to the same question, not three questions.
		-->
		<RadioGroup.Root bind:value={selected} aria-label={COPY.choiceLabel}>
			{#if treatments.length > 0}
				{@render planGroup(treatments, COPY.treatmentsHeading, null)}
			{/if}
			{#if prescriptions.length > 0}
				{@render planGroup(prescriptions, COPY.prescriptionsHeading, COPY.prescriptionsNote)}
			{/if}
		</RadioGroup.Root>

		<p class="mt-3 text-xs text-text-tertiary">{COPY.totalNote}</p>
	{:else}
		<!--
			Both cases say the same thing on purpose: what the person can do next is identical,
			and "we could not reach the service" invites a reload that changes nothing here.
		-->
		<Alert.Root class="mt-6">
			<CircleCheckIcon aria-hidden="true" />
			<Alert.Title>{COPY.noPlans.title}</Alert.Title>
			<Alert.Description>{COPY.noPlans.body}</Alert.Description>
		</Alert.Root>
	{/if}

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
		size="default"
		class="relative mt-4 w-full"
		disabled={!hydrated || loading || ordering || (!selected && !nothingOffered && !unreachable)}
		onclick={order}
	>
		{#if ordering}
			{COPY.ordering}
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

<Separator class="mt-6" />
<p class="mt-3 text-center text-xs text-text-tertiary">{COPY.trust.join(' · ')}</p>
