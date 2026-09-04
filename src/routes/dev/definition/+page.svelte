<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import {
		emptyAnswers,
		type Answers,
		type QuestionId
	} from '$lib/features/questionnaire/answers/types';
	import { bmi } from '$lib/features/questionnaire/definition/conditions';
	import { buildWalk } from '$lib/features/questionnaire/definition/screens';
	import { toAnamnesisData } from '$lib/features/questionnaire/rxscale/mapping';
	import { missingRequired, theirErrors } from '$lib/features/questionnaire/rxscale/shadow';
	import ScreenView from '$lib/features/questionnaire/ScreenView.svelte';

	/**
	 * The questionnaire, walked against our own definition. This is 24c's evidence and 24d's
	 * rehearsal: the same components, the same walk and the same validation the real route
	 * will use, on a development surface so the live flow can keep running on RxScale's model
	 * until the switch.
	 *
	 * Its own answers, not the shared store: a visit here must not leave answers behind for
	 * the real questionnaire.
	 */
	let answers = $state<Answers>(emptyAnswers());
	let cursor = $state(0);
	/** Their refusals, from the last submit. Never derived: the shadow re-parses 37 KB a call. */
	let refusals = $state<Partial<Record<QuestionId, string>>>({});

	const walk = $derived(buildWalk(answers));
	const step = $derived(walk.steps[cursor] ?? null);
	const payload = $derived(toAnamnesisData(answers));
	const missing = $derived(missingRequired(answers));
	const atEnd = $derived(cursor >= walk.steps.length);

	function set(id: QuestionId, value: unknown) {
		// The component contract passes `value` as `unknown`, because the kinds do not agree on
		// one type. The cast is the boundary where it lands back in a typed field, and it is
		// safe for the reason `kinds.ts` exists: a question's kind cannot disagree with the
		// field it writes, so the component that produced this value produced the right shape.
		answers = { ...answers, [id]: value as Answers[QuestionId] };
	}

	function advance() {
		// Their rules judge complete answers, so this is the only moment worth asking.
		refusals = theirErrors(answers);
		if (Object.keys(refusals).some((id) => step?.kind === 'screen' && step.screen.questionIds.includes(id as QuestionId))) {
			return;
		}
		cursor += 1;
	}

	function back() {
		refusals = {};
		cursor = Math.max(0, cursor - 1);
	}

	function reset() {
		answers = emptyAnswers();
		cursor = 0;
		refusals = {};
	}
</script>

<svelte:head><title>Questionnaire walk</title></svelte:head>

<div class="mx-auto grid max-w-6xl gap-8 p-8 lg:grid-cols-[1fr_22rem]">
	<div class="space-y-6">
		<header class="space-y-2">
			<h1 class="font-display text-2xl font-semibold">Questionnaire walk</h1>
			<p class="text-muted-foreground text-sm">
				Feature 24c. Our definition, our components, our validation, with RxScale's rules
				checked on every Continue.
			</p>
		</header>

		{#if step?.kind === 'screen'}
			<div class="space-y-2">
				<Progress value={(step.screenNumber / walk.screenTotal) * 100} />
				<p class="text-muted-foreground text-sm" data-testid="progress">
					Screen {step.screenNumber} of {walk.screenTotal} · <code>{step.screen.id}</code>
				</p>
			</div>

			{#key step.screen.id}
				<ScreenView
					screen={step.screen}
					{answers}
					onchange={set}
					onvalid={advance}
					theirErrors={refusals}
				/>
			{/key}
		{:else if step?.kind === 'interlude'}
			<div class="border-border space-y-4 rounded-xl border border-dashed p-8 text-center">
				<p class="text-muted-foreground text-sm uppercase tracking-widest">Interlude</p>
				<p class="font-display text-xl">{step.variant}</p>
				<p class="text-muted-foreground text-sm">
					Asks nothing, so the screen count stays at {walk.screenTotal}.
				</p>
				<Button onclick={advance}>Continue</Button>
			</div>
		{:else}
			<div class="border-border space-y-3 rounded-xl border p-8" data-testid="walk-complete">
				<h2 class="font-display text-xl font-semibold">Walk complete</h2>
				<p class="text-muted-foreground text-sm">
					{walk.screenTotal} screens answered. The payload beside this is what 24d submits.
				</p>
			</div>
		{/if}

		<div class="flex gap-3">
			<Button variant="outline" onclick={back} disabled={cursor === 0}>Back</Button>
			<Button variant="outline" onclick={reset}>Reset</Button>
		</div>
	</div>

	<aside class="space-y-4 text-sm">
		<section class="border-border rounded-xl border p-4">
			<h2 class="font-display font-semibold">State</h2>
			<p class="text-muted-foreground mt-1">
				BMI: {bmi(answers)?.toFixed(1) ?? 'unknown'} · step {cursor + 1} of {walk.steps.length}
			</p>
			<p class="mt-1" data-testid="missing-count">
				missingRequired: <strong>{missing.length}</strong>
			</p>
			{#if missing.length > 0}
				<ul class="text-muted-foreground mt-1 space-y-0.5">
					{#each missing as name (name)}<li><code>{name}</code></li>{/each}
				</ul>
			{/if}
			<p class="mt-2" data-testid="payload-count">
				payload keys: <strong>{Object.keys(payload).length}</strong>
			</p>
		</section>

		{#if Object.keys(refusals).length > 0}
			<section class="border-destructive/40 rounded-xl border p-4">
				<h2 class="font-display font-semibold">RxScale refuses</h2>
				<ul class="mt-1 space-y-2">
					{#each Object.entries(refusals) as [id, text] (id)}
						<li><code>{id}</code><br /><span class="text-muted-foreground">{text}</span></li>
					{/each}
				</ul>
			</section>
		{/if}

		<section class="border-border rounded-xl border p-4">
			<h2 class="font-display font-semibold">Payload</h2>
			<pre
				data-testid="payload"
				class="mt-2 max-h-96 overflow-auto text-xs">{JSON.stringify(payload, null, 1)}</pre>
		</section>
	</aside>
</div>
