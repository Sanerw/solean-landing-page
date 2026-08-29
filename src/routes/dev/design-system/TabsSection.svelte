<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import ShowcaseSection from './ShowcaseSection.svelte';

	const HORIZONS = [
		{ value: '3', label: '3 months', weight: '88 kg' },
		{ value: '6', label: '6 months', weight: '82 kg' },
		{ value: '12', label: '12 months', weight: '78 kg' }
	];
</script>

<ShowcaseSection
	id="tabs"
	title="Tabs"
	description="A pill-shaped segmented list, matching the questionnaire projection's 3 / 6 / 12 month switch: a muted track and a solid white pill under the active trigger. One visible panel at a time."
>
	<Tabs.Root value="6" class="max-w-md">
		<Tabs.List aria-label="Projection horizon">
			{#each HORIZONS as horizon (horizon.value)}
				<Tabs.Trigger value={horizon.value}>{horizon.label}</Tabs.Trigger>
			{/each}
		</Tabs.List>
		{#each HORIZONS as horizon (horizon.value)}
			<Tabs.Content value={horizon.value} class="mt-4 rounded-lg border border-border bg-card p-4">
				<p class="text-sm text-muted-foreground">You could reach</p>
				<p class="font-display text-3xl font-semibold">{horizon.weight}</p>
			</Tabs.Content>
		{/each}
	</Tabs.Root>

	<h3 class="mt-12 font-display text-xl font-semibold">Disabled trigger</h3>
	<Tabs.Root value="3" class="mt-4 max-w-md">
		<Tabs.List aria-label="Disabled example">
			<Tabs.Trigger value="3">Available</Tabs.Trigger>
			<Tabs.Trigger value="6" disabled>Unavailable</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="3" class="mt-4 text-sm text-muted-foreground">
			Left and Right Arrow move between enabled triggers only; the disabled one is skipped.
		</Tabs.Content>
	</Tabs.Root>
</ShowcaseSection>
