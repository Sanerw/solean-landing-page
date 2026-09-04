<script lang="ts">
	import type { Snippet } from 'svelte';
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
	import BellRingIcon from '@lucide/svelte/icons/bell-ring';
	import InfoIcon from '@lucide/svelte/icons/info';
	import type { Answers, QuestionId } from './answers/types';
	import { screenErrorFor, type ScreenError } from './answers/screen-errors';
	import { validateQuestion, validateScreen, type ValidationCode } from './answers/validate';
	import { optionsFor, type AnyQuestion } from './definition/kinds';
	import { rendererFor } from './definition/renderer-registry';
	import { questionById } from './definition/questions';
	import {
		fieldLabelFor,
		fieldNameFor,
		screenHeading,
		visibleQuestions,
		type ScreenDef
	} from './definition/screens';
	import UnsupportedKind from './fields/UnsupportedKind.svelte';

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
		/** Rendered between the questions and the action: the submission's own failures. */
		beforeAction?: Snippet;
		/**
		 * The action's wording. The route overrides it after a failed submission, where the
		 * press is a retry rather than a step forward; the screen itself has no idea a
		 * submission exists.
		 */
		actionLabel?: () => string;
	}

	let {
		screen,
		answers,
		onchange,
		onvalid,
		theirErrors = {},
		busy = false,
		beforeAction,
		actionLabel = m.q_continue
	}: Props = $props();

	/** Errors appear on submit, not while someone is still typing their first answer. */
	let submitted = $state(false);
	/**
	 * Fields the visitor has both answered and left, which are the only ones judged before a
	 * submit. Leaving a field untouched says nothing: an empty screen must not turn red under
	 * somebody who has not started, so `required` never comes from a blur.
	 */
	let visited = $state<ReadonlySet<QuestionId>>(new Set());
	let ourErrors = $state<Partial<Record<QuestionId, ValidationCode>>>({});
	/**
	 * Answered again since that submit. Both verdicts describe the answer they were given, so
	 * neither survives it being replaced: without this the side-effects screen went on saying
	 * an answer was missing while the answer was on display.
	 */
	let changed = $state<ReadonlySet<QuestionId>>(new Set());

	const questions = $derived(visibleQuestions(screen, answers));
	const heading = $derived(screenHeading(screen, answers));

	/** Detail questions are drawn inside the panel, so they are not also drawn in the flow. */
	const detailIds = $derived(new Set<QuestionId>(screen.detail?.questionIds ?? []));
	const flowQuestions = $derived(questions.filter((question) => !detailIds.has(question.id)));
	const detailQuestions = $derived(questions.filter((question) => detailIds.has(question.id)));

	/**
	 * Nothing here works without JavaScript: validation, branching and navigation are all
	 * client-side. Before hydration a press would submit the form natively and lose the answer,
	 * so the action stays disabled until it can do its job.
	 */
	let hydrated = $state(false);
	$effect(() => {
		hydrated = true;
	});

	/**
	 * The codes that say nothing about which answer they are about. On a screen carrying four
	 * fields, four identical "This answer is required" lines make the reader match each message
	 * to the box above it, so these name the field instead.
	 *
	 * The rest are left alone deliberately: "Please enter a valid e-mail address" and "Please
	 * give the month and year" already say which answer they mean, and naming the field again
	 * would only make the sentence longer.
	 */
	const NAMED_MESSAGES: Partial<Record<ValidationCode, (input: { field: string }) => string>> = {
		required: m.qv_required_field,
		'out-of-range': m.qv_out_of_range
	};

	const CODE_MESSAGES: Record<ValidationCode, () => string> = {
		required: m.qv_required,
		// Every number on the questionnaire carries a short label, so this is the unreachable
		// half of the pair rather than a second wording anyone will read.
		'out-of-range': () => m.qv_out_of_range({ field: '' }),
		'invalid-phone': m.qv_invalid_phone,
		'invalid-name': m.qv_invalid_name,
		'invalid-month': m.qv_invalid_month,
		'invalid-email': m.qv_invalid_email,
		'invalid-date': m.qv_invalid_date,
		'none-with-others': m.qv_none_with_others,
		'other-text-missing': m.qv_other_text_missing
	};

	/** Ours is a code we word; theirs is a German sentence we pass through untouched. */
	function textFor(error: ScreenError, question: AnyQuestion): string {
		if (error.source === 'theirs') return error.text;

		const named = NAMED_MESSAGES[error.code];
		const field = fieldNameFor(question);

		return named && field ? named({ field }) : CODE_MESSAGES[error.code]();
	}

	function errorFor(id: QuestionId): ScreenError | null {
		if (submitted) return screenErrorFor(id, ourErrors, theirErrors, changed);
		if (!visited.has(id)) return null;

		// Judged live rather than from `ourErrors`, so the message goes the moment the answer
		// is fixed, without waiting for a second blur.
		const code = validateQuestion(questionById(id), answers);

		return code && code !== 'required' ? { source: 'ours', code } : null;
	}

	/**
	 * A field is judged once the visitor has typed in it and moved on. Before a submit only a
	 * malformed answer is reported, never a missing one, which is what keeps the screen quiet
	 * for somebody tabbing through to see what is asked.
	 */
	function leave(id: QuestionId): void {
		if (!changed.has(id)) return;

		visited = new Set(visited).add(id);
	}

	function markChanged(id: QuestionId): void {
		changed = new Set(changed).add(id);
	}

	function record(id: QuestionId, value: unknown): void {
		markChanged(id);
		onchange(id, value);
	}

	/**
	 * The free text is stored on the `<id>Other` sibling, but `other-text-missing` is reported
	 * against the question itself, so typing it has to clear that question's error.
	 */
	function recordOther(question: AnyQuestion, next: string): void {
		if (!question.otherField) return;

		markChanged(question.id);
		onchange(question.otherField, next);
	}

	/**
	 * Focus the first field a submit rejected. Without it the press leaves focus on Continue,
	 * below the message, so a screen reader hears "there is a problem" and lands nowhere near
	 * the problem. The control ids are the screen's own, so this needs no component change.
	 */
	function focusFirstError(codes: Partial<Record<QuestionId, ValidationCode>>): void {
		const first = flowQuestions.concat(detailQuestions).find((question) => codes[question.id]);
		if (!first) return;

		// A group question puts its control id on each option rather than on the group, so the
		// bare id resolves to nothing and the first option is the field.
		const host =
			document.getElementById(`q-${first.id}`) ?? document.getElementById(`q-${first.id}-0`);

		host?.focus();
	}

	function submit(event: SubmitEvent): void {
		event.preventDefault();
		if (busy) return;

		submitted = true;
		visited = new Set();
		ourErrors = validateScreen(screen.id, answers);
		// Both verdicts are about to be re-stated for every answer, so nothing is stale.
		changed = new Set();

		// The caller owns what happens next, including asking RxScale.
		if (Object.keys(ourErrors).length === 0) void onvalid();
		else focusFirstError(ourErrors);
	}

	/**
	 * The artboards' two label idioms, measured in the export: a short field name in 14px
	 * micro-caps (`Section Label`), and a whole question in 17px sentence case
	 * (`Sub Question`). `design-system.md` section 2 records the first one.
	 *
	 * Each carries the prefix its primitive scopes its own defaults with: `FieldLabel` uses
	 * `not-has-[>[data-slot=field]]` and `FieldLegend` uses `data-[variant=legend]`. A plain
	 * `text-lg` loses to either on specificity rather than winning on source order, which is
	 * how the group questions ended up two steps larger than the fields beside them.
	 */
	const QUESTION_ON_LABEL =
		'not-has-[>[data-slot=field]]:font-display not-has-[>[data-slot=field]]:text-base ' +
		'sm:not-has-[>[data-slot=field]]:text-lg not-has-[>[data-slot=field]]:leading-snug ' +
		'not-has-[>[data-slot=field]]:normal-case not-has-[>[data-slot=field]]:tracking-normal ' +
		'not-has-[>[data-slot=field]]:text-foreground';
	const SHORT_ON_LEGEND =
		'data-[variant=legend]:font-sans data-[variant=legend]:text-xs ' +
		'data-[variant=legend]:font-semibold data-[variant=legend]:uppercase ' +
		'data-[variant=legend]:tracking-widest data-[variant=legend]:text-muted-foreground';
	// `leading-snug` because these wrap: at 18px the stock line height is 28px, which reads as
	// two separate sentences once a clinical question runs to a second line.
	const QUESTION_ON_LEGEND =
		'data-[variant=legend]:text-base sm:data-[variant=legend]:text-lg ' +
		'data-[variant=legend]:leading-snug';

	/**
	 * The label-to-control distance, 10px, on the two paths that draw it.
	 *
	 * A `<legend>` is rendered outside its `<fieldset>`'s flex flow, so the set's `gap` never
	 * reaches it and only the legend's own margin spaces it: `mb-0` plus a gap looks right in
	 * the class list and renders flush. The set's gap still spaces the control from a footnote
	 * or an error, and the primitive raises it to 12px for a radio or checkbox group, which is
	 * restated here so one screen has one rhythm.
	 */
	const LABEL_GAP = 'mb-2.5';
	const FIELD_SET =
		'gap-2.5 has-[>[data-slot=radio-group]]:gap-2.5 has-[>[data-slot=checkbox-group]]:gap-2.5';

	/** `half` shares a row from `sm` up; anything else spans the grid. */
	function spanFor(question: AnyQuestion): string {
		return question.layout === 'half' ? 'min-w-0' : 'min-w-0 sm:col-span-2';
	}
</script>

{#snippet noticeCard(text: string)}
	<!--
		Muted card, never `role="alert"`: nothing has just happened, and an alert would
		interrupt a screen reader in the middle of a question.
	-->
	<div class="flex items-start gap-3 rounded-md bg-muted p-4">
		<BellRingIcon class="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
		<p class="text-sm leading-snug text-muted-foreground">{text}</p>
	</div>
{/snippet}

{#snippet footnoteCard(id: string, text: string)}
	<div class="flex items-start gap-3 rounded-md bg-muted p-3" {id}>
		<InfoIcon class="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
		<p class="text-sm leading-snug text-muted-foreground">{text}</p>
	</div>
{/snippet}

{#snippet questionField(question: AnyQuestion)}
	{@const options = optionsFor(question, answers)}
	{@const lookup = rendererFor(question, options)}
	{@const id = `q-${question.id}`}
	{@const error = errorFor(question.id)}
	{@const otherField = question.otherField}
	{@const label = fieldLabelFor(question, heading)}
	{@const isDonor = heading !== null && question === heading.donor}
	{@const showDescription = question.description && !isDonor}
	{@const descriptionId = showDescription ? `${id}-description` : null}
	{@const footnoteId = question.footnote ? `${id}-footnote` : null}
	{@const describedBy =
		[descriptionId, footnoteId, error ? `${id}-error` : null].filter(Boolean).join(' ') ||
		undefined}

	{#if lookup.entry === null}
		<UnsupportedKind questionId={question.id} reason={lookup.reason} />
	{:else}
		{@const Renderer = lookup.entry.renderer}
		{@const isGroup = lookup.entry.presentation === 'group'}

		{#if isGroup}
			<FieldSet class={FIELD_SET}>
				<!-- The heading already says this; keep it for assistive technology only. -->
				<FieldLegend
					class={label
						? `${LABEL_GAP} ${question.shortLabel ? SHORT_ON_LEGEND : QUESTION_ON_LEGEND}`
						: 'sr-only'}
				>
					{label || question.label()}
				</FieldLegend>
				{#if showDescription}
					<FieldDescription id={descriptionId ?? undefined} class="leading-snug whitespace-pre-line">
						{question.description?.()}
					</FieldDescription>
				{/if}
				{#if question.points}
					<!--
						A list, not a paragraph: nine statements read one at a time.

						On `--foreground`, unlike a description: these are what the tick beneath them
						confirms, so setting them in the grey the hints use would put the substance of a
						medical consent in the register reserved for asides.
					-->
					<ul class="ml-4 list-disc space-y-1.5 text-sm leading-snug text-foreground">
						{#each question.points().split('\n').filter(Boolean) as point (point)}
							<li>{point}</li>
						{/each}
					</ul>
				{/if}
				<Renderer
					{question}
					{options}
					controlId={id}
					value={answers[question.id]}
					onchange={(next) => record(question.id, next)}
					other={otherField ? String(answers[otherField] ?? '') : ''}
					onother={(next) => recordOther(question, next)}
					invalid={error !== null}
					{describedBy}
				/>
				{#if question.footnote}
					{@render footnoteCard(footnoteId ?? '', question.footnote())}
				{/if}
				{#if error}
					<FieldError id="{id}-error">{textFor(error, question)}</FieldError>
				{/if}
			</FieldSet>
		{:else}
			<Field class="gap-2.5">
				<!--
					`w-px!` beside `sr-only`. Field sets `[&>.sr-only]:w-auto` so an sr-only child
					is not stretched by its `[&>*]:w-full`, and that also undoes sr-only's own
					`width: 1px`: the hidden label becomes as wide as the sentence it repeats,
					positioned past the viewport, still counted in the page's scroll width, which
					on a phone is a horizontal scrollbar with no visible cause.
				-->
				<FieldLabel
					for={id}
					class={label ? (question.shortLabel ? '' : QUESTION_ON_LABEL) : 'sr-only w-px!'}
				>
					{label || question.label()}
				</FieldLabel>
				<Renderer
					{question}
					{options}
					controlId={id}
					value={answers[question.id]}
					onchange={(next) => record(question.id, next)}
					other={otherField ? String(answers[otherField] ?? '') : ''}
					onother={(next) => recordOther(question, next)}
					invalid={error !== null}
					{describedBy}
				/>
				{#if showDescription}
					<FieldDescription id={descriptionId ?? undefined} class="leading-snug whitespace-pre-line">
						{question.description?.()}
					</FieldDescription>
				{/if}
				{#if question.footnote}
					{@render footnoteCard(footnoteId ?? '', question.footnote())}
				{/if}
				{#if error}
					<FieldError id="{id}-error">{textFor(error, question)}</FieldError>
				{/if}
			</Field>
		{/if}
	{/if}
{/snippet}

{#if heading}
	<!--
		A step down on a phone and nowhere else. The artboards are drawn at 1920 and their
		38px title is what `sm:text-4xl` keeps; at 390 the same three lines of it fill half the
		screen before a question is visible. The fields are untouched: shrinking what somebody
		has to read is different from shrinking what they have to operate.
	-->
	<h1 class="font-display text-2xl font-medium tracking-tight sm:text-4xl">{heading.title}</h1>
	{#if heading.subtitle}
		<!-- 18px on `--foreground`, not muted: the export sets it in the same green as the title. -->
		<p class="mt-2 text-base text-foreground sm:text-lg">{heading.subtitle}</p>
	{/if}
{/if}

<form novalidate onsubmit={submit} class="mt-6">
	<!--
		Two distances, and the difference between them is what groups a label with its control.
		10px inside a field, which is the export's `HEIGHT Field`, `Option Pair` and
		`Height Weight Row`, all `gap-[10px]`. 24px between one field and the next, and again
		before the action, which is wider than the export's 14px `Answer Block`: at 14px a label
		sat almost as close to the field above it as to its own control, so the pairing read
		ambiguously. The same 24px opens the form and closes it.
	-->
	<div class="grid gap-x-2.5 gap-y-6 sm:grid-cols-2">
		{#each flowQuestions as question (question.id)}
			<!--
				`focusout` on the block rather than `blur` on each control: it bubbles, so one
				listener covers a text box, a radio group and the free text an "other" reveals,
				and no field component has to know that validation exists.
			-->
			<div class={spanFor(question)} onfocusout={() => leave(question.id)}>
				{@render questionField(question)}
			</div>

			<!--
				The panel sits below the whole choice group, never inside it. The artboard
				interleaves the three inputs between the medication list and its last row, and
				splitting a radio group with text inputs breaks the group for assistive
				technology, so the pinned row stays the group's last item and the panel follows.
			-->
			{#if screen.detail && question.id === screen.detail.anchor && detailQuestions.length > 0}
				<div class="min-w-0 sm:col-span-2">
					<!--
						No card behind it: the artboard draws these as a titled group on the page, and a
						panel of its own put a second surface between the list and the fields that
						belong to the choice just made.
					-->
					<FieldSet class={FIELD_SET}>
						<!--
							The whole-question register, not the micro-caps one the fields inside it use.
							The artboard sets this title in micro-caps because it draws no field labels at
							all; ours does, and three identical micro-cap lines stacked read as a fourth
							field name rather than as the group the three belong to.
						-->
						<FieldLegend class="{LABEL_GAP} {QUESTION_ON_LEGEND}">
							{screen.detail.label(answers)}
						</FieldLegend>
						<div class="grid gap-x-2.5 gap-y-6 sm:grid-cols-2">
							{#each detailQuestions as detail (detail.id)}
								<div class={spanFor(detail)} onfocusout={() => leave(detail.id)}>
									{@render questionField(detail)}
								</div>
							{/each}
						</div>
						{#if screen.detail.footnote}
							<p class="text-sm leading-snug text-muted-foreground">
								{screen.detail.footnote()}
							</p>
						{/if}
					</FieldSet>
				</div>
			{/if}
		{/each}

		{#if screen.notice}
			<div class="min-w-0 sm:col-span-2">
				{@render noticeCard(screen.notice())}
			</div>
		{/if}
	</div>

	<div class="mt-6">
		{@render beforeAction?.()}

		<Button type="submit" size="default" class="w-full" disabled={!hydrated || busy}>
			{actionLabel()}
			<ArrowRightIcon aria-hidden="true" />
		</Button>
	</div>
</form>
