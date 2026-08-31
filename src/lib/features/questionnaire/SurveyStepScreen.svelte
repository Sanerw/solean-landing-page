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
	import * as Alert from '$lib/components/ui/alert';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import type { PageModel, Question } from 'survey-core';
	import type { AnamnesisSubmission } from './anamnesis-client';
	import { rendererFor } from './question-registry';
	import { questionnaireSession } from './survey-state.svelte';
	import UnsupportedQuestion from './fields/UnsupportedQuestion.svelte';

	/**
	 * The failure the submission itself reported, passed through rather than remapped: the
	 * screen shows what the client was told, and a new reason cannot go unhandled.
	 */
	type SubmissionFailure = Extract<AnamnesisSubmission, { ok: false }>;

	interface Props {
		page: PageModel;
		/** Called once the page validates against the model. May submit, so may be async. */
		onvalid: () => void | Promise<void>;
		/** True while a submission is in flight: the action waits and nothing navigates. */
		submitting?: boolean;
		submission?: SubmissionFailure | null;
	}

	let { page, onvalid, submitting = false, submission = null }: Props = $props();

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

	/**
	 * Every read of engine state goes through the session revision, because survey-core is not
	 * reactive to Svelte. Without it a renderer draws the answer it was born with: the engine
	 * receives the change, so the step still advances, but nothing on screen moves, and an
	 * answer the engine set itself, as an exclusive option does when it clears the others,
	 * never appears at all.
	 */
	function valueOf(question: Question): unknown {
		questionnaireSession.revision;
		const value = question.value;

		// A multiple-choice answer comes back as the very array the engine keeps and edits in
		// place, so an exclusive option clearing the others changes nothing Svelte can compare.
		// The copy is read-only here; the engine's own array is never handed to a renderer.
		return Array.isArray(value) ? [...value] : value;
	}

	function commentOf(question: Question): string {
		questionnaireSession.revision;
		return question.comment ?? '';
	}

	function errorFor(question: Question): string | null {
		questionnaireSession.revision;
		return question.errors.length > 0 ? question.errors[0].getText() : null;
	}

	/**
	 * The model decides what is valid, including its own messages. `validate(true, true)`
	 * shows the errors and moves focus to the first one.
	 */
	function submit(event: SubmitEvent): void {
		event.preventDefault();
		if (submitting) return;

		const valid = page.validate(true, true);
		// Either way the engine now holds different error state than a moment ago.
		questionnaireSession.touch();

		// The caller owns what happens next, including whether it takes a round trip.
		if (valid) void onvalid();
	}
</script>

{#if headingQuestion}
	<h1 class="font-display text-3xl font-medium sm:text-4xl">{headingLines[0]}</h1>
	{#if headingLines.length > 1}
		<p class="mt-2 text-sm text-muted-foreground sm:text-base">
			{headingLines.slice(1).join(' ')}
		</p>
	{/if}
{/if}

<form novalidate onsubmit={submit} class="mt-6">
	{#each questions as question (question.name)}
		{@const lookup = rendererFor(question)}
		{@const id = controlId(question)}
		{@const error = errorFor(question)}
		{@const answer = valueOf(question)}
		{@const comment = commentOf(question)}
		{@const describedBy = error ? `${id}-error` : undefined}

		<div class="mb-5">
			{#if lookup.renderer === null}
				<UnsupportedQuestion {question} reason={lookup.reason} blocking={collectsAnswer(question)} />
			{:else if lookup.presentation === 'display'}
				<!-- Nothing to label: the element states something rather than asking it. -->
				<lookup.renderer
					{question}
					controlId={id}
					invalid={false}
					describedBy={undefined}
					value={answer}
					onchange={() => {}}
					comment=""
					oncomment={() => {}}
				/>
			{:else if lookup.presentation === 'group'}
				<FieldSet class="gap-3">
					<FieldLegend class={question === headingQuestion ? 'sr-only' : 'mb-2 text-lg'}>
						{question.title}
					</FieldLegend>
					{#if question.description}
						<FieldDescription class="leading-snug whitespace-pre-line">
							{question.description}
						</FieldDescription>
					{/if}
					<lookup.renderer
						{question}
						controlId={id}
						invalid={error !== null}
						{describedBy}
						value={answer}
						onchange={(next) => (question.value = next)}
						{comment}
						oncomment={(next) => (question.comment = next)}
					/>
					{#if error}
						<FieldError id="{id}-error">{error}</FieldError>
					{/if}
				</FieldSet>
			{:else}
				<Field class="gap-2">
					<FieldLabel for={id} class={question === headingQuestion ? 'sr-only' : undefined}>
						{question.title}
					</FieldLabel>
					{#if question.description}
						<FieldDescription class="leading-snug whitespace-pre-line">
							{question.description}
						</FieldDescription>
					{/if}
					<lookup.renderer
						{question}
						controlId={id}
						invalid={error !== null}
						{describedBy}
						value={answer}
						onchange={(next) => (question.value = next)}
						{comment}
						oncomment={(next) => (question.comment = next)}
					/>
					{#if error}
						<FieldError id="{id}-error">{error}</FieldError>
					{/if}
				</Field>
			{/if}
		</div>
	{/each}

	{#if submission}
		<!--
			The submission failed as a whole, so this sits with the step rather than with a
			question. `assertive`, unlike a question's error: the person pressed a button and
			nothing visible moved.
		-->
		<Alert.Root variant="destructive" class="mb-5" role="alert" aria-live="assertive">
			<TriangleAlertIcon aria-hidden="true" />
			<Alert.Title>
				{submission.reason === 'rejected'
					? 'Your answers were not accepted'
					: 'We could not send your answers'}
			</Alert.Title>
			<Alert.Description>
				{#if submission.reason === 'rejected'}
					<p>
						The medical service checked your answers again and found something it cannot accept.
						Nothing has been saved and no doctor has seen them.
					</p>
					{#if submission.messages.length > 0}
						<!-- The service's own words. We do not translate them or guess which question
						     each one meant, because our own validation already passed. -->
						<ul class="mt-2 list-disc ps-5">
							{#each submission.messages as message (message)}
								<li>{message}</li>
							{/each}
						</ul>
					{:else}
						<p class="mt-2">It did not say what was wrong.</p>
					{/if}
				{:else}
					<p>
						The medical service did not answer, so nothing was saved and nothing was sent to a
						doctor. Your answers are still here. Try again in a moment.
					</p>
				{/if}
			</Alert.Description>
		</Alert.Root>
	{/if}

	<!--
		A step holding a question we cannot draw must not be walked past: continuing would
		submit an anamnesis missing an answer the user was never shown.
	-->
	<Button
		type="submit"
		size="default"
		class="w-full"
		disabled={!hydrated || unrenderable || submitting}
	>
		{#if submitting}
			Sending your answers
		{:else}
			{submission ? 'Try again' : 'Continue'}
			<ArrowRightIcon aria-hidden="true" />
		{/if}
	</Button>
</form>
