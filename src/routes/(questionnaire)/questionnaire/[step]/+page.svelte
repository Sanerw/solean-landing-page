<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { goto } from '$app/navigation';
	import { Spinner } from '$lib/components/ui/spinner';
	import MotivationInterstitial from '$lib/features/questionnaire/MotivationInterstitial.svelte';
	import ProjectionInterstitial from '$lib/features/questionnaire/ProjectionInterstitial.svelte';
	import RecommendationScreen from '$lib/features/questionnaire/RecommendationScreen.svelte';
	import QuestionnaireShell from '$lib/features/questionnaire/QuestionnaireShell.svelte';
	import SurveyStepScreen from '$lib/features/questionnaire/SurveyStepScreen.svelte';
	import { questionnaireSession } from '$lib/features/questionnaire/survey-state.svelte';
	import { analyticsConsent } from '$lib/analytics/consent.svelte';
	import { trackAnamnesisSubmitted, trackQuestionnaireStarted } from '$lib/analytics/events';
	import { readEmail, readWeightKg, weightStepId } from '$lib/features/questionnaire/answers';
	import { submitAnamnesis, type AnamnesisSubmission } from '$lib/features/questionnaire/anamnesis-client';
	import {
		endReminderWatch,
		startReminderWatch
	} from '$lib/features/questionnaire/reminder-client';
	import { questionnaireUid } from '$lib/config/rxscale';
	import {
		COMPLETION_STEP_ID,
		buildStepPlan,
		progressFor,
		resolveStepEntry,
		stepIdForPage
	} from '$lib/features/questionnaire/steps';
	import {
		QUESTIONNAIRE_ENTRY_HREF,
		QUESTIONNAIRE_HOME_HREF,
		questionnaireStepHref
	} from '$lib/features/questionnaire/routes';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const document = $derived(data.questionnaire.ok ? data.questionnaire.document : null);
	const survey = $derived(document ? questionnaireSession.surveyFor(document) : null);

	// Recomputed on every answer: `visibleIf` decides which pages are in the plan at all.
	const plan = $derived.by(() => {
		questionnaireSession.revision;

		return survey ? buildStepPlan(survey) : null;
	});

	/**
	 * The answers live in the browser, so the server can only render the screen's frame. The
	 * projection says so for itself while this is false, rather than showing a number or
	 * claiming the weight is missing.
	 */
	let hydrated = $state(false);
	$effect(() => {
		hydrated = true;
	});

	const weightKg = $derived.by(() => {
		questionnaireSession.revision;
		if (!hydrated || !survey) return undefined;

		return readWeightKg(survey.data);
	});

	const weightHref = $derived.by(() => {
		const stepId = survey ? weightStepId(survey) : null;

		return stepId ? questionnaireStepHref(stepId) : QUESTIONNAIRE_ENTRY_HREF;
	});

	/** Null until hydration for the weight's reason: the server holds none of the answers. */
	const email = $derived.by(() => {
		questionnaireSession.revision;
		if (!hydrated || !survey) return null;

		return readEmail(survey.data);
	});

	/**
	 * Which step the answers justify opening. Null until hydration, because the server has no
	 * answers and must not decide this; the step renders as the model describes it until the
	 * browser can say otherwise.
	 */
	const entry = $derived.by(() => {
		questionnaireSession.revision;
		if (!hydrated || !plan || !survey) return null;

		return resolveStepEntry(
			plan,
			survey,
			data.stepId,
			questionnaireSession.anamnesisUid !== null,
			questionnaireSession.started
		);
	});

	const redirecting = $derived(entry !== null && !entry.show);

	$effect(() => {
		if (entry && !entry.show) {
			// Replaced, not pushed: an address the answers do not justify should not become a
			// place Back can return to.
			goto(questionnaireStepHref(entry.redirectTo), { replaceState: true });
		}
	});

	/**
	 * The funnel's entry. Guarded once per page load inside the event module, so walking the
	 * steps does not re-send it and a reload legitimately starts a new session. Deferred to
	 * hydration because the server neither has the answers nor the consent decision applied.
	 *
	 * Depends on the consent decision too: an advert can land someone here directly, and the
	 * banner they then answer is the one standing between this event and being sent.
	 */
	$effect(() => {
		analyticsConsent.state;
		if (hydrated && !redirecting) trackQuestionnaireStarted(data.stepId);
	});

	const isCompletion = $derived(data.stepId === COMPLETION_STEP_ID);
	const page = $derived(
		survey?.pages.find((candidate) => stepIdForPage(candidate.name) === data.stepId) ?? null
	);

	const planStep = $derived(plan?.steps.find((step) => step.id === data.stepId) ?? null);
	const planIndex = $derived(plan && planStep ? plan.steps.indexOf(planStep) : -1);

	// The rule itself lives with the plan, so the screen states no position of its own.
	const progress = $derived(plan ? progressFor(plan, data.stepId) : null);

	/** Position comes from the plan alone: a step outside it is never shown. */
	function neighbourHref(direction: 1 | -1): string | null {
		if (!plan || planIndex < 0) return null;

		const neighbour = plan.steps[planIndex + direction];

		return neighbour ? questionnaireStepHref(neighbour.id) : null;
	}

	// Once the anamnesis is sent there is no question to go back to: every step now resolves
	// forward to this screen, so Back would bounce off it. It leaves the questionnaire instead.
	const backHref = $derived(
		isCompletion ? QUESTIONNAIRE_HOME_HREF : (neighbourHref(-1) ?? QUESTIONNAIRE_HOME_HREF)
	);
	const title = $derived(page?.questions[0]?.title?.split('\n')[0] ?? 'Questionnaire');

	// The engine's own page pointer follows the plan, so `page.validate` and `survey.data`
	// agree with what the route is showing.
	$effect(() => {
		if (survey && page) survey.currentPage = page;
	});

	let submitting = $state(false);
	let submission = $state<Extract<AnamnesisSubmission, { ok: false }> | null>(null);

	/**
	 * The end of the plan is where the answers leave the browser. Anywhere else, continuing is
	 * a navigation and nothing more.
	 */
	async function advance(): Promise<void> {
		// Moving off a step is what makes this session a started one, and an optional first
		// question skipped by pressing Continue has to count.
		questionnaireSession.markStarted();

		// The step just validated may have been the one asking for the e-mail, so this is the
		// earliest the address can exist. Guarded to fire once per session, and deliberately not
		// awaited: a reminder must never hold up the walk.
		if (survey) startReminderWatch(survey.data);

		const next = neighbourHref(1);

		if (next) {
			submission = null;
			await goto(next);
			return;
		}

		await send();
	}

	/**
	 * One anamnesis per session. A uid already in hand means the record exists at RxScale, and
	 * a second submission would create a second one for the same person, so the only thing
	 * left to do is go to it.
	 */
	async function send(): Promise<void> {
		if (!survey || submitting) return;
		if (questionnaireSession.anamnesisUid !== null) {
			await goto(questionnaireStepHref(COMPLETION_STEP_ID));
			return;
		}

		submitting = true;
		submission = null;

		const result = await submitAnamnesis(fetch, questionnaireUid(), survey.data);

		if (!result.ok) {
			submitting = false;
			submission = result;
			return;
		}

		// The recommendation is read on the screen that shows the wait, not here. Recording the
		// uid is what makes every step resolve forward, so the route's own effect would navigate
		// during an await anyway; leaving at once is the honest version of that.
		submitting = false;
		// The count is the shape of the questionnaire the branching produced, never the answers
		// that produced it. The uid itself is deliberately not sent.
		trackAnamnesisSubmitted(plan?.steps.filter((step) => step.kind === 'survey').length ?? 0);
		// The record exists, so no reminder is owed. Brevo's exit condition reads this event.
		endReminderWatch(survey.data);
		questionnaireSession.recordSubmission(result.uid);
		await goto(questionnaireStepHref(COMPLETION_STEP_ID));
	}
</script>

<svelte:head>
	<title>{isCompletion ? m.title_questionnaire_complete() : title} | Solean</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<QuestionnaireShell
	progress={redirecting ? null : progress}
	{backHref}
	backLabel={isCompletion ? m.q_home() : m.q_back()}
>
	{#if redirecting}
		<!-- The same handoff as the flow's entry page, and the same reasoning. -->
		<div role="status" class="flex justify-center py-16">
			<Spinner aria-hidden="true" class="size-8 text-primary" />
			<span class="sr-only">{m.q_opening_resume()}</span>
		</div>
	{:else}
		<!--
			Keyed on the step rather than on the survey page, so an interlude enters the same way
			a question does: to the person pressing Continue they are the same gesture. The key
			also still guarantees what the page-level one did, that a step gets a fresh component
			rather than an old one handed new props, because a step id names exactly one page.
		-->
		{#key data.stepId}
			<div
				class="starting:translate-y-2 starting:opacity-0 transition-[opacity,translate] duration-200 ease-out-quint motion-reduce:transition-none"
			>
				{#if isCompletion}
					<!--
						One screen, not two: the plan is chosen and ordered in the same press. A separate
						confirmation step only asked the visitor to agree with themselves.
					-->
					<RecommendationScreen anamnesisUid={questionnaireSession.anamnesisUid} {email} />
				{:else if planStep?.kind === 'interlude'}
					{#if planStep.variant === 'motivation'}
						<MotivationInterstitial oncontinue={advance} stories={data.stories} />
					{:else if planStep.variant === 'projection'}
						<ProjectionInterstitial {weightKg} weightStepHref={weightHref} oncontinue={advance} />
					{/if}
				{:else if page}
					<SurveyStepScreen {page} onvalid={advance} {submitting} {submission} />
				{/if}
			</div>
		{/key}
	{/if}
</QuestionnaireShell>
