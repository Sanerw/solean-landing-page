<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Alert from '$lib/components/ui/alert';
	import MotivationInterstitial from '$lib/features/questionnaire/MotivationInterstitial.svelte';
	import ProjectionInterstitial from '$lib/features/questionnaire/ProjectionInterstitial.svelte';
	import QuestionnaireShell from '$lib/features/questionnaire/QuestionnaireShell.svelte';
	import SurveyStepScreen from '$lib/features/questionnaire/SurveyStepScreen.svelte';
	import { questionnaireSession } from '$lib/features/questionnaire/survey-state.svelte';
	import { readWeightKg, weightStepId } from '$lib/features/questionnaire/answers';
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
	import FlaskConicalIcon from '@lucide/svelte/icons/flask-conical';
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

	/**
	 * Which step the answers justify opening. Null until hydration, because the server has no
	 * answers and must not decide this; the step renders as the model describes it until the
	 * browser can say otherwise.
	 */
	const entry = $derived.by(() => {
		questionnaireSession.revision;
		if (!hydrated || !plan || !survey) return null;

		return resolveStepEntry(plan, survey, data.stepId);
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

	const backHref = $derived(neighbourHref(-1) ?? QUESTIONNAIRE_HOME_HREF);
	const title = $derived(page?.questions[0]?.title?.split('\n')[0] ?? 'Questionnaire');

	// The engine's own page pointer follows the plan, so `page.validate` and `survey.data`
	// agree with what the route is showing.
	$effect(() => {
		if (survey && page) survey.currentPage = page;
	});

	function advance(): void {
		goto(neighbourHref(1) ?? questionnaireStepHref(COMPLETION_STEP_ID));
	}
</script>

<svelte:head>
	<title>{isCompletion ? 'Questionnaire complete' : title} | Solean</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<QuestionnaireShell progress={redirecting ? null : progress} {backHref}>
	{#if redirecting}
		<h1 class="font-display text-4xl font-medium sm:text-5xl">Opening your questionnaire</h1>
		<p role="status" class="mt-3 text-base text-muted-foreground md:text-lg">
			Taking you to where you left off.
		</p>
	{:else if isCompletion}
		<h1 class="font-display text-4xl font-medium sm:text-5xl">That is every question</h1>
		<p class="mt-3 text-base text-muted-foreground md:text-lg">
			Your answers are held in this browser tab and have not been sent anywhere.
		</p>
		<Alert.Root variant="highlighted" class="mt-8">
			<FlaskConicalIcon aria-hidden="true" />
			<Alert.Title>Not submitted yet</Alert.Title>
			<Alert.Description>
				Sending the anamnesis to RxScale and showing the recommended treatment arrives in a later
				feature.
			</Alert.Description>
		</Alert.Root>
	{:else if planStep?.kind === 'interlude'}
		{#if planStep.variant === 'motivation'}
			<MotivationInterstitial oncontinue={advance} />
		{:else if planStep.variant === 'projection'}
			<ProjectionInterstitial {weightKg} weightStepHref={weightHref} oncontinue={advance} />
		{/if}
	{:else if page}
		{#key page.name}
			<SurveyStepScreen {page} onvalid={advance} />
		{/key}
	{/if}
</QuestionnaireShell>
