<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import * as Select from '$lib/components/ui/select';
	import { Separator } from '$lib/components/ui/separator';
	import ShowcaseSection from './ShowcaseSection.svelte';

	const FIELD_LABEL = 'text-xs font-semibold uppercase tracking-widest';
	const COUNTRIES = [
		{ value: 'de', label: 'Germany' },
		{ value: 'at', label: 'Austria' },
		{ value: 'nl', label: 'Netherlands' }
	];

	let goal = $state('lose-weight');
	let country = $state('de');
	let weight = $state('');
	let consent = $state(false);
	let submitted = $state(false);

	let countryLabel = $derived(
		COUNTRIES.find((option) => option.value === country)?.label ?? 'Choose a country'
	);
	let weightInvalid = $derived(submitted && weight.trim() === '');
	let consentInvalid = $derived(submitted && !consent);

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitted = true;
	}
</script>

<ShowcaseSection
	id="example-form"
	title="Example form composition"
	description="The shape features 7, 8 and 9 copy: a legend for the group, uppercase Labels, a description wired with aria-describedby, an error message wired with aria-invalid, and the primary and back Buttons paired at the end. Built only from adapted primitives, with no bespoke styling."
>
	<form class="max-w-2xl space-y-8" onsubmit={handleSubmit} novalidate>
		<fieldset>
			<legend class="font-display text-xl font-semibold">What is your main goal?</legend>
			<p id="goal-description" class="mt-2 text-sm text-muted-foreground">
				Your clinician confirms what is safe and suitable.
			</p>
			<RadioGroup.Root bind:value={goal} aria-describedby="goal-description" class="mt-4">
				<Label
					for="goal-lose-weight"
					class="flex cursor-pointer items-center gap-4 rounded-md border border-border bg-card p-4 leading-snug has-data-checked:border-primary has-data-checked:bg-surface-subtle"
				>
					<RadioGroup.Item id="goal-lose-weight" value="lose-weight" />
					<span>Lose weight steadily</span>
				</Label>
				<Label
					for="goal-maintain"
					class="flex cursor-pointer items-center gap-4 rounded-md border border-border bg-card p-4 leading-snug has-data-checked:border-primary has-data-checked:bg-surface-subtle"
				>
					<RadioGroup.Item id="goal-maintain" value="maintain" />
					<span>Maintain my current weight</span>
				</Label>
			</RadioGroup.Root>
		</fieldset>

		<div class="space-y-2">
			<Label for="form-weight" class={FIELD_LABEL}>Current weight</Label>
			<Input
				id="form-weight"
				bind:value={weight}
				inputmode="numeric"
				placeholder="85"
				aria-invalid={weightInvalid}
				aria-describedby={weightInvalid ? 'form-weight-error' : 'form-weight-description'}
			/>
			{#if weightInvalid}
				<p id="form-weight-error" class="text-sm text-destructive-text">
					Enter your current weight in kilograms.
				</p>
			{:else}
				<p id="form-weight-description" class="text-sm text-muted-foreground">
					In kilograms. Used only to model your projection.
				</p>
			{/if}
		</div>

		<div class="space-y-2">
			<Label for="form-country" class={FIELD_LABEL}>Delivery country</Label>
			<Select.Root type="single" bind:value={country}>
				<Select.Trigger id="form-country" aria-label="Delivery country">
					{countryLabel}
				</Select.Trigger>
				<Select.Content>
					{#each COUNTRIES as option (option.value)}
						<Select.Item value={option.value} label={option.label} />
					{/each}
				</Select.Content>
			</Select.Root>
		</div>

		<div class="flex items-start gap-3">
			<Checkbox
				id="form-consent"
				bind:checked={consent}
				aria-invalid={consentInvalid}
				aria-describedby={consentInvalid ? 'form-consent-error' : undefined}
			/>
			<div>
				<Label for="form-consent" class="leading-snug">
					I consent to a doctor reviewing my answers.
				</Label>
				{#if consentInvalid}
					<p id="form-consent-error" class="mt-1 text-sm text-destructive-text">
						Consent is required before a clinician can review your answers.
					</p>
				{/if}
			</div>
		</div>

		<Separator />

		<div class="flex flex-col gap-3 sm:flex-row-reverse sm:justify-start">
			<Button type="submit" size="lg">Continue</Button>
			<Button type="button" variant="secondary" size="lg">Back</Button>
		</div>
	</form>
</ShowcaseSection>
