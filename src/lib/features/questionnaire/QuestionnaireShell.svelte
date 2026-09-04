<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import type { Snippet } from 'svelte';
	import SoleanLogo from '$lib/components/brand/SoleanLogo.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import XIcon from '@lucide/svelte/icons/x';
	import { QUESTIONNAIRE_HOME_HREF } from './routes';
	import type { QuestionnaireProgress } from './definition/position';

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
		backLabel = m.q_back(),
		children
	}: Props = $props();

	// The plan states how full the bar is, because the last question is not the last screen.
	const percent = $derived(progress?.percent ?? 0);
</script>

<!--
	`mp-sensitive` is Mixpanel's own class, and it is what makes heatmap collection safe here.

	A heatmap click carries `$elements`, one entry per ancestor, and each entry reports the
	attributes in the SDK's `TRACKED_ATTRS`. `aria-label` is among them, and this app puts
	answers there deliberately so a screen reader can name a control: `RadiogroupField` and
	`CheckboxField` label each option with its own text. Without this class a click on a
	medical option would send the chosen answer in clear, which `events.ts` forbids.

	The class is read from the SDK's hardcoded `SENSITIVE_DATA_CLASSES` rather than from the
	autocapture config, so it applies while `autocapture` is `false`. It strips the attribute
	values for this element and its subtree and leaves the click counted, which is all a
	heatmap needs. Not `mp-no-track`: `isElementBlocked` reads that one and would discard the
	click, leaving the questionnaire with no heatmap at all.

	**It does not reach portals, and that is not a detail.** `shouldTrackElementDetails` walks
	up from the clicked element and stops before `<body>`, so a class on the body is never
	seen, and anything bits-ui portals out of this subtree escapes this class too. The date
	picker's popover is one, and a browser run caught the date of birth leaving through it, so
	`DatePicker` carries its own copy. Any future questionnaire surface that portals, a dialog,
	a sheet, a select, needs the same.
-->
<div class="mp-sensitive flex min-h-svh flex-col bg-card">
	<!--
		A three-column grid, not justify-between: the reference centres the mark on the
		viewport, and unequal Back and Close widths would push it off centre.
	-->
	<nav
		aria-label={m.q_shell_label()}
		class="grid grid-cols-[1fr_auto_1fr] items-center gap-4 p-4"
	>
		<Button href={backHref} variant="secondary" size="sm" class="justify-self-start rounded-full">
			<ArrowLeftIcon aria-hidden="true" />
			{backLabel}
		</Button>

		<a
			href={QUESTIONNAIRE_HOME_HREF}
			aria-label={m.q_logo_home()}
			class="rounded-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
		>
			<SoleanLogo size="default" />
		</a>

		<Button
			href={QUESTIONNAIRE_HOME_HREF}
			variant="secondary"
			size="icon"
			aria-label={m.q_close()}
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
					aria-label={m.q_progress({ current: progress.current, total: progress.total })}
				/>
			{/if}

			<div class="mt-6">
				{@render children()}
			</div>
		</div>
	</main>
</div>
