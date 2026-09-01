<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import {
		Field,
		FieldContent,
		FieldDescription,
		FieldLabel,
		FieldTitle
	} from '$lib/components/ui/field';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import * as Tabs from '$lib/components/ui/tabs';
	import { formatEur } from '$lib/domain';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import InfoIcon from '@lucide/svelte/icons/info';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import BuildingPlanScreen from './BuildingPlanScreen.svelte';
	import { checkoutFailures, recommendation as recommendationCopy } from './recommendation-content';
	import { requestCheckout, type CheckoutFailure } from './checkout-client';
	import {
		chosenPlanName,
		defaultVariant,
		groupPlans,
		initialMode,
		type PlanMode
	} from './plan-choice';
	import type { RecommendedPlan } from './recommendation';
	import { fetchRecommendation, type RecommendationFetch } from './recommendation-client';

	interface Props {
		anamnesisUid: string | null;
		/** Read from the answers by configured name, and null when the question was skipped. */
		email: string | null;
	}

	let { anamnesisUid, email }: Props = $props();

	// Read during render so the copy follows the active locale.
	const COPY = $derived(recommendationCopy());
	const CHECKOUT_FAILURES = $derived(checkoutFailures());

	let hydrated = $state(false);
	$effect(() => {
		hydrated = true;
	});

	/** Null until the read below returns, which is what the building screen covers. */
	let source = $state<RecommendationFetch | null>(null);

	const loading = $derived(source === null);
	const plans = $derived<RecommendedPlan[]>(source?.ok ? source.plans : []);

	/**
	 * The wait this screen exists to cover. It is a read and creates nothing, so arriving here
	 * twice is safe; the submission that made the record happened on the previous screen.
	 */
	$effect(() => {
		if (!hydrated) return;

		let current = true;
		void (async () => {
			const result = await fetchRecommendation(fetch, anamnesisUid);
			if (current) source = result;
		})();

		return () => {
			current = false;
		};
	});

	const groups = $derived(groupPlans(plans));

	/**
	 * Which of the two purchases is on screen. Never both: their prices are not comparable.
	 * Null until someone switches, so the opening list follows the plans themselves rather
	 * than an effect that has to run first.
	 */
	let switched = $state<PlanMode | null>(null);
	const mode = $derived(switched ?? initialMode(groups));

	/**
	 * Null until someone picks, and then RxScale's own default answers for them. Cleared by a
	 * switch, so a treatment cannot stay chosen while a list of prescriptions is on screen and
	 * the button cannot confirm merchandise nobody can see.
	 */
	let picked = $state<string | null>(null);
	const selected = $derived(picked ?? defaultVariant(groups[mode]) ?? '');

	const shown = $derived(groups[mode]);
	const bothOffered = $derived(groups.treatment.length > 0 && groups.prescription.length > 0);
	const chosen = $derived(chosenPlanName(shown, selected));

	function switchTo(next: string): void {
		if (next !== 'treatment' && next !== 'prescription') return;

		switched = next;
		picked = null;
	}

	let ordering = $state(false);
	let failure = $state<CheckoutFailure | null>(null);

	/**
	 * The checkout is asked for here, on the press. Each one creates a cart at Shopify, so it
	 * must not happen on entry, on hover, or speculatively.
	 */
	async function order(): Promise<void> {
		if (ordering || loading) return;

		ordering = true;
		failure = null;

		const result = await requestCheckout(fetch, anamnesisUid, email, selected || null);

		if (!result.ok) {
			ordering = false;
			failure = result.reason;
			return;
		}

		// Exactly as returned, and a full navigation because it leaves this app for Shopify.
		// `ordering` stays true: the button must not be pressable while the browser is leaving.
		window.location.assign(result.checkoutUrl);
	}
</script>

{#snippet planList(group: RecommendedPlan[])}
	<RadioGroup.Root
		bind:value={() => selected, (next) => (picked = next)}
		aria-label={COPY.choiceLabel}
		class="mt-4 gap-2"
	>
		{#each group as plan (plan.id)}
			{#each plan.options as option (option.variantId)}
				{@const days = plan.prescriptionOnly ? null : option.therapyDays}
				{@const detail = [option.label, days ? COPY.durationFor(days) : '']
					.filter(Boolean)
					.join(' · ')}
				<!--
					The artboard's card at this screen's width. Its 900px content column scales to
					our 672px by 0.747, which puts the card at 80px tall on a 12px radius: on this
					project's radius scale `rounded-xl` is 28px and `rounded-2xl` 36px, either of
					which turns the row into a lozenge.
				-->
				<FieldLabel
					for="plan-{option.variantId}"
					class="has-[>[data-slot=field]]:rounded-sm *:data-[slot=field]:p-3"
				>
					<Field
						orientation="horizontal"
						class="relative min-h-14 gap-3 has-[>[data-slot=field-content]]:items-center"
					>
						{#if plan.image}
							<img
								src={plan.image}
								alt=""
								loading="lazy"
								class="size-14 shrink-0 rounded-sm bg-secondary object-contain"
							/>
						{/if}
						<!--
							The price leaves the name's line below `sm`: a product name long enough to wrap
							would otherwise push it between the name and the dose, which reads as though
							it belonged to neither.
						-->
						<FieldContent class="min-w-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
							<div class="min-w-0">
								<FieldTitle class="block w-full min-w-0 break-words font-display text-base font-semibold">
									{plan.name}
								</FieldTitle>
								{#if detail}
									<FieldDescription class="mt-0.5 text-xs">{detail}</FieldDescription>
								{/if}
							</div>
							<span class="shrink-0 font-display text-base font-semibold">
								{formatEur(option.price)}
							</span>
						</FieldContent>
						<!--
							The row itself is the control: the radio covers it, draws nothing, and lets
							the card's own gold border and fill carry the choice. Kept as a real radio
							rather than a click handler so the group stays arrow-navigable and a screen
							reader still announces "radio, checked"; covering the card is also what puts
							its focus ring around the whole row instead of around a circle.
						-->
						<RadioGroup.Item
							id="plan-{option.variantId}"
							value={option.variantId}
							aria-label={[plan.name, option.label, formatEur(option.price)]
								.filter(Boolean)
								.join(' ')}
							class="absolute inset-0 size-full rounded-sm border-0 bg-transparent after:inset-0 data-checked:bg-transparent [&_[data-slot=radio-group-indicator]]:hidden"
						/>
					</Field>
				</FieldLabel>
			{/each}
		{/each}
	</RadioGroup.Root>
{/snippet}

<!--
	The heading belongs to the choice, so it waits for one. Printed above the loading state it
	asked the visitor to choose from a list that was not there yet.
-->
{#if loading}
	<BuildingPlanScreen />
{:else}
	<p class="font-sans text-xs font-semibold tracking-widest text-highlight-foreground uppercase">
		{COPY.eyebrow}
	</p>
	<h1 class="mt-2 font-display text-3xl font-medium sm:text-4xl">{COPY.choiceHeadline}</h1>
	<p class="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">{COPY.choiceBody}</p>

	{#if plans.length > 0}
		{#if bothOffered}
			<Tabs.Root value={mode} onValueChange={switchTo} class="mt-6">
				<Tabs.List class="w-full">
					<Tabs.Trigger value="treatment">{COPY.modes.treatment}</Tabs.Trigger>
					<Tabs.Trigger value="prescription">{COPY.modes.prescription}</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="treatment">
					{@render planList(groups.treatment)}
				</Tabs.Content>
				<Tabs.Content value="prescription">
					{@render planList(groups.prescription)}
				</Tabs.Content>
			</Tabs.Root>
		{:else}
			<!-- One list, so there is nothing to switch between and no tab to name it. -->
			{@render planList(shown)}
		{/if}

		<div class="mt-4 flex items-start gap-2 text-xs text-text-tertiary">
			<InfoIcon aria-hidden="true" class="mt-px size-3.5 shrink-0" />
			<p>{COPY.reviewNote}</p>
		</div>
	{:else}
		<Alert.Root class="mt-6">
			<CircleCheckIcon aria-hidden="true" />
			<Alert.Title>{COPY.noPlans.title}</Alert.Title>
			<Alert.Description>{COPY.noPlans.body}</Alert.Description>
		</Alert.Root>
	{/if}

	{#if failure}
		<!-- `assertive`: the reason is the only thing that explains what just happened. -->
		<Alert.Root variant="destructive" class="mt-6" role="alert" aria-live="assertive">
			<TriangleAlertIcon aria-hidden="true" />
			<Alert.Title>{CHECKOUT_FAILURES[failure].title}</Alert.Title>
			<Alert.Description>{CHECKOUT_FAILURES[failure].body}</Alert.Description>
		</Alert.Root>
	{/if}

	<Button
		type="button"
		class="relative mt-6 w-full"
		disabled={!hydrated || ordering}
		onclick={order}
	>
		{#if ordering}
			{COPY.ordering}
		{:else}
			{failure ? m.q_try_again() : chosen ? COPY.actionFor(chosen) : COPY.action}
			<ArrowRightIcon aria-hidden="true" class="absolute right-8" />
		{/if}
	</Button>
{/if}
