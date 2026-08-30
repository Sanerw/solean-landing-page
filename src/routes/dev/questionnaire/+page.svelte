<script lang="ts">
	import * as Alert from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { createSurvey, inventory } from '$lib/features/questionnaire/survey-model';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const document = $derived(data.questionnaire.ok ? data.questionnaire.document : null);
	const model = $derived(
		document ? inventory(createSurvey(document.model), document.model) : null
	);

	const typeCounts = $derived.by(() => {
		const counts = new Map<string, number>();
		for (const question of model?.questions ?? []) {
			counts.set(question.type, (counts.get(question.type) ?? 0) + 1);
		}

		return [...counts].sort((a, b) => b[1] - a[1]);
	});
</script>

<svelte:head>
	<title>Questionnaire model | Solean dev</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
	<h1 class="font-display text-4xl font-medium">Questionnaire model</h1>
	<p class="mt-2 text-muted-foreground">
		What the RxScale anamnesis API returns for the configured questionnaire. Read-only.
	</p>

	{#if !document}
		<Alert.Root variant="destructive" class="mt-8">
			<TriangleAlertIcon aria-hidden="true" />
			<Alert.Title>No model</Alert.Title>
			<Alert.Description>
				{data.questionnaire.ok ? '' : data.questionnaire.reason} for uid
				<code>{data.uid ?? 'unset'}</code>.
			</Alert.Description>
		</Alert.Root>
	{:else if model}
		<dl class="mt-8 grid gap-4 sm:grid-cols-2">
			{#each [['Identifier', document.identifier], ['Type', document.type], ['Version', document.version], ['Uid', data.uid ?? ''], ['Pages', String(model.pageNames.length)], ['Elements', String(model.questions.length)]] as [term, value] (term)}
				<div class="rounded-lg border border-border p-4">
					<dt class="text-sm text-muted-foreground">{term}</dt>
					<dd class="mt-1 font-display text-lg break-words">{value}</dd>
				</div>
			{/each}
		</dl>

		<h2 class="mt-10 font-display text-2xl font-medium">Question types</h2>
		<ul class="mt-3 flex flex-wrap gap-2">
			{#each typeCounts as [type, count] (type)}
				<li><Badge variant="secondary">{type} &times; {count}</Badge></li>
			{/each}
		</ul>

		{#if model.unrecognised.length > 0}
			<Alert.Root variant="destructive" class="mt-8">
				<TriangleAlertIcon aria-hidden="true" />
				<Alert.Title>
					survey-core dropped {model.unrecognised.length} element{model.unrecognised.length === 1
						? ''
						: 's'}
				</Alert.Title>
				<Alert.Description>
					These types are in the model but the engine does not know them, so they are absent from
					its question list and would never render:
					{model.unrecognised.map((question) => `${question.name} (${question.type})`).join(', ')}.
				</Alert.Description>
			</Alert.Root>
		{/if}

		<h2 class="mt-10 font-display text-2xl font-medium">Elements</h2>
		<div class="mt-3 overflow-x-auto">
			<table class="w-full min-w-3xl border-collapse text-left text-sm">
				<thead>
					<tr class="border-b border-border text-muted-foreground">
						<th scope="col" class="py-2 pr-4 font-medium">Page</th>
						<th scope="col" class="py-2 pr-4 font-medium">Name</th>
						<th scope="col" class="py-2 pr-4 font-medium">Type</th>
						<th scope="col" class="py-2 pr-4 font-medium">Required</th>
						<th scope="col" class="py-2 pr-4 font-medium">visibleIf</th>
						<th scope="col" class="py-2 font-medium">In engine</th>
					</tr>
				</thead>
				<tbody>
					{#each model.questions as question (question.pageName + question.name)}
						<tr class="border-b border-border/60 align-top">
							<td class="py-2 pr-4 text-muted-foreground">{question.pageName}</td>
							<td class="py-2 pr-4 font-medium">{question.name}</td>
							<td class="py-2 pr-4"><code>{question.type}</code></td>
							<td class="py-2 pr-4">{question.isRequired ? 'yes' : 'no'}</td>
							<td class="py-2 pr-4">{question.hasVisibleIf ? 'yes' : 'no'}</td>
							<td class="py-2">{question.recognised ? 'yes' : 'no'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</main>
