<script lang="ts">
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { Field, FieldContent, FieldLabel, FieldTitle } from '$lib/components/ui/field';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { formatEur } from '$lib/domain';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import { RECOMMENDATION as COPY } from './recommendation-content';
	import {
		defaultVariant,
		fetchRecommendation,
		type RecommendationFetch,
		type RecommendedPlan
	} from './recommendation-client';

	interface Props {
		anamnesisUid: string | null;
		/**
		 * Started by the last Continue, and still in flight: awaiting it here is what keeps the
		 * screen from making a second request for something the submission already asked for.
		 */
		prefetched?: Promise<RecommendationFetch> | null;
		onconfirm: (variantId: string | null) => void;
	}

	let { anamnesisUid, prefetched = null, onconfirm }: Props = $props();

	let hydrated = $state(false);
	$effect(() => {
		hydrated = true;
	});

	let loading = $state(true);
	let plans = $state<RecommendedPlan[]>([]);
	let unreachable = $state(false);
	let selected = $state('');

	/**
	 * Read once the browser is running. A reload arrives with no prefetch to inherit, so it
	 * repeats the request itself, which is safe: this is a read and creates nothing.
	 */
	$effect(() => {
		if (!hydrated) return;

		let current = true;
		void (async () => {
			const result = await (prefetched ?? fetchRecommendation(fetch, anamnesisUid));
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

	const treatments = $derived(plans.filter((plan) => !plan.prescriptionOnly));
	const prescriptions = $derived(plans.filter((plan) => plan.prescriptionOnly));
	const nothingOffered = $derived(!loading && plans.length === 0);

	function confirm(): void {
		if (loading || (!selected && !nothingOffered && !unreachable)) return;

		onconfirm(selected || null);
	}
</script>

{#snippet planGroup(group: RecommendedPlan[], heading: string, note: string | null)}
	<section class="mt-6">
		<h2 class="font-sans text-xs font-semibold tracking-widest text-text-tertiary uppercase">
			{heading}
		</h2>
		{#if note}
			<p class="mt-1 text-xs text-text-tertiary">{note}</p>
		{/if}

		<div class="mt-3 space-y-3">
			{#each group as plan (plan.id)}
				<div class="rounded-2xl bg-surface-warm p-4 sm:p-5">
					<div class="flex items-center gap-3">
						{#if plan.image}
							<img
								src={plan.image}
								alt=""
								loading="lazy"
								class="size-14 shrink-0 rounded-xl bg-card object-contain"
							/>
						{/if}
						<h3 class="font-display text-lg font-medium sm:text-xl">{plan.name}</h3>
					</div>

					<div class="mt-4 grid gap-2 sm:grid-cols-2">
						{#each plan.options as option (option.variantId)}
							<FieldLabel
								for="plan-{option.variantId}"
								class="*:data-[slot=field]:min-h-14 *:data-[slot=field]:rounded-xl *:data-[slot=field]:border *:data-[slot=field]:border-border *:data-[slot=field]:bg-card *:data-[slot=field]:p-3 has-[[data-checked]]:*:data-[slot=field]:border-primary"
							>
								<Field orientation="horizontal" class="has-[>[data-slot=field-content]]:items-center">
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

<p class="font-sans text-xs font-semibold tracking-widest text-highlight-foreground uppercase">
	Your recommendation
</p>
<h1 class="mt-2 font-display text-3xl font-medium sm:text-4xl">{COPY.choiceHeadline}</h1>
<p class="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">{COPY.choiceBody}</p>

{#if loading}
	<p role="status" class="mt-8 text-sm text-muted-foreground">{COPY.loading}</p>
{:else if plans.length > 0}
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
	<Alert.Root class="mt-6">
		<CircleCheckIcon aria-hidden="true" />
		<Alert.Title>{COPY.noPlans.title}</Alert.Title>
		<Alert.Description>{COPY.noPlans.body}</Alert.Description>
	</Alert.Root>
{/if}

<Button
	type="button"
	class="relative mt-6 w-full"
	disabled={!hydrated || loading || (!selected && !nothingOffered && !unreachable)}
	onclick={confirm}
>
	{COPY.choiceAction}
	<ArrowRightIcon aria-hidden="true" class="absolute right-8" />
</Button>
