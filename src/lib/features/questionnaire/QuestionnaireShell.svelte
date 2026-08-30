<script lang="ts">
	import type { Snippet } from 'svelte';
	import SoleanLogo from '$lib/components/brand/SoleanLogo.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import FlaskConicalIcon from '@lucide/svelte/icons/flask-conical';
	import XIcon from '@lucide/svelte/icons/x';
	import { QUESTIONNAIRE_HOME_HREF } from './routes';
	import type { QuestionnaireProgress } from './steps';

	interface Props {
		/** Absent on the resume and unknown-step screens, which have no place in the count. */
		progress?: QuestionnaireProgress | null;
		backHref: string;
		backLabel?: string;
		/** Off on screens that collect nothing, so the warning stays where data is entered. */
		showPrototypeNotice?: boolean;
		children: Snippet;
	}

	let {
		progress = null,
		backHref,
		backLabel = 'Back',
		showPrototypeNotice = true,
		children
	}: Props = $props();

	const percent = $derived(
		progress && progress.total > 0 ? (progress.current / progress.total) * 100 : 0
	);
</script>

<div class="flex min-h-svh flex-col bg-background">
	<!--
		A three-column grid, not justify-between: the reference centres the mark on the
		viewport, and unequal Back and Close widths would push it off centre.
	-->
	<nav
		aria-label="Questionnaire"
		class="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-4 sm:px-6 lg:px-8"
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
			<SoleanLogo size="sm" />
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

	<main class="flex-1 px-4 pb-20 sm:px-6 lg:px-8">
		<div class="mx-auto w-full max-w-2xl">
			{#if progress}
				<Progress
					value={percent}
					aria-label="Question {progress.current} of {progress.total}"
				/>
			{/if}

			{#if showPrototypeNotice}
				<Alert.Root variant="highlighted" class="mt-6">
					<FlaskConicalIcon aria-hidden="true" />
					<Alert.Title>Prototype only</Alert.Title>
					<Alert.Description>
						Do not enter real health information. Answers are fictional sample data kept in this
						browser tab.
					</Alert.Description>
				</Alert.Root>
			{/if}

			<div class="mt-10">
				{@render children()}
			</div>
		</div>
	</main>
</div>
