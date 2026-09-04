<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { emptyAnswers, GALLSTONES, type Answers } from '$lib/features/questionnaire/answers/types';
	import { validateScreen } from '$lib/features/questionnaire/answers/validate';
	import { bmi } from '$lib/features/questionnaire/definition/conditions';
	import { optionsFor } from '$lib/features/questionnaire/definition/kinds';
	import { QUESTIONS } from '$lib/features/questionnaire/definition/questions';
	import { buildWalk, SCREENS, visibleQuestions } from '$lib/features/questionnaire/definition/screens';

	/**
	 * A sample set of answers, not the real store: this page exists to read the definition, and
	 * driving it from the store the questionnaire uses would let a visit here leave answers
	 * behind for the flow.
	 */
	let sample = $state<Answers>(emptyAnswers());

	const walk = $derived(buildWalk(sample));
	const index = $derived(bmi(sample));
	const errors = $derived(
		new Map(SCREENS.map((screen) => [screen.id, validateScreen(screen.id, sample)]))
	);

	function toggleGallstones() {
		sample.diseases = sample.diseases.includes(GALLSTONES) ? [] : [GALLSTONES];
	}
</script>

<svelte:head><title>Questionnaire definition</title></svelte:head>

<div class="mx-auto max-w-4xl space-y-8 p-8">
	<header class="space-y-2">
		<h1 class="font-display text-3xl font-semibold">Questionnaire definition</h1>
		<p class="text-muted-foreground">
			Feature 24a. {QUESTIONS.length} questions across {SCREENS.length} screens, defined in this
			repository and mapped onto RxScale in 24b. Change the sample answers to watch the walk
			branch.
		</p>
	</header>

	<section class="border-border space-y-4 rounded-xl border p-6">
		<h2 class="font-display text-xl font-semibold">Sample answers</h2>

		<div class="flex flex-wrap gap-6">
			<label class="flex flex-col gap-1">
				<span class="text-muted-foreground text-sm">Sex</span>
				<select bind:value={sample.gender} class="border-border rounded-md border px-3 py-2">
					<option value={null}>unanswered</option>
					<option value="female">female</option>
					<option value="male">male</option>
				</select>
			</label>

			<label class="flex flex-col gap-1">
				<span class="text-muted-foreground text-sm">Height (cm)</span>
				<input bind:value={sample.heightCm} class="border-border w-28 rounded-md border px-3 py-2" />
			</label>

			<label class="flex flex-col gap-1">
				<span class="text-muted-foreground text-sm">Weight (kg)</span>
				<input bind:value={sample.weightKg} class="border-border w-28 rounded-md border px-3 py-2" />
			</label>

			<label class="flex flex-col gap-1">
				<span class="text-muted-foreground text-sm">Past medication</span>
				<select bind:value={sample.pastMedication} class="border-border rounded-md border px-3 py-2">
					<option value={null}>unanswered</option>
					{#each optionsFor(QUESTIONS.find((q) => q.id === 'pastMedication')!, sample) as option (option.value)}
						<option value={option.value}>{option.value}</option>
					{/each}
				</select>
			</label>

			<label class="flex flex-col gap-1">
				<span class="text-muted-foreground text-sm">Side effects</span>
				<select bind:value={sample.hasSideEffects} class="border-border rounded-md border px-3 py-2">
					<option value={null}>unanswered</option>
					<option value="Yes">Yes</option>
					<option value="No">No</option>
				</select>
			</label>

			<label class="flex flex-col gap-1">
				<span class="text-muted-foreground text-sm">Other medication</span>
				<select bind:value={sample.otherMedication} class="border-border rounded-md border px-3 py-2">
					<option value={null}>unanswered</option>
					<option value="yes">yes</option>
					<option value="no">no</option>
				</select>
			</label>
		</div>

		<div class="flex flex-wrap items-center gap-4">
			<button type="button" onclick={toggleGallstones} class="border-border rounded-full border px-4 py-2 text-sm">
				{sample.diseases.includes(GALLSTONES) ? 'Remove' : 'Add'} gallstones
			</button>
			<button type="button" onclick={() => (sample = emptyAnswers())} class="border-border rounded-full border px-4 py-2 text-sm">
				Reset
			</button>
			<p class="text-muted-foreground text-sm">
				BMI: {index === null ? 'not enough answers' : index.toFixed(1)} ·
				{walk.screenTotal} screens, {walk.steps.length} steps
			</p>
		</div>
	</section>

	<section class="space-y-4">
		<h2 class="font-display text-xl font-semibold">The walk</h2>

		{#each walk.steps as step (step.id)}
			{#if step.kind === 'interlude'}
				<div class="border-border text-muted-foreground rounded-xl border border-dashed p-4 text-sm">
					Interlude: {step.variant}. Asks nothing, so the count stays at {walk.screenTotal}.
				</div>
			{:else}
				{@const asked = visibleQuestions(step.screen, sample)}
				{@const screenErrors = errors.get(step.screen.id) ?? {}}
				<article class="border-border space-y-3 rounded-xl border p-6">
					<header class="flex flex-wrap items-baseline gap-3">
						<span class="text-muted-foreground text-sm">{step.screenNumber} of {walk.screenTotal}</span>
						<h3 class="font-display text-lg font-semibold">{step.screen.id}</h3>
						{#if step.screen.visibleIf}<Badge variant="secondary">conditional</Badge>{/if}
					</header>

					<ul class="space-y-3">
						{#each step.screen.questionIds as id (id)}
							{@const question = QUESTIONS.find((candidate) => candidate.id === id)!}
							{@const shown = asked.some((candidate) => candidate.id === id)}
							<li class="border-border/60 border-t pt-3" class:opacity-40={!shown}>
								<div class="flex flex-wrap items-baseline gap-2">
									<code class="text-sm">{id}</code>
									<Badge variant="accent">{question.kind}</Badge>
									{#if question.optional}<Badge variant="secondary">optional</Badge>{/if}
									{#if !shown}<Badge variant="secondary">hidden</Badge>{/if}
									{#if screenErrors[id]}<Badge variant="destructive">{screenErrors[id]}</Badge>{/if}
								</div>
								<p class="mt-1">{question.label()}</p>
								{#if question.description}
									<p class="text-muted-foreground mt-1 text-sm whitespace-pre-line">
										{question.description()}
									</p>
								{/if}
								{#if optionsFor(question, sample).length > 0}
									<ul class="text-muted-foreground mt-2 space-y-1 text-sm">
										{#each optionsFor(question, sample) as option (option.value)}
											<li>{option.label()} <code class="opacity-60">{option.value}</code></li>
										{/each}
										{#if question.hasNone}<li><em>none of the above</em> <code class="opacity-60">none</code></li>{/if}
										{#if question.hasOther}<li><em>other</em> <code class="opacity-60">other</code> into <code>{question.otherField}</code></li>{/if}
									</ul>
								{/if}
							</li>
						{/each}
					</ul>
				</article>
			{/if}
		{/each}
	</section>
</div>
