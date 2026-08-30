<script lang="ts">
	import { onMount, tick } from 'svelte';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from '$lib/components/ui/field';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import BellRingIcon from '@lucide/svelte/icons/bell-ring';
	import { emptyFieldValue, fieldValueFromAnswer, stepValuesToAnswers, validateStepValues } from './schema';
	import { questionnaireService } from './questionnaire-service';
	import ContactField from './ContactField.svelte';
	import MultiSelectField from './MultiSelectField.svelte';
	import NumericField from './NumericField.svelte';
	import SingleSelectField from './SingleSelectField.svelte';
	import type {
		ContactField as ContactFieldType,
		FieldValue,
		QuestionField,
		QuestionnaireProgress,
		QuestionStep,
		StepAnswers,
		StepValues
	} from './types';

	interface Props {
		step: QuestionStep;
		progress: QuestionnaireProgress | null;
		/** Called only once every field validates, so saving stays the page's job. */
		onvalid: (answers: StepAnswers) => void;
	}

	let { step, progress, onvalid }: Props = $props();

	// Starts empty rather than seeded from `step`: the schema's empty value is the fallback
	// everywhere, so a field the user has not touched needs no entry here.
	let values = $state<StepValues>({});
	let errors = $state<Record<string, string>>({});
	let form = $state<HTMLFormElement | null>(null);

	const helpId = $derived(`${step.id}-help`);

	function valueOf(field: QuestionField): FieldValue {
		return values[field.id] ?? emptyFieldValue(field);
	}

	/** DOM ids are dot-free, so a control key doubles as a stable element id suffix. */
	function domId(controlKey: string): string {
		return `${step.id}-${controlKey.replace('.', '-')}`;
	}

	function errorId(controlKey: string): string {
		return `${domId(controlKey)}-error`;
	}

	/**
	 * A choice between several controls needs a fieldset and legend; a single control needs
	 * a plain label pointing at it. Wrapping one input in a fieldset would announce a group
	 * that does not exist.
	 */
	function isGroup(field: QuestionField): boolean {
		return field.kind !== 'numeric';
	}

	// Applied to a span inside the legend, not the legend itself: FieldLegend's own
	// data-[variant] rules outrank a plain utility class, and a child element sidesteps
	// that without reaching into the primitive.
	function labelClass(field: QuestionField): string {
		return field.labelStyle === 'question'
			? 'font-sans text-base font-semibold text-foreground'
			: 'font-sans text-xs font-semibold uppercase tracking-widest text-foreground';
	}

	function fieldHelpId(fieldId: string): string {
		return `${domId(fieldId)}-help`;
	}

	/** The step's help, then the field's own, then its error: everything the group means. */
	function describedBy(field: QuestionField, controlKey: string): string | undefined {
		return (
			[
				step.help ? helpId : null,
				field.help ? fieldHelpId(field.id) : null,
				errors[controlKey] ? errorId(controlKey) : null
			]
				.filter(Boolean)
				.join(' ') || undefined
		);
	}

	// Saved answers live in browser storage, which the server render cannot see. Restoring
	// after mount rather than during it keeps the hydrated markup honest.
	onMount(() => {
		const saved = questionnaireService.getStepAnswers(step.id);
		if (!saved) return;

		values = Object.fromEntries(
			step.fields.map((field) => [field.id, fieldValueFromAnswer(field, saved[field.id])])
		);
	});

	function setValue(fieldId: string, value: FieldValue): void {
		values = { ...values, [fieldId]: value };
		clearError(fieldId);
	}

	/** Clears one control's stale error; every other control keeps its own until fixed. */
	function clearError(controlKey: string): void {
		if (!errors[controlKey]) return;

		const { [controlKey]: _cleared, ...rest } = errors;
		errors = rest;
	}

	function setContactValue(field: ContactFieldType, inputId: string, next: string): void {
		const current = valueOf(field);
		const record = (typeof current === 'object' && !Array.isArray(current) ? current : {}) as Record<
			string,
			string
		>;

		values = { ...values, [field.id]: { ...record, [inputId]: next } };
		clearError(`${field.id}.${inputId}`);
	}

	async function focusControl(controlKey: string): Promise<void> {
		await tick();
		form
			?.querySelector(`[data-control-id="${controlKey}"]`)
			?.querySelector<HTMLElement>('input, select, textarea, [role="radio"], [role="checkbox"]')
			?.focus();
	}

	function submit(event: SubmitEvent): void {
		event.preventDefault();

		const result = validateStepValues(step, values);
		if (!result.valid) {
			errors = Object.fromEntries(
				Object.entries(result.byControlId).flatMap(([key, value]) =>
					value.valid ? [] : [[key, value.message] as const]
				)
			);

			const firstFailing = Object.keys(result.byControlId).find((key) => errors[key]);
			if (firstFailing) void focusControl(firstFailing);
			return;
		}

		errors = {};
		onvalid(stepValuesToAnswers(step, values));
	}
</script>

<form bind:this={form} novalidate onsubmit={submit}>
	{#if progress}
		<p class="font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground">
			Question {progress.current} of {progress.total}
		</p>
	{/if}

	<h1 class="mt-3 font-display text-4xl font-medium sm:text-5xl">{step.title}</h1>

	{#if step.help}
		<p id={helpId} class="mt-3 text-base text-muted-foreground md:text-lg">{step.help}</p>
	{/if}

	<div class="mt-10 grid gap-8 sm:grid-cols-2">
		{#each step.fields as field (field.id)}
			{@const invalid = Boolean(errors[field.id])}
			{@const described = describedBy(field, field.id)}
			{@const span = field.width === 'half' ? '' : 'sm:col-span-2'}

			{#snippet label()}
				<!--
					The label variant, not the default legend one: a legend styled as a display
					heading would compete with the h1 above it. The reference sets this as a small
					uppercase field label, matching FieldLabel's eyebrow treatment.
				-->
				{field.label}
			{/snippet}

			{#snippet control()}
				{#if field.kind === 'single-select'}
					<div data-control-id={field.id}>
						<SingleSelectField
							{field}
							stepId={step.id}
							value={typeof valueOf(field) === 'string' ? (valueOf(field) as string) : ''}
							{invalid}
							describedBy={described}
							onchange={(optionId) => setValue(field.id, optionId)}
						/>
					</div>
				{:else if field.kind === 'multi-select'}
					<div data-control-id={field.id} class="contents">
						<MultiSelectField
							{field}
							stepId={step.id}
							value={Array.isArray(valueOf(field)) ? (valueOf(field) as string[]) : []}
							{invalid}
							describedBy={described}
							onchange={(optionIds) => setValue(field.id, optionIds)}
						/>
					</div>
				{:else if field.kind === 'numeric'}
					<div data-control-id={field.id}>
						<NumericField
							{field}
							controlId={domId(field.id)}
							value={typeof valueOf(field) === 'string' ? (valueOf(field) as string) : ''}
							{invalid}
							describedBy={described}
							onchange={(next) => setValue(field.id, next)}
						/>
					</div>
				{:else if field.kind === 'contact'}
					<ContactField
						{field}
						values={valueOf(field)}
						{errors}
						{domId}
						{errorId}
						onchange={(inputId, next) => setContactValue(field, inputId, next)}
					/>
				{/if}

				{#if field.kind !== 'contact' && errors[field.id]}
					<FieldError id={errorId(field.id)}>{errors[field.id]}</FieldError>
				{/if}
			{/snippet}

			{#if isGroup(field)}
				<FieldSet class={span}>
					<FieldLegend variant="label" class={['mb-0', field.labelHidden && 'sr-only']}>
						<span class={labelClass(field)}>{@render label()}</span>
					</FieldLegend>
					{#if field.help}
						<p id={fieldHelpId(field.id)} class="text-sm text-muted-foreground">{field.help}</p>
					{/if}
					{@render control()}
				</FieldSet>
			{:else}
				<Field class={span}>
					<FieldLabel for={domId(field.id)}>{@render label()}</FieldLabel>
					{#if field.help}
						<p id={fieldHelpId(field.id)} class="text-sm text-muted-foreground">{field.help}</p>
					{/if}
					{@render control()}
				</Field>
			{/if}
		{/each}
	</div>

	{#if step.notice}
		<Alert.Root variant={step.notice.variant} class="mt-8">
			<BellRingIcon aria-hidden="true" />
			<Alert.Description>{step.notice.text}</Alert.Description>
		</Alert.Root>
	{/if}

	<Button type="submit" size="lg" class="relative mt-10 w-full">
		Continue
		<ArrowRightIcon aria-hidden="true" class="absolute right-8" />
	</Button>
</form>
