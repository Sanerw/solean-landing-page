<script lang="ts">
	import type { Snippet } from 'svelte';
	import SoleanLogo from '$lib/components/brand/SoleanLogo.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import XIcon from '@lucide/svelte/icons/x';
	import { QUESTIONNAIRE_HOME_HREF } from './routes';
	import type { QuestionnaireProgress } from './steps';

	interface Props {
		/** Absent on the resume and unknown-step screens, which have no place in the count. */
		progress?: QuestionnaireProgress | null;
		backHref: string;
		backLabel?: string;
		children: Snippet;
	}

	let {
		progress = null,
		backHref,
		backLabel = 'Back',
		children
	}: Props = $props();

	// The plan states how full the bar is, because the last question is not the last screen.
	const percent = $derived(progress?.percent ?? 0);
</script>

<div class="flex min-h-svh flex-col bg-card">
	<!--
		A three-column grid, not justify-between: the reference centres the mark on the
		viewport, and unequal Back and Close widths would push it off centre.
	-->
	<nav
		aria-label="Questionnaire"
		class="grid grid-cols-[1fr_auto_1fr] items-center gap-4 p-4"
	>
		<Button href={backHref} variant="secondary" size="sm" class="justify-self-start rounded-full">
			<ArrowLeftIcon aria-hidden="true" />
			{backLabel}
		</Button>

		<a
			href={QUESTIONNAIRE_HOME_HREF}
			aria-label="Solean, home"
			class="rounded-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
		>
			<SoleanLogo size="default" />
		</a>

		<Button
			href={QUESTIONNAIRE_HOME_HREF}
			variant="secondary"
			size="icon"
			aria-label="Close the questionnaire and return home"
			class="justify-self-end"
		>
			<XIcon aria-hidden="true" />
		</Button>
	</nav>

	<main class="flex-1 px-4 pb-8 sm:px-6 lg:px-8">
		<div class="mx-auto w-full max-w-2xl">
			{#if progress}
				<Progress
					value={percent}
					aria-label="Question {progress.current} of {progress.total}"
				/>
			{/if}

			<div class="mt-6">
				{@render children()}
			</div>
		</div>
	</main>
</div>
