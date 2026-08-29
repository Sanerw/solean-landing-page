<script lang="ts">
	import { Progress } from '$lib/components/ui/progress';
	import ShowcaseSection from './ShowcaseSection.svelte';

	// The one canonical question count this project will use once feature 7 defines
	// the real schema. Nothing here shifts it; interstitials must not either.
	const TOTAL_QUESTIONS = 9;
	let currentQuestion = $state(3);
</script>

<ShowcaseSection
	id="progress"
	title="Progress"
	description="A thin gold indicator on the reference's own warm gutter tint. The fill position is a calculated percentage of value over max, never a hardcoded pixel."
>
	<div class="max-w-xl space-y-3">
		<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
			Question {currentQuestion} of {TOTAL_QUESTIONS}
		</p>
		<Progress value={currentQuestion} max={TOTAL_QUESTIONS} aria-label="Questionnaire progress" />
		<div class="flex gap-3">
			<button
				type="button"
				class="text-sm text-muted-foreground underline underline-offset-4 hover:text-highlight-foreground disabled:pointer-events-none disabled:opacity-50"
				onclick={() => (currentQuestion = Math.max(1, currentQuestion - 1))}
				disabled={currentQuestion <= 1}
			>
				Back a question
			</button>
			<button
				type="button"
				class="text-sm text-muted-foreground underline underline-offset-4 hover:text-highlight-foreground disabled:pointer-events-none disabled:opacity-50"
				onclick={() => (currentQuestion = Math.min(TOTAL_QUESTIONS, currentQuestion + 1))}
				disabled={currentQuestion >= TOTAL_QUESTIONS}
			>
				Advance a question
			</button>
		</div>
	</div>

	<div class="mt-8 max-w-xl space-y-6">
		<div class="space-y-2">
			<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
				0 percent, question not yet started
			</p>
			<Progress value={0} max={TOTAL_QUESTIONS} aria-label="Not started" />
		</div>
		<div class="space-y-2">
			<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
				100 percent, complete
			</p>
			<Progress value={TOTAL_QUESTIONS} max={TOTAL_QUESTIONS} aria-label="Complete" />
		</div>
	</div>
</ShowcaseSection>
