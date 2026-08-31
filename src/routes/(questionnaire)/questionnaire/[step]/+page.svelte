<script lang="ts">
	import { goto } from '$app/navigation';
	import MotivationInterstitial from '$lib/features/questionnaire/MotivationInterstitial.svelte';
	import ProjectionInterstitial from '$lib/features/questionnaire/ProjectionInterstitial.svelte';
	import RecommendationScreen from '$lib/features/questionnaire/RecommendationScreen.svelte';
	import RecommendationSelectionScreen from '$lib/features/questionnaire/RecommendationSelectionScreen.svelte';
	import QuestionnaireShell from '$lib/features/questionnaire/QuestionnaireShell.svelte';
	import SurveyStepScreen from '$lib/features/questionnaire/SurveyStepScreen.svelte';
	import { questionnaireSession } from '$lib/features/questionnaire/survey-state.svelte';
	import { readEmail, readWeightKg, weightStepId } from '$lib/features/questionnaire/answers';
	import { submitAnamnesis, type AnamnesisSubmission } from '$lib/features/questionnaire/anamnesis-client';
	import {
		fetchRecommendation,
		type RecommendationFetch
	} from '$lib/features/questionnaire/recommendation-client';
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
	 * Whether this browser still holds the walk it is about to congratulate. False after the
	 * handoff cleared it, which is the one case where the count and the order action would both
	 * be describing something that is gone. Before hydration the server has nothing to look at,
	 * and guessing "gone" there would flash a wrong screen at everyone.
	 */
	const answersHeld = $derived.by(() => {
		questionnaireSession.revision;
		if (!hydrated || !survey) return true;

		return Object.keys(survey.data).length > 0;
	});

	/**
	 * Which step the answers justify opening. Null until hydration, because the server has no
	 * answers and must not decide this; the step renders as the model describes it until the
	 * browser can say otherwise.
	 */
	const entry = $derived.by(() => {
		questionnaireSession.revision;
		if (!hydrated || !plan || !survey) return null;

		return resolveStepEntry(plan, survey, data.stepId, questionnaireSession.anamnesisUid !== null);
	});

	const redirecting = $derived(entry !== null && !entry.show);

	$effect(() => {
		if (entry && !entry.show) {
			// Replaced, not pushed: an address the answers do not justify should not become a
			// place Back can return to.
			goto(questionnaireStepHref(entry.redirectTo), { replaceState: true });
		}
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
	 * The read the completion screen needs, started as the submission returns rather than when
	 * that screen mounts. It is handed over unresolved, so the navigation waits for nothing and
	 * the screen still makes one request instead of two.
	 */
	let recommendation = $state<Promise<RecommendationFetch> | null>(null);

	/**
	 * Which of the two completion screens is due. Null until hydration for the same reason as
	 * the answers: the server holds no session and must not decide that a plan was chosen.
	 */
	const recommendationChoice = $derived.by(() => {
		questionnaireSession.revision;
		if (!hydrated) return null;

		return questionnaireSession.recommendationChoice;
	});

	/**
	 * The end of the plan is where the answers leave the browser. Anywhere else, continuing is
	 * a navigation and nothing more.
	 */
	async function advance(): Promise<void> {
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
		submitting = false;

		if (!result.ok) {
			submission = result;
			return;
		}

		questionnaireSession.recordSubmission(result.uid);
		recommendation = fetchRecommendation(fetch, result.uid);
		await goto(questionnaireStepHref(COMPLETION_STEP_ID));
	}
</script>

<svelte:head>
	<title>{isCompletion ? 'Questionnaire complete' : title} | Solean</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<QuestionnaireShell
	progress={redirecting ? null : progress}
	{backHref}
	backLabel={isCompletion ? 'Home' : 'Back'}
>
	{#if redirecting}
		<h1 class="font-display text-4xl font-medium sm:text-5xl">Opening your questionnaire</h1>
		<p role="status" class="mt-3 text-base text-muted-foreground md:text-lg">
			Taking you to where you left off.
		</p>
	{:else if isCompletion}
		<!--
			One step, two screens: the plan is chosen first and ordered second, and the choice is
			what separates them. It is held in the session rather than the URL so a refresh does
			not send someone back to a decision they already made.
		-->
		{#if answersHeld && recommendationChoice === null}
			<RecommendationSelectionScreen
				anamnesisUid={questionnaireSession.anamnesisUid}
				prefetched={recommendation}
				onconfirm={(variantId) => questionnaireSession.recordRecommendationChoice(variantId)}
			/>
		{:else}
			<RecommendationScreen
				questionTotal={plan?.questionTotal ?? 0}
				anamnesisUid={questionnaireSession.anamnesisUid}
				{email}
				{answersHeld}
				selectedVariant={recommendationChoice?.variantId ?? null}
				onchangeplan={() => questionnaireSession.forgetRecommendationChoice()}
				onhandoff={() => questionnaireSession.forgetAnswers()}
			/>
		{/if}
	{:else if planStep?.kind === 'interlude'}
		{#if planStep.variant === 'motivation'}
			<MotivationInterstitial oncontinue={advance} />
		{:else if planStep.variant === 'projection'}
			<ProjectionInterstitial {weightKg} weightStepHref={weightHref} oncontinue={advance} />
		{/if}
	{:else if page}
		{#key page.name}
			<SurveyStepScreen {page} onvalid={advance} {submitting} {submission} />
		{/key}
	{/if}
</QuestionnaireShell>
