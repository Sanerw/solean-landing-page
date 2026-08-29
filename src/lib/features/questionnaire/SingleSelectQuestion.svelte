<script lang="ts">
	import { onMount } from 'svelte';
	import type { Answer } from '$lib/domain';
	import { Button } from '$lib/components/ui/button';
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
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import { questionnaireService } from './questionnaire-service';
	import type { QuestionnaireProgress, SingleSelectStep } from './types';

	interface Props {
		step: SingleSelectStep;
		progress: QuestionnaireProgress | null;
		/** Called only once the service has accepted the answer, so saving stays the page's job. */
		onvalid: (answer: Answer) => void;
	}

	let { step, progress, onvalid }: Props = $props();

	let selectedOptionId = $state('');
	let errorMessage = $state<string | null>(null);
	let group = $state<HTMLDivElement | null>(null);

	const helpId = $derived(`${step.id}-help`);
	const errorId = $derived(`${step.id}-error`);
	const describedBy = $derived(
		[step.help ? helpId : null, errorMessage ? errorId : null].filter(Boolean).join(' ') || undefined
	);

	// A saved answer lives in browser storage, which the server render cannot see. Restoring
	// after mount rather than during render keeps the hydrated markup honest.
	onMount(() => {
		const answer = questionnaireService.getAnswer(step.id);
		if (answer?.kind === 'single-select') selectedOptionId = answer.optionId;
	});

	function selectOption(optionId: string): void {
		selectedOptionId = optionId;
		errorMessage = null;
	}

	function submit(event: SubmitEvent): void {
		event.preventDefault();

		const answer: Answer | undefined = selectedOptionId
			? { kind: 'single-select', optionId: selectedOptionId }
			: undefined;
		const result = questionnaireService.validate(step, answer);

		if (!result.valid || answer === undefined) {
			errorMessage = result.valid ? null : result.message;
			group?.querySelector<HTMLElement>('[data-slot="radio-group-item"]')?.focus();
			return;
		}

		errorMessage = null;
		onvalid(answer);
	}
</script>

<form novalidate onsubmit={submit}>
	{#if progress}
		<p class="font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground">
			Question {progress.current} of {progress.total}
		</p>
	{/if}

	<h1 class="mt-3 font-display text-4xl font-medium sm:text-5xl">{step.title}</h1>

	{#if step.help}
		<p id={helpId} class="mt-3 text-base text-muted-foreground md:text-lg">{step.help}</p>
	{/if}

	<FieldSet class="mt-10">
		<!--
			The label variant, not the default legend one: a legend styled as a display heading
			would compete with the h1 above it. The reference sets this as a small uppercase
			field label, matching FieldLabel's eyebrow treatment.
		-->
		<FieldLegend
			variant="label"
			class="mb-0 font-sans uppercase tracking-widest text-foreground"
		>
			{step.label}
		</FieldLegend>

		<RadioGroup.Root
			bind:ref={group}
			bind:value={() => selectedOptionId, (value) => selectOption(value)}
			aria-invalid={errorMessage ? 'true' : undefined}
			aria-describedby={describedBy}
			class="grid gap-3 sm:grid-cols-2"
		>
			{#each step.options as option (option.id)}
				<FieldLabel for="{step.id}-{option.id}">
					<Field orientation="horizontal">
						<RadioGroup.Item
							id="{step.id}-{option.id}"
							value={option.id}
							aria-invalid={errorMessage ? 'true' : undefined}
						/>
						<FieldContent>
							<!-- FieldLabel carries the uppercase eyebrow treatment for bare field labels; an
							     option card is a sentence-case choice, as the reference shows it. -->
							<FieldTitle class="font-display text-base font-semibold normal-case tracking-normal">
								{option.label}
							</FieldTitle>
							{#if option.description}
								<FieldDescription class="normal-case tracking-normal">
									{option.description}
								</FieldDescription>
							{/if}
						</FieldContent>
					</Field>
				</FieldLabel>
			{/each}
		</RadioGroup.Root>

		{#if errorMessage}
			<FieldError id={errorId}>{errorMessage}</FieldError>
		{/if}
	</FieldSet>

	<Button type="submit" size="lg" class="relative mt-10 w-full">
		Continue
		<ArrowRightIcon aria-hidden="true" class="absolute right-8" />
	</Button>
</form>
