<script lang="ts">
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
	import type { PageModel, Question } from 'survey-core';
	import { rendererFor } from './question-registry';
	import { questionnaireSession } from './survey-state.svelte';
	import UnsupportedQuestion from './fields/UnsupportedQuestion.svelte';

	interface Props {
		page: PageModel;
		/** Called once the page validates against the model. */
		onvalid: () => void;
	}

	let { page, onvalid }: Props = $props();

	// survey-core is not reactive to Svelte, so every read of engine state is tied to the
	// session revision, which the survey bumps on each answer, and to a local bump after
	// validation so freshly attached error messages are picked up.
	let validationRevision = $state(0);

	/**
	 * Nothing here works without JavaScript: validation, branching and navigation all live in
	 * the engine. Before hydration a click would submit the form natively, reloading the step
	 * and losing the answer, so the action stays disabled until it can actually do its job.
	 */
	let hydrated = $state(false);
	$effect(() => {
		hydrated = true;
	});

	const questions = $derived.by(() => {
		questionnaireSession.revision;
		return page.questions.filter((question) => question.isVisible);
	});

	/**
	 * Only a question that collects an answer can block the step. An `expression` is computed
	 * display text with no input, so failing to draw it loses information but cannot produce
	 * an incomplete anamnesis, and stopping the whole questionnaire for it would be wrong.
	 */
	function collectsAnswer(question: Question): boolean {
		return question.hasInput !== false;
	}

	const unrenderable = $derived(
		questions.some(
			(question) => rendererFor(question).renderer === null && collectsAnswer(question)
		)
	);

	/**
	 * The step's headline is the first question that asks for something, because that is what
	 * the screen is for. Its own label is then kept for assistive technology but not drawn, so
	 * the same sentence does not appear twice.
	 */
	const headingQuestion = $derived(questions.find(collectsAnswer) ?? questions[0] ?? null);

	// Several titles in the model carry a second line, which reads as help text under the
	// headline rather than as part of it.
	const headingLines = $derived((headingQuestion?.title ?? '').split('\n'));

	function controlId(question: Question): string {
		return `q-${question.name}`;
	}

	function errorFor(question: Question): string | null {
		validationRevision;
		return question.errors.length > 0 ? question.errors[0].getText() : null;
	}

	/**
	 * The model decides what is valid, including its own messages. `validate(true, true)`
	 * shows the errors and moves focus to the first one.
	 */
	function submit(event: SubmitEvent): void {
		event.preventDefault();

		if (page.validate(true, true)) {
			onvalid();
			return;
		}

		validationRevision += 1;
	}
</script>

{#if headingQuestion}
	<h1 class="font-display text-4xl font-medium sm:text-5xl">{headingLines[0]}</h1>
	{#if headingLines.length > 1}
		<p class="mt-3 text-base text-muted-foreground md:text-lg">
			{headingLines.slice(1).join(' ')}
		</p>
	{/if}
{/if}

<form novalidate onsubmit={submit} class="mt-8">
	{#each questions as question (question.name)}
		{@const lookup = rendererFor(question)}
		{@const id = controlId(question)}
		{@const error = errorFor(question)}
		{@const describedBy = error ? `${id}-error` : undefined}

		<div class="mb-8">
			{#if lookup.renderer === null}
				<UnsupportedQuestion {question} reason={lookup.reason} blocking={collectsAnswer(question)} />
			{:else if lookup.group}
				<FieldSet>
					<FieldLegend class={question === headingQuestion ? 'sr-only' : undefined}>
						{question.title}
					</FieldLegend>
					{#if question.description}
						<FieldDescription>{question.description}</FieldDescription>
					{/if}
					<lookup.renderer
						{question}
						controlId={id}
						invalid={error !== null}
						{describedBy}
						value={question.value}
						onchange={(next) => (question.value = next)}
					/>
					{#if error}
						<FieldError id="{id}-error">{error}</FieldError>
					{/if}
				</FieldSet>
			{:else}
				<Field>
					<FieldLabel for={id} class={question === headingQuestion ? 'sr-only' : undefined}>
						{question.title}
					</FieldLabel>
					{#if question.description}
						<FieldDescription>{question.description}</FieldDescription>
					{/if}
					<lookup.renderer
						{question}
						controlId={id}
						invalid={error !== null}
						{describedBy}
						value={question.value}
						onchange={(next) => (question.value = next)}
					/>
					{#if error}
						<FieldError id="{id}-error">{error}</FieldError>
					{/if}
				</Field>
			{/if}
		</div>
	{/each}

	<!--
		A step holding a question we cannot draw must not be walked past: continuing would
		submit an anamnesis missing an answer the user was never shown.
	-->
	<Button type="submit" size="lg" disabled={!hydrated || unrenderable}>
		Continue
		<ArrowRightIcon aria-hidden="true" />
	</Button>
</form>
