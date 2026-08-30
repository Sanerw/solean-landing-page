<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Alert from '$lib/components/ui/alert';
	import MotivationInterstitial from '$lib/features/questionnaire/MotivationInterstitial.svelte';
	import QuestionnaireShell from '$lib/features/questionnaire/QuestionnaireShell.svelte';
	import SurveyStepScreen from '$lib/features/questionnaire/SurveyStepScreen.svelte';
	import { questionnaireSession } from '$lib/features/questionnaire/survey-state.svelte';
	import {
		COMPLETION_STEP_ID,
		buildStepPlan,
		stepIdForPage
	} from '$lib/features/questionnaire/steps';
	import {
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

	const isCompletion = $derived(data.stepId === COMPLETION_STEP_ID);
	const page = $derived(
		survey?.pages.find((candidate) => stepIdForPage(candidate.name) === data.stepId) ?? null
	);

	const planStep = $derived(plan?.steps.find((step) => step.id === data.stepId) ?? null);
	const planIndex = $derived(plan && planStep ? plan.steps.indexOf(planStep) : -1);

	// An interlude keeps the count of the question before it: the bar must not jump backwards
	// or disappear on a screen that sits inside the flow but asks nothing.
	const progress = $derived.by(() => {
		if (!plan || planIndex < 0) return null;

		for (let index = planIndex; index >= 0; index -= 1) {
			const step = plan.steps[index];
			if (step.kind === 'survey') {
				return { current: step.questionNumber, total: plan.questionTotal };
			}
		}

		return null;
	});

	/**
	 * A page can be opened by deep link while the answers do not currently place it in the
	 * plan. It still renders; where Continue goes is then decided by document order rather
	 * than by a position the plan does not have. Guarding that entry is feature 11.
	 */
	function neighbourHref(direction: 1 | -1): string | null {
		if (!plan || !survey) return null;

		if (planIndex >= 0) {
			const neighbour = plan.steps[planIndex + direction];

			return neighbour ? questionnaireStepHref(neighbour.id) : null;
		}

		if (!page) return null;
		const position = survey.pages.indexOf(page);
		const candidates = plan.steps.filter((step) => step.kind === 'survey');
		const following = candidates.filter((step) => {
			const index = survey.pages.findIndex((candidate) => candidate.name === step.pageName);

			return direction === 1 ? index > position : index < position;
		});
		const neighbour = direction === 1 ? following.at(0) : following.at(-1);

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

<QuestionnaireShell {progress} {backHref}>
	{#if isCompletion}
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
		{/if}
	{:else if page}
		{#key page.name}
			<SurveyStepScreen {page} onvalid={advance} />
		{/key}
	{/if}
</QuestionnaireShell>
