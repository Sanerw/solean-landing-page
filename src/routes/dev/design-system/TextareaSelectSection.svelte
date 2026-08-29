<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';
	import ShowcaseSection from './ShowcaseSection.svelte';

	const FIELD_LABEL = 'text-xs font-semibold uppercase tracking-widest';
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
		<div class="space-y-2">
			<Label for="control-input" class={FIELD_LABEL}>Input baseline</Label>
			<Input id="control-input" value="Shared field rhythm" />
			<p class="text-sm text-muted-foreground">The 56px control baseline.</p>
		</div>

		<div class="space-y-2">
			<Label for="control-textarea" class={FIELD_LABEL}>Textarea</Label>
			<Textarea id="control-textarea" placeholder="Tell us anything your clinician should know" />
			<p class="text-sm text-muted-foreground">Same inset spacing with a stock min-h-32.</p>
		</div>

		<div class="space-y-2">
			<Label for="control-select" class={FIELD_LABEL}>Language</Label>
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
			<p class="text-sm text-muted-foreground">Open with click, Enter or Space.</p>
		</div>
	</div>

	<h3 class="mt-12 font-display text-xl font-semibold">Invalid and disabled</h3>
	<div class="mt-6 grid gap-8 md:grid-cols-2">
		<div class="space-y-2">
			<Label for="textarea-invalid" class={FIELD_LABEL}>Medical context</Label>
			<Textarea
				id="textarea-invalid"
				value="Too short"
				aria-invalid="true"
				aria-describedby="textarea-invalid-description textarea-invalid-error"
			/>
			<p id="textarea-invalid-description" class="text-sm text-muted-foreground">
				Include the detail a clinician needs to understand your answer.
			</p>
			<p id="textarea-invalid-error" class="text-sm font-medium text-destructive-text">
				Add at least one complete sentence.
			</p>
		</div>

		<div class="space-y-2">
			<Label for="select-invalid" class={FIELD_LABEL}>Preferred language</Label>
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
			<p id="select-invalid-description" class="text-sm text-muted-foreground">
				This controls the language used for order and clinician messages.
			</p>
			<p id="select-invalid-error" class="text-sm font-medium text-destructive-text">
				Choose a preferred language.
			</p>
		</div>

		<div class="space-y-2">
			<Label for="textarea-disabled" class={FIELD_LABEL}>Disabled textarea</Label>
			<Textarea id="textarea-disabled" value="Unavailable" disabled />
		</div>

		<div class="space-y-2">
			<Label for="select-disabled" class={FIELD_LABEL}>Disabled select</Label>
			<Select.Root type="single" value="en" disabled>
				<Select.Trigger id="select-disabled" aria-label="Disabled select">English</Select.Trigger>
			</Select.Root>
		</div>
	</div>
</ShowcaseSection>
