<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import * as Alert from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import {
		Field,
		FieldContent,
		FieldDescription,
		FieldLabel,
		FieldTitle
	} from '$lib/components/ui/field';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { formatEur } from '$lib/domain';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import FileCheckIcon from '@lucide/svelte/icons/file-check';
	import InfoIcon from '@lucide/svelte/icons/info';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import BuildingPlanScreen from './BuildingPlanScreen.svelte';
	import { answerStore } from './answers/store.svelte';
	import { checkoutFailures, recommendation as recommendationCopy } from './recommendation-content';
	import { requestCheckout, type CheckoutFailure } from './checkout-client';
	import { trackCheckoutStarted } from '$lib/analytics/events';
	import {
		chosenPlanName,
		defaultVariant,
		groupPlans,
		groupPrice,
		initialStep,
		modeOf,
		opensPrescriptionStep,
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
	 * The value the prescription card carries in the first screen's radio group. A sentinel
	 * rather than a variant id because the card stands for a group rather than for merchandise:
	 * there is nothing to buy until the second screen names one.
	 */
	const PRESCRIPTION_CARD = 'prescription-only';

	/**
	 * Which of the two screens is up. It opens on the treatments, or on the medications when
	 * that is all that was recommended, and moves forward only by confirming the card.
	 */
	let stepped = $state<PlanMode | null>(null);
	const step = $derived(stepped ?? initialStep(groups));

	/**
	 * One pick per screen, so going back does not lose what the first screen had chosen. Null
	 * until someone picks, and then RxScale's own default answers for them.
	 */
	let pickedTreatment = $state<string | null>(null);
	let pickedPrescription = $state<string | null>(null);

	const offersPrescriptionCard = $derived(
		groups.treatment.length > 0 && groups.prescription.length > 0
	);
	const cardPrice = $derived(groupPrice(groups.prescription));

	const treatmentChoice = $derived(
		pickedTreatment ?? defaultVariant(groups.treatment) ?? (offersPrescriptionCard ? PRESCRIPTION_CARD : '')
	);
	const prescriptionChoice = $derived(pickedPrescription ?? defaultVariant(groups.prescription) ?? '');

	/** What the cart is asked for, which the first screen has only when a treatment is picked. */
	const selected = $derived(
		step === 'prescription'
			? prescriptionChoice
			: treatmentChoice === PRESCRIPTION_CARD
				? ''
				: treatmentChoice
	);

	const cardChosen = $derived(step === 'treatment' && treatmentChoice === PRESCRIPTION_CARD);
	const goesToPrescriptionStep = $derived(opensPrescriptionStep(groups, step, cardChosen));

	const shown = $derived(groups[step]);
	const chosen = $derived(chosenPlanName(shown, selected));

	let ordering = $state(false);
	let failure = $state<CheckoutFailure | null>(null);

	/**
	 * The checkout is asked for here, on the press. Each one creates a cart at Shopify, so it
	 * must not happen on entry, on hover, or speculatively.
	 *
	 * Confirming the prescription card is the one press that buys nothing: it opens the second
	 * screen, where the medication is named. Nothing is ordered until that screen is confirmed.
	 */
	async function order(): Promise<void> {
		if (ordering || loading) return;

		if (goesToPrescriptionStep) {
			stepped = 'prescription';
			failure = null;
			return;
		}

		ordering = true;
		failure = null;

		const result = await requestCheckout(fetch, anamnesisUid, email, selected || null);

		if (!result.ok) {
			ordering = false;
			failure = result.reason;
			return;
		}

		// Sent before the navigation and with `sendBeacon`, because a batched event queued a
		// tick before `location.assign` never leaves the browser. The mode is the commerce
		// distinction the screen makes; the product, the dose and the uid are not sent.
		// Derived from what was chosen rather than from a tab: the two purchases are still the
		// distinction worth counting, and it is now implied by the variant.
		trackCheckoutStarted(modeOf(groups, selected) ?? step, plans.length > 0);

		// The questionnaire is over: the answers are with RxScale, the cart exists, and the
		// browser is leaving for Shopify. The stored copy goes now rather than on the way back,
		// because there is no way back: nothing returns to this app after the checkout.
		answerStore.finish();

		// Exactly as returned, and a full navigation because it leaves this app for Shopify.
		// `ordering` stays true: the button must not be pressable while the browser is leaving.
		window.location.assign(result.checkoutUrl);
	}

	/**
	 * Position on the flattened list, so the reveal cascades over cards rather than over plans:
	 * one plan can carry several doses and they are separate rows on screen. Capped, because
	 * past four steps the tail reads as a queue rather than as a cascade.
	 */
	function revealDelay(group: RecommendedPlan[], planIndex: number, optionIndex: number): number {
		const row =
			group.slice(0, planIndex).reduce((total, plan) => total + plan.options.length, 0) +
			optionIndex;

		return Math.min(row, 4) * 60;
	}
</script>

{#snippet planList(group: RecommendedPlan[], value: string, pick: (next: string) => void, card = false)}
	<RadioGroup.Root
		bind:value={() => value, pick}
		aria-label={COPY.choiceLabel}
		class="mt-4 gap-2"
	>
		{#each group as plan, planIndex (plan.id)}
			{#each plan.options as option, optionIndex (option.variantId)}
				{@const days = plan.prescriptionOnly ? null : option.therapyDays}
				{@const detail = [option.label, days ? COPY.durationFor(days) : '']
					.filter(Boolean)
					.join(' · ')}
				<!--
					The reveal sits on this wrapper rather than on the card itself. Both want to move
					the card vertically, and sharing one element would mean the press inherits the
					reveal's 300ms and its delay: the card would sink slowly under the finger and
					float back up afterwards.
				-->
				<div
					style="transition-delay: {revealDelay(group, planIndex, optionIndex)}ms"
					class="starting:translate-y-4 transition-[translate] duration-300 ease-out-quint motion-reduce:transition-none"
				>
					<!--
						The artboard's card at this screen's width. Its 900px content column scales to
						our 672px by 0.747, which puts the card at 80px tall on a 12px radius: on this
						project's radius scale `rounded-xl` is 28px and `rounded-2xl` 36px, either of
						which turns the row into a lozenge.
					-->
					<FieldLabel
						for="plan-{option.variantId}"
						class="has-[>[data-slot=field]]:rounded-sm *:data-[slot=field]:p-3
						       active:translate-y-px motion-reduce:active:translate-y-0"
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
				</div>
			{/each}
		{/each}

		{#if card}
			<!--
				A peer of the treatments, not a tab beside them: on this screen the distinction
				between buying medication and buying only the prescription for it is one the
				visitor is meeting for the first time. It carries an icon rather than a
				photograph because it stands for a service, and there is nothing to photograph.
			-->
			<div
				class="starting:translate-y-4 transition-[translate] duration-300 ease-out-quint motion-reduce:transition-none"
				style="transition-delay: {revealDelay(group, group.length, 0)}ms"
			>
				<FieldLabel
					for="plan-{PRESCRIPTION_CARD}"
					class="has-[>[data-slot=field]]:rounded-sm *:data-[slot=field]:p-3
					       active:translate-y-px motion-reduce:active:translate-y-0"
				>
					<Field
						orientation="horizontal"
						class="relative min-h-14 gap-3 has-[>[data-slot=field-content]]:items-center"
					>
						<span
							aria-hidden="true"
							class="flex size-14 shrink-0 items-center justify-center rounded-sm bg-accent text-accent-foreground"
						>
							<FileCheckIcon class="size-6" />
						</span>
						<FieldContent class="min-w-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
							<div class="min-w-0">
								<FieldTitle class="flex flex-wrap items-center gap-2 font-display text-base font-semibold">
									{COPY.prescriptionCard.title}
									<Badge variant="secondary" class="shrink-0">{COPY.prescriptionCard.badge}</Badge>
								</FieldTitle>
								<FieldDescription class="mt-0.5 text-xs">
									{COPY.prescriptionCard.body}
								</FieldDescription>
							</div>
							{#if cardPrice}
								<span class="shrink-0 font-display text-base font-semibold">
									{cardPrice.from
										? COPY.priceFrom(formatEur(cardPrice.price))
										: formatEur(cardPrice.price)}
								</span>
							{/if}
						</FieldContent>
						<RadioGroup.Item
							id="plan-{PRESCRIPTION_CARD}"
							value={PRESCRIPTION_CARD}
							aria-label={[
								COPY.prescriptionCard.title,
								COPY.prescriptionCard.body,
								cardPrice ? formatEur(cardPrice.price) : ''
							]
								.filter(Boolean)
								.join(' ')}
							class="absolute inset-0 size-full rounded-sm border-0 bg-transparent after:inset-0 data-checked:bg-transparent [&_[data-slot=radio-group-indicator]]:hidden"
						/>
					</Field>
				</FieldLabel>
			</div>
		{/if}
	</RadioGroup.Root>
{/snippet}

<!--
	The heading belongs to the choice, so it waits for one. Printed above the loading state it
	asked the visitor to choose from a list that was not there yet.
-->
{#if loading}
	<BuildingPlanScreen />
{:else}
	<!--
		The one moment in the product where somebody waits seconds for an answer about their own
		treatment. The block fades in as a whole and the cards inside it rise in sequence; the
		cards deliberately carry no opacity of their own, because two nested fades multiply and
		the cascade turns muddy.
	-->
	<div class="starting:opacity-0 transition-opacity duration-300 ease-out-quint motion-reduce:transition-none">
		{#if step === 'prescription' && offersPrescriptionCard}
			<!--
				Only when there was a first screen to come from. A recommendation of nothing but
				prescriptions opens here, and a back button would point at a screen that does not
				exist.
			-->
			<button
				type="button"
				onclick={() => (stepped = 'treatment')}
				class="mb-4 inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
			>
				<ArrowLeftIcon aria-hidden="true" class="size-4" />
				{COPY.prescriptionStep.back}
			</button>
		{/if}

		<p class="font-sans text-xs font-semibold tracking-widest text-highlight-foreground uppercase">
			{COPY.eyebrow}
		</p>
		<h1 class="mt-2 font-display text-3xl font-medium sm:text-4xl">
			{step === 'prescription' ? COPY.prescriptionStep.headline : COPY.choiceHeadline}
		</h1>
		<p class="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
			{step === 'prescription' ? COPY.prescriptionStep.body : COPY.choiceBody}
		</p>

		{#if plans.length > 0}
			{#if step === 'prescription'}
				{@render planList(groups.prescription, prescriptionChoice, (next) => (pickedPrescription = next))}
			{:else}
				{@render planList(
					groups.treatment,
					treatmentChoice,
					(next) => (pickedTreatment = next),
					offersPrescriptionCard
				)}
			{/if}

			<div class="mt-4 flex items-start gap-2 text-xs text-text-tertiary">
				<InfoIcon aria-hidden="true" class="mt-px size-3.5 shrink-0" />
				<p>{step === 'prescription' ? COPY.prescriptionStep.note : COPY.reviewNote}</p>
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
			{:else if failure}
				{m.q_try_again()}
				<ArrowRightIcon aria-hidden="true" class="absolute right-8" />
			{:else}
	
				{#if cardChosen}
					{COPY.prescriptionStep.action}
				{:else}
					{chosen ? COPY.actionFor(chosen) : COPY.action}
				{/if}
				<ArrowRightIcon aria-hidden="true" class="absolute right-8" />
			{/if}
		</Button>
	</div>
{/if}
