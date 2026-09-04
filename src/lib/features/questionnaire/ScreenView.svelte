<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { Button } from '$lib/components/ui/button';
	import {
		Field,
		FieldDescription,
		FieldError,
		FieldLabel,
		FieldLegend,
		FieldSet
	} from '$lib/components/ui/field';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import type { Answers, QuestionId } from './answers/types';
	import { screenErrorFor, type ScreenError } from './answers/screen-errors';
	import { validateScreen, type ValidationCode } from './answers/validate';
	import { optionsFor } from './definition/kinds';
	import { rendererFor } from './definition/renderer-registry';
	import { visibleQuestions, type ScreenDef } from './definition/screens';
	import UnsupportedKind from './fields2/UnsupportedKind.svelte';

	interface Props {
		screen: ScreenDef;
		answers: Answers;
		onchange: (id: QuestionId, value: unknown) => void;
		/** Called once our validation passes. May submit, so may be async. */
		onvalid: () => void | Promise<void>;
		/**
		 * RxScale's refusals, from the shadow. Supplied by the caller rather than computed here,
		 * because `theirErrors` re-parses the 37 KB snapshot per call: running it from a derived
		 * would re-parse it on every keystroke. The caller runs it on submit, which is also the
		 * only moment it means anything, since their rules judge complete answers.
		 */
		theirErrors?: Partial<Record<QuestionId, string>>;
		busy?: boolean;
	}

	let { screen, answers, onchange, onvalid, theirErrors = {}, busy = false }: Props = $props();

	/** Errors appear on submit, not while someone is still typing their first answer. */
	let submitted = $state(false);
	let ourErrors = $state<Partial<Record<QuestionId, ValidationCode>>>({});

	const questions = $derived(visibleQuestions(screen, answers));

	/**
	 * Nothing here works without JavaScript: validation, branching and navigation are all
	 * client-side. Before hydration a press would submit the form natively and lose the answer,
	 * so the action stays disabled until it can do its job.
	 */
	let hydrated = $state(false);
	$effect(() => {
		hydrated = true;
	});

	const CODE_MESSAGES: Record<ValidationCode, () => string> = {
		required: m.qv_required,
		'out-of-range': m.qv_out_of_range,
		'invalid-email': m.qv_invalid_email,
		'invalid-date': m.qv_invalid_date,
		'none-with-others': m.qv_none_with_others,
		'other-text-missing': m.qv_other_text_missing
	};

	/** Ours is a code we word; theirs is a German sentence we pass through untouched. */
	function textFor(error: ScreenError): string {
		return error.source === 'ours' ? CODE_MESSAGES[error.code]() : error.text;
	}

	function errorFor(id: QuestionId): ScreenError | null {
		if (!submitted) return null;

		return screenErrorFor(id, ourErrors, theirErrors);
	}

	function submit(event: SubmitEvent): void {
		event.preventDefault();
		if (busy) return;

		submitted = true;
		ourErrors = validateScreen(screen.id, answers);

		// The caller owns what happens next, including asking RxScale.
		if (Object.keys(ourErrors).length === 0) void onvalid();
	}

	/** The screen's headline is its first question, which is what the screen is for. */
	const heading = $derived(questions[0] ?? null);
</script>

{#if heading}
	<h1 class="font-display text-2xl font-medium sm:text-3xl">{heading.label()}</h1>
{/if}

<form novalidate onsubmit={submit} class="mt-6">
	{#each questions as question (question.id)}
		{@const options = optionsFor(question, answers)}
		{@const lookup = rendererFor(question, options)}
		{@const id = `q-${question.id}`}
		{@const error = errorFor(question.id)}
		{@const otherField = question.otherField}
		{@const descriptionId = question.description ? `${id}-description` : null}
		{@const describedBy =
			[descriptionId, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined}

		<div class="mb-5">
			{#if lookup.entry === null}
				<UnsupportedKind questionId={question.id} reason={lookup.reason} />
			{:else}
				{@const Renderer = lookup.entry.renderer}
				{@const isGroup = lookup.entry.presentation === 'group'}
				{@const label = question === heading ? '' : question.label()}

				{#if isGroup}
						<FieldSet class="gap-3">
							<!-- The heading already says this; keep it for assistive technology only. -->
							<FieldLegend class={label ? 'mb-2 text-lg' : 'sr-only'}>
								{label || question.label()}
							</FieldLegend>
							{#if question.description}
								<FieldDescription id={descriptionId ?? undefined} class="leading-snug whitespace-pre-line">
									{question.description()}
								</FieldDescription>
							{/if}
							<Renderer
								{question}
								{options}
								controlId={id}
								value={answers[question.id]}
								onchange={(next) => onchange(question.id, next)}
								other={otherField ? String(answers[otherField] ?? '') : ''}
								onother={(next) => otherField && onchange(otherField, next)}
								invalid={error !== null}
								{describedBy}
							/>
							{#if error}
								<FieldError id="{id}-error">{textFor(error)}</FieldError>
							{/if}
						</FieldSet>
					{:else}
						<Field class="gap-2">
							<!--
								`w-px!` beside `sr-only`. Field sets `[&>.sr-only]:w-auto` so an sr-only child
								is not stretched by its `[&>*]:w-full`, and that also undoes sr-only's own
								`width: 1px`: the hidden label becomes as wide as the sentence it repeats,
								positioned past the viewport, still counted in the page's scroll width, which
								on a phone is a horizontal scrollbar with no visible cause.
							-->
							<FieldLabel for={id} class={label ? undefined : 'sr-only w-px!'}>
								{label || question.label()}
							</FieldLabel>
							<Renderer
								{question}
								{options}
								controlId={id}
								value={answers[question.id]}
								onchange={(next) => onchange(question.id, next)}
								other={otherField ? String(answers[otherField] ?? '') : ''}
								onother={(next) => otherField && onchange(otherField, next)}
								invalid={error !== null}
								{describedBy}
							/>
							{#if question.description}
								<FieldDescription id={descriptionId ?? undefined} class="leading-snug whitespace-pre-line">
									{question.description()}
								</FieldDescription>
							{/if}
							{#if error}
								<FieldError id="{id}-error">{textFor(error)}</FieldError>
							{/if}
						</Field>
				{/if}
			{/if}
		</div>
	{/each}

	<Button type="submit" size="default" class="w-full" disabled={!hydrated || busy}>
		{m.q_continue()}
		<ArrowRightIcon aria-hidden="true" />
	</Button>
</form>
