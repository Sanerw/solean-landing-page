<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';
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
				<p id="checkbox-invalid-error" class="mt-1 text-sm text-destructive-text">
					Confirm before continuing.
				</p>
			</div>
		</div>
	</div>

	<div class="mt-12">
		<fieldset>
			<legend class="font-display text-xl font-semibold">Which treatment would you prefer?</legend>
			<p id="treatment-description" class="mt-2 text-sm text-muted-foreground">
				Choose one option. Your clinician confirms what is safe and suitable.
			</p>

			<RadioGroup.Root
				bind:value={treatment}
				aria-describedby="treatment-description"
				class="mt-6"
			>
				<Label
					for="treatment-mounjaro"
					class="flex cursor-pointer items-center gap-4 rounded-md border border-border bg-card p-4 leading-snug has-data-checked:border-primary has-data-checked:bg-surface-subtle"
				>
					<RadioGroup.Item id="treatment-mounjaro" value="mounjaro" />
					<span>
						<span class="block font-display text-lg font-semibold">Mounjaro</span>
						<span class="mt-1 block text-sm font-normal text-muted-foreground">
							Injection, lose up to 23% body weight
						</span>
					</span>
				</Label>

				<Label
					for="treatment-wegovy"
					class="flex cursor-pointer items-center gap-4 rounded-md border border-border bg-card p-4 leading-snug has-data-checked:border-primary has-data-checked:bg-surface-subtle"
				>
					<RadioGroup.Item id="treatment-wegovy" value="wegovy" />
					<span>
						<span class="block font-display text-lg font-semibold">Wegovy</span>
						<span class="mt-1 block text-sm font-normal text-muted-foreground">
							Injection, lose up to 21% body weight
						</span>
					</span>
				</Label>

				<Label
					for="treatment-pill"
					class="flex cursor-pointer items-center gap-4 rounded-md border border-border bg-card p-4 leading-snug has-data-checked:border-primary has-data-checked:bg-surface-subtle"
				>
					<RadioGroup.Item id="treatment-pill" value="pill" />
					<span>
						<span class="block font-display text-lg font-semibold">Wegovy Pill</span>
						<span class="mt-1 block text-sm font-normal text-muted-foreground">
							Tablet, lose up to 17% body weight
						</span>
					</span>
				</Label>

				<Label
					for="treatment-disabled"
					class="flex cursor-not-allowed items-center gap-4 rounded-md border border-border bg-muted p-4 leading-snug opacity-50"
				>
					<RadioGroup.Item id="treatment-disabled" value="unavailable" disabled />
					<span>Unavailable treatment</span>
				</Label>
			</RadioGroup.Root>
		</fieldset>
	</div>

	<div class="mt-12">
		<fieldset>
			<legend class="font-display text-xl font-semibold">Invalid RadioGroup</legend>
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
			<p id="radio-invalid-error" class="mt-2 text-sm text-destructive-text">
				Choose one option before continuing.
			</p>
		</fieldset>
	</div>
</ShowcaseSection>
