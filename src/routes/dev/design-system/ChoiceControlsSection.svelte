<script lang="ts">
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
	import { Label } from '$lib/components/ui/label';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import ShowcaseSection from './ShowcaseSection.svelte';

	let consent = $state(true);
	let treatment = $state('mounjaro');
	let invalidTreatment = $state('');
</script>

<ShowcaseSection
	id="choice-controls"
	title="Checkbox and RadioGroup"
	description="Checked controls use the primary gold fill with a dark indicator, matching the questionnaire and checkout references. Indeterminate, focus-visible, invalid and disabled states are accessibility decisions because the artboards do not capture them."
>
	<h3 class="font-display text-xl font-semibold">Checkbox states</h3>
	<div class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
		<div class="flex items-start gap-3">
			<Checkbox id="checkbox-unchecked" />
			<Label for="checkbox-unchecked" class="leading-snug">Unchecked</Label>
		</div>

		<div class="flex items-start gap-3">
			<Checkbox id="checkbox-checked" bind:checked={consent} />
			<Label for="checkbox-checked" class="leading-snug">
				I agree to the Terms and consent to a doctor reviewing my answers.
			</Label>
		</div>

		<div class="flex items-start gap-3">
			<Checkbox id="checkbox-indeterminate" indeterminate />
			<Label for="checkbox-indeterminate" class="leading-snug">Indeterminate</Label>
		</div>

		<div class="flex items-start gap-3">
			<Checkbox id="checkbox-disabled" checked disabled />
			<Label for="checkbox-disabled" class="leading-snug opacity-50">Disabled</Label>
		</div>

		<div class="flex items-start gap-3">
			<Checkbox
				id="checkbox-invalid"
				aria-invalid="true"
				aria-describedby="checkbox-invalid-error"
			/>
			<div>
				<Label for="checkbox-invalid" class="leading-snug">Invalid</Label>
				<FieldError id="checkbox-invalid-error" class="mt-1">Confirm before continuing.</FieldError>
			</div>
		</div>
	</div>

	<div class="mt-12">
		<FieldSet>
			<FieldLegend>Which treatment would you prefer?</FieldLegend>
			<FieldDescription id="treatment-description">
				Choose one option. Your clinician confirms what is safe and suitable.
			</FieldDescription>

			<RadioGroup.Root
				bind:value={treatment}
				aria-describedby="treatment-description"
				class="mt-6"
			>
				<FieldLabel for="treatment-mounjaro">
					<Field orientation="horizontal">
						<RadioGroup.Item id="treatment-mounjaro" value="mounjaro" />
						<FieldContent>
							<FieldTitle class="font-display text-lg font-semibold">Mounjaro</FieldTitle>
							<FieldDescription>Injection, lose up to 23% body weight</FieldDescription>
						</FieldContent>
					</Field>
				</FieldLabel>

				<FieldLabel for="treatment-wegovy">
					<Field orientation="horizontal">
						<RadioGroup.Item id="treatment-wegovy" value="wegovy" />
						<FieldContent>
							<FieldTitle class="font-display text-lg font-semibold">Wegovy</FieldTitle>
							<FieldDescription>Injection, lose up to 21% body weight</FieldDescription>
						</FieldContent>
					</Field>
				</FieldLabel>

				<FieldLabel for="treatment-pill">
					<Field orientation="horizontal">
						<RadioGroup.Item id="treatment-pill" value="pill" />
						<FieldContent>
							<FieldTitle class="font-display text-lg font-semibold">Wegovy Pill</FieldTitle>
							<FieldDescription>Tablet, lose up to 17% body weight</FieldDescription>
						</FieldContent>
					</Field>
				</FieldLabel>

				<Label
					for="treatment-disabled"
					class="flex cursor-not-allowed items-center gap-4 rounded-md border border-border bg-muted p-4 leading-snug opacity-50"
				>
					<RadioGroup.Item id="treatment-disabled" value="unavailable" disabled />
					<span>Unavailable treatment</span>
				</Label>
			</RadioGroup.Root>
		</FieldSet>
	</div>

	<div class="mt-12">
		<FieldSet>
			<FieldLegend>Invalid RadioGroup</FieldLegend>
			<RadioGroup.Root
				bind:value={invalidTreatment}
				aria-invalid="true"
				aria-describedby="radio-invalid-error"
				class="mt-6"
			>
				<div class="flex items-center gap-3">
					<RadioGroup.Item id="radio-invalid-one" value="one" aria-invalid="true" />
					<Label for="radio-invalid-one">First option</Label>
				</div>
				<div class="flex items-center gap-3">
					<RadioGroup.Item id="radio-invalid-two" value="two" aria-invalid="true" />
					<Label for="radio-invalid-two">Second option</Label>
				</div>
			</RadioGroup.Root>
			<FieldError id="radio-invalid-error" class="mt-2">
				Choose one option before continuing.
			</FieldError>
		</FieldSet>
	</div>
</ShowcaseSection>
