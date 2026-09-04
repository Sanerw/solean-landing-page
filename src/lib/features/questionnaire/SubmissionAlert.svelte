<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import * as Alert from '$lib/components/ui/alert';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import type { AnamnesisSubmission } from './anamnesis-client';

	interface Props {
		/** What the submission itself reported, passed through rather than remapped. */
		submission: Extract<AnamnesisSubmission, { ok: false }> | null;
		/**
		 * Model questions RxScale requires that our branching never asked for. Empty in every
		 * case the contract test covers; non-empty means the two disagree, which would reach the
		 * visitor as a 400 with nothing to act on, so it is caught before anything is sent.
		 */
		incomplete: readonly string[];
	}

	let { submission, incomplete }: Props = $props();
</script>

{#if incomplete.length > 0}
	<Alert.Root variant="destructive" class="mb-5" role="alert" aria-live="assertive">
		<TriangleAlertIcon aria-hidden="true" />
		<Alert.Title>{m.q_submission_failed_title()}</Alert.Title>
		<Alert.Description>
			<p>{m.q_submission_incomplete_body()}</p>
		</Alert.Description>
	</Alert.Root>
{:else if submission}
	<!--
		The submission failed as a whole, so this sits with the screen rather than with a
		question. `assertive`, unlike a question's error: the person pressed a button and
		nothing visible moved.
	-->
	<Alert.Root
		variant="destructive"
		class="mb-5 starting:translate-y-1 starting:opacity-0 transition-[opacity,translate] duration-150 ease-out-quint motion-reduce:transition-none"
		role="alert"
		aria-live="assertive"
	>
		<TriangleAlertIcon aria-hidden="true" />
		<Alert.Title>
			{submission.reason === 'rejected'
				? m.q_submission_rejected_title()
				: m.q_submission_failed_title()}
		</Alert.Title>
		<Alert.Description>
			{#if submission.reason === 'rejected'}
				<p>{m.q_submission_rejected_body()}</p>
				{#if submission.messages.length > 0}
					<!-- The service's own words. We do not translate them or guess which question
					     each one meant, because our own validation already passed. -->
					<ul class="mt-2 list-disc ps-5">
						{#each submission.messages as message (message)}
							<li>{message}</li>
						{/each}
					</ul>
				{:else}
					<p class="mt-2">{m.q_unknown_error()}</p>
				{/if}
			{:else}
				<p>{m.q_submission_failed_body()}</p>
			{/if}
		</Alert.Description>
	</Alert.Root>
{/if}
