<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { goto } from '$app/navigation';
	import { Spinner } from '$lib/components/ui/spinner';
	import MotivationInterstitial from '$lib/features/questionnaire/MotivationInterstitial.svelte';
	import ProjectionInterstitial from '$lib/features/questionnaire/ProjectionInterstitial.svelte';
	import RecommendationScreen from '$lib/features/questionnaire/RecommendationScreen.svelte';
	import QuestionnaireShell from '$lib/features/questionnaire/QuestionnaireShell.svelte';
	import ScreenView from '$lib/features/questionnaire/ScreenView.svelte';
	import SubmissionAlert from '$lib/features/questionnaire/SubmissionAlert.svelte';
	import { answerStore } from '$lib/features/questionnaire/answers/store.svelte';
	import { analyticsConsent } from '$lib/analytics/consent.svelte';
	import { trackAnamnesisSubmitted, trackQuestionnaireStarted } from '$lib/analytics/events';
	import { readEmail, readWeightKg, weightScreenId } from '$lib/features/questionnaire/answers';
	import {
		submitAnamnesis,
		type AnamnesisSubmission
	} from '$lib/features/questionnaire/anamnesis-client';
	import {
		endReminderWatch,
		startReminderWatch
	} from '$lib/features/questionnaire/reminder-client';
	import { questionnaireUid } from '$lib/config/rxscale';
	import { buildWalk } from '$lib/features/questionnaire/definition/screens';
	import { progressFor, resolveStepEntry } from '$lib/features/questionnaire/definition/position';
	import { toAnamnesisData } from '$lib/features/questionnaire/rxscale/mapping';
	import { missingRequired, theirErrors } from '$lib/features/questionnaire/rxscale/shadow';
	import {
		COMPLETION_STEP_ID,
		QUESTIONNAIRE_ENTRY_HREF,
		QUESTIONNAIRE_HOME_HREF,
		questionnaireStepHref
	} from '$lib/features/questionnaire/routes';
	import type { QuestionId } from '$lib/features/questionnaire/answers/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const answers = $derived(answerStore.answers);
	// Recomputed on every answer: the branching decides which screens are in the walk at all.
	const walk = $derived(buildWalk(answers));

	/**
	 * The answers live in the browser, so the server can only render the screen's frame. The
	 * projection says so for itself while this is false, rather than showing a number or
	 * claiming the weight is missing.
	 */
	let hydrated = $state(false);
	$effect(() => {
		hydrated = true;
	});

	const weightKg = $derived(hydrated ? readWeightKg(answers) : undefined);
	const weightHref = $derived.by(() => {
		const id = weightScreenId(answers);

		return id ? questionnaireStepHref(id) : QUESTIONNAIRE_ENTRY_HREF;
	});
	/** Null until hydration for the weight's reason: the server holds none of the answers. */
	const email = $derived(hydrated ? readEmail(answers) : null);

	/**
	 * Which step the answers justify opening. Null until hydration, because the server has no
	 * answers and must not decide this.
	 */
	const entry = $derived(
		hydrated
			? resolveStepEntry(
					walk,
					answers,
					data.stepId,
					answerStore.anamnesisUid !== null,
					answerStore.started
				)
			: null
	);

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
	 * steps does not re-send it. Depends on the consent decision too: an advert can land
	 * someone here directly, and the banner they then answer is the one standing between this
	 * event and being sent.
	 */
	$effect(() => {
		analyticsConsent.state;
		if (hydrated && !redirecting) trackQuestionnaireStarted(data.stepId);
	});

	const isCompletion = $derived(data.stepId === COMPLETION_STEP_ID);
	const step = $derived(walk.steps.find((candidate) => candidate.id === data.stepId) ?? null);
	const stepIndex = $derived(step ? walk.steps.indexOf(step) : -1);
	const progress = $derived(progressFor(walk, data.stepId));

	/** Position comes from the walk alone: a step outside it is never shown. */
	function neighbourHref(direction: 1 | -1): string | null {
		if (stepIndex < 0) return null;

		const neighbour = walk.steps[stepIndex + direction];

		return neighbour ? questionnaireStepHref(neighbour.id) : null;
	}

	// Once the anamnesis is sent there is no question to go back to: every step now resolves
	// forward to this screen, so Back would bounce off it. It leaves the questionnaire instead.
	const backHref = $derived(
		isCompletion ? QUESTIONNAIRE_HOME_HREF : (neighbourHref(-1) ?? QUESTIONNAIRE_HOME_HREF)
	);
	const title = $derived(
		step?.kind === 'screen' ? (step.screen.questionIds.length > 0 ? m.title_questionnaire() : '') : ''
	);

	let submitting = $state(false);
	let submission = $state<Extract<AnamnesisSubmission, { ok: false }> | null>(null);
	/**
	 * RxScale's refusals, from the last Continue. Never derived: the shadow re-parses the
	 * committed snapshot per call, so a derived would re-parse it on every keystroke, and
	 * their rules judge complete answers anyway.
	 */
	let refusals = $state<Partial<Record<QuestionId, string>>>({});
	/** Model questions our branching never asked for. A gap here is a predictable 400. */
	let incomplete = $state<readonly string[]>([]);

	function change(id: QuestionId, value: unknown): void {
		answerStore.set(id, value as never);
		// A refusal is about the answers that produced it, so editing any of them retires it.
		refusals = {};
	}

	/**
	 * The end of the walk is where the answers leave the browser. Anywhere else, continuing is
	 * a navigation and nothing more.
	 */
	async function advance(): Promise<void> {
		// Their rules judge complete answers, so this is the only moment worth asking, and only
		// after our own validation has passed.
		refusals = theirErrors(answers);
		if (step?.kind === 'screen' && step.screen.questionIds.some((id) => refusals[id])) return;

		// Moving off a step is what makes this session a started one.
		answerStore.markStarted();

		// The step just validated may have been the one asking for the e-mail, so this is the
		// earliest the address can exist. Deliberately not awaited: a reminder must never hold
		// up the walk.
		startReminderWatch(answers);

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
	 * a second submission would create a second one for the same person.
	 */
	async function send(): Promise<void> {
		if (submitting) return;
		if (answerStore.anamnesisUid !== null) {
			await goto(questionnaireStepHref(COMPLETION_STEP_ID));
			return;
		}

		// The completeness guard, and the first caller 24b's `missingRequired` has ever had.
		// A question of theirs that is required and visible but has no mapped answer means our
		// branching and theirs disagree, and sending anyway produces a 400 nobody can act on.
		incomplete = missingRequired(answers);
		if (incomplete.length > 0) return;

		submitting = true;
		submission = null;

		const result = await submitAnamnesis(fetch, questionnaireUid(), toAnamnesisData(answers));

		if (!result.ok) {
			submitting = false;
			submission = result;
			return;
		}

		submitting = false;
		// The count is the shape of the questionnaire the branching produced, never the answers
		// that produced it. The uid itself is deliberately not sent.
		trackAnamnesisSubmitted(walk.screenTotal);
		// The record exists, so no reminder is owed. The campaign's exit condition reads this.
		endReminderWatch(answers);
		answerStore.recordSubmission(result.uid);
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
		<div role="status" class="flex justify-center py-16">
			<Spinner aria-hidden="true" class="size-8 text-primary" />
			<span class="sr-only">{m.q_opening_resume()}</span>
		</div>
	{:else}
		<!--
			Keyed on the step, so an interlude enters the same way a question does: to the person
			pressing Continue they are the same gesture.
		-->
		{#key data.stepId}
			<div
				class="starting:translate-y-2 starting:opacity-0 transition-[opacity,translate] duration-200 ease-out-quint motion-reduce:transition-none"
			>
				{#if isCompletion}
					<RecommendationScreen anamnesisUid={answerStore.anamnesisUid} {email} />
				{:else if step?.kind === 'interlude'}
					{#if step.variant === 'motivation'}
						<MotivationInterstitial oncontinue={advance} stories={data.stories} />
					{:else if step.variant === 'projection'}
						<ProjectionInterstitial {weightKg} weightStepHref={weightHref} oncontinue={advance} />
					{/if}
				{:else if step?.kind === 'screen'}
					<ScreenView
						screen={step.screen}
						{answers}
						onchange={change}
						onvalid={advance}
						theirErrors={refusals}
						busy={submitting}
						actionLabel={submitting
							? m.q_submitting
							: submission
								? m.q_try_again
								: m.q_continue}
					>
						{#snippet beforeAction()}
							<SubmissionAlert {submission} {incomplete} />
						{/snippet}
					</ScreenView>
				{/if}
			</div>
		{/key}
	{/if}
</QuestionnaireShell>
