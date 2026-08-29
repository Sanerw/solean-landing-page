<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Field, FieldDescription, FieldError, FieldLabel } from '$lib/components/ui/field';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';
	import ShowcaseSection from './ShowcaseSection.svelte';

	const LANGUAGES = [
		{ value: 'en', label: 'English' },
		{ value: 'de', label: 'Deutsch' },
		{ value: 'pl', label: 'Polski' }
	];

	let language = $state('en');
	let invalidLanguage = $state('');
	let selectedLanguage = $derived(
		LANGUAGES.find((option) => option.value === language)?.label ?? 'Choose a language'
	);
	let invalidLanguageLabel = $derived(
		LANGUAGES.find((option) => option.value === invalidLanguage)?.label ?? 'Choose a language'
	);
</script>

<ShowcaseSection
	id="textarea-select"
	title="Textarea and Select"
	description="Both controls inherit Input's font, white surface, --input boundary, rounded-md corners, focus ring, invalid treatment and disabled treatment. Textarea has no artboard, and no open Select appears in the references, so those details follow the shared field contract and popover tokens."
>
	<div class="grid gap-8 lg:grid-cols-3">
		<Field>
			<FieldLabel for="control-input">Input baseline</FieldLabel>
			<Input id="control-input" value="Shared field rhythm" />
			<FieldDescription>The 56px control baseline.</FieldDescription>
		</Field>

		<Field>
			<FieldLabel for="control-textarea">Textarea</FieldLabel>
			<Textarea id="control-textarea" placeholder="Tell us anything your clinician should know" />
			<FieldDescription>Same inset spacing with a stock min-h-32.</FieldDescription>
		</Field>

		<Field>
			<FieldLabel for="control-select">Language</FieldLabel>
			<Select.Root type="single" bind:value={language}>
				<Select.Trigger id="control-select" aria-label="Language">
					{selectedLanguage}
				</Select.Trigger>
				<Select.Content>
					{#each LANGUAGES as option (option.value)}
						<Select.Item value={option.value} label={option.label} />
					{/each}
				</Select.Content>
			</Select.Root>
			<FieldDescription>Open with click, Enter or Space.</FieldDescription>
		</Field>
	</div>

	<h3 class="mt-12 font-display text-xl font-semibold">Invalid and disabled</h3>
	<div class="mt-6 grid gap-8 md:grid-cols-2">
		<Field data-invalid="true">
			<FieldLabel for="textarea-invalid">Medical context</FieldLabel>
			<Textarea
				id="textarea-invalid"
				value="Too short"
				aria-invalid="true"
				aria-describedby="textarea-invalid-description textarea-invalid-error"
			/>
			<FieldDescription id="textarea-invalid-description">
				Include the detail a clinician needs to understand your answer.
			</FieldDescription>
			<FieldError id="textarea-invalid-error">Add at least one complete sentence.</FieldError>
		</Field>

		<Field data-invalid="true">
			<FieldLabel for="select-invalid">Preferred language</FieldLabel>
			<Select.Root type="single" bind:value={invalidLanguage}>
				<Select.Trigger
					id="select-invalid"
					aria-label="Preferred language"
					aria-invalid="true"
					aria-describedby="select-invalid-description select-invalid-error"
				>
					{invalidLanguageLabel}
				</Select.Trigger>
				<Select.Content>
					{#each LANGUAGES as option (option.value)}
						<Select.Item value={option.value} label={option.label} />
					{/each}
				</Select.Content>
			</Select.Root>
			<FieldDescription id="select-invalid-description">
				This controls the language used for order and clinician messages.
			</FieldDescription>
			<FieldError id="select-invalid-error">Choose a preferred language.</FieldError>
		</Field>

		<Field>
			<FieldLabel for="textarea-disabled">Disabled textarea</FieldLabel>
			<Textarea id="textarea-disabled" value="Unavailable" disabled />
		</Field>

		<Field>
			<FieldLabel for="select-disabled">Disabled select</FieldLabel>
			<Select.Root type="single" value="en" disabled>
				<Select.Trigger id="select-disabled" aria-label="Disabled select">English</Select.Trigger>
			</Select.Root>
		</Field>
	</div>
</ShowcaseSection>
