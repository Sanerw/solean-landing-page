<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import {
		Field,
		FieldContent,
		FieldDescription,
		FieldError,
		FieldLabel,
		FieldLegend,
		FieldSet,
		FieldTitle
	} from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import * as Select from '$lib/components/ui/select';
	import { Separator } from '$lib/components/ui/separator';
	import ShowcaseSection from './ShowcaseSection.svelte';

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
	description="The shape features 7, 8 and 9 copy: a FieldSet for the group, FieldLabel option cards, a description wired with aria-describedby, an error wired with aria-invalid, and the primary and back Buttons paired at the end. Built only from adapted primitives, with no bespoke styling."
>
	<form class="max-w-2xl space-y-8" onsubmit={handleSubmit} novalidate>
		<FieldSet>
			<FieldLegend>What is your main goal?</FieldLegend>
			<FieldDescription id="goal-description">
				Your clinician confirms what is safe and suitable.
			</FieldDescription>
			<RadioGroup.Root bind:value={goal} aria-describedby="goal-description" class="mt-4">
				<FieldLabel for="goal-lose-weight">
					<Field orientation="horizontal">
						<RadioGroup.Item id="goal-lose-weight" value="lose-weight" />
						<FieldContent>
							<FieldTitle>Lose weight steadily</FieldTitle>
						</FieldContent>
					</Field>
				</FieldLabel>
				<FieldLabel for="goal-maintain">
					<Field orientation="horizontal">
						<RadioGroup.Item id="goal-maintain" value="maintain" />
						<FieldContent>
							<FieldTitle>Maintain my current weight</FieldTitle>
						</FieldContent>
					</Field>
				</FieldLabel>
			</RadioGroup.Root>
		</FieldSet>

		<Field data-invalid={weightInvalid}>
			<FieldLabel for="form-weight">Current weight</FieldLabel>
			<Input
				id="form-weight"
				bind:value={weight}
				inputmode="numeric"
				placeholder="85"
				aria-invalid={weightInvalid}
				aria-describedby={weightInvalid ? 'form-weight-error' : 'form-weight-description'}
			/>
			{#if weightInvalid}
				<FieldError id="form-weight-error">Enter your current weight in kilograms.</FieldError>
			{:else}
				<FieldDescription id="form-weight-description">
					In kilograms. Used only to model your projection.
				</FieldDescription>
			{/if}
		</Field>

		<Field>
			<FieldLabel for="form-country">Delivery country</FieldLabel>
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
		</Field>

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
					<FieldError id="form-consent-error" class="mt-1">
						Consent is required before a clinician can review your answers.
					</FieldError>
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
